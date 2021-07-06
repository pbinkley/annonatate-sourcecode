#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import pdb
from iiif_prezi.factory import ManifestFactory
import requests

class Image:
    def __init__(self, request, session):
        self.iiifimage = request.form['upload'] # might be 'uploadimage', or a url
        self.uploadurl = False
        self.isimage = bool(re.match("^upload(iiif|image)$", self.iiifimage.strip()))
        self.origin_url = session['origin_url']
        self.request_form = request.form

        if not self.isimage:
            # handle uploaded external url
            self.imgurl, self.iiiffolder = self.iiifimage.rstrip('/').rsplit('/', 1)
            self.imgurl += '/'
            self.manifestpath = "manifests/{}".format(self.iiiffolder)
            self.url = self.iiifimage
            self.tmpfilepath = False
            self.manifesturl = "{}{}/manifest.json".format(self.origin_url, self.manifestpath)
            self.manifest = createmanifest(self.tmpfilepath, self.imgurl, self.url, self.iiiffolder, self.request_form, self.manifesturl)
            if type(self.manifest) == dict:
                self.template_name = 'upload.html'
                self.template_vars = {'error': self.manifest['error']}
            else:
                self.manifest = self.manifest.toString(compact=False).replace('canvas/info.json', 'info.json').replace('https://{{site.url}}', '{{site.url}}')
            self.manifest = "---\n---\n{}".format(self.manifest)
        else:
            # handle uploaded image
            self.file = request.files['file']
            self.encodedimage = self.file.stream.read()

def createjekyllfile(contents, filename, iiifpath):
    jekyllstring = "---\n---\n{}".format(contents)
    with open(os.path.join(iiifpath, filename), 'w') as file:
        file.write(jekyllstring)

def createmanifest(tmpfilepath, imgurl, url, iiiffolder, formdata, manifesturl):
    try:
        fac = ManifestFactory()
        fac.set_base_prezi_uri(url)
        fac.set_base_image_uri(imgurl)
        fac.set_iiif_image_info(2.0, 2)
        manifest = fac.manifest(ident=manifesturl, label=formdata['label'])
        manifest.viewingDirection = formdata['direction']
        manifest.description = formdata['description']
        manifest.set_metadata({"rights": formdata['rights']})
        seq = manifest.sequence()
        cvs = seq.canvas(ident='info', label=formdata['label'])
        anno = cvs.annotation()
        img = anno.image(iiiffolder, iiif=True)
    except Exception as e:
        return {'error': e}

    if tmpfilepath:
        img.set_hw_from_file(tmpfilepath)
    else:
        try:
            img.set_hw_from_iiif()
        except:
            try:
                response = requests.get("{}{}/info.json".format(imgurl, iiiffolder))
                if response.status_code > 299:
                    response = requests.get("{}{}".format(imgurl, iiiffolder))
                try:
                    content = response.json()
                except:
                    return {'error': 'No IIIF image exists at {}{}'.format(imgurl, iiiffolder)}
                    # im = Image.open(BytesIO(response.content))
                    # print(im.size)
                    # content = {'height': im.size[1], 'width': im.size[0]}
                img.height = content['height']
                img.width = content['width']
            except:
                return {'error': 'Unable to get height/width for image located at {}{}'.format(imgurl, iiiffolder)}
    cvs.height = img.height
    cvs.width = img.width
    return manifest
