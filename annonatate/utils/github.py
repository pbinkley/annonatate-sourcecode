#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, json
import base64
from flask_github import GitHub

class GitHubAnno(GitHub):
    def get_existing(self, session, full_url):
        payload = {'ref': session['github_branch']}
        match = False
        if '/images/' in full_url:
            full_url, match = full_url.strip('/').rsplit('/', 1)
        existing = self.raw_request('get',full_url, params=payload).json()
        if match and type(existing) == list:
            matches = list(filter(lambda x: x['name'] == match, existing))
            existing = matches[0] if len(matches) > 0 else matches
        if 'sha' in existing:
            return existing['sha']
        else:
            return ''

    def sendgithubrequest(self, session, filename, annotation, path, order=''):
        data = self.createdatadict(session, filename, annotation, path, order)
        response = self.raw_request('put', data['url'], data=json.dumps(data['data'], indent=4))
        return response

    def createdatadict(self, session, filename, text, path, order=''):
        full_url = os.path.join(session['github_url'], path, filename)
        sha = self.get_existing(session, full_url)
        writeordelete = "write" if text != 'delete' else "delete"
        message = "{} {}".format(writeordelete, filename)
        text = '---\ncanvas: "{}"\n{}---\n{}'.format(text['target']['source'],order, json.dumps(text, indent=4)) if type(text) != str and type(text) != bytes else text
        text = text.encode('utf-8') if type(text) != bytes else text
        data = {"message":message, "content": base64.b64encode(text).decode('utf-8'), "branch": session['github_branch'] }
        if sha != '':
            data['sha'] = sha
        return {'data':data, 'url':full_url}

    def updateAnnos(self, session, filepath):
        try:
            githubresponse = self.get(session['currentworkspace']['contents_url'].replace('{+path}', filepath))
            githubfilenames = list(map(lambda x: x['name'], githubresponse))
            session['annotations'] = list(filter(lambda x: x['filename'].split('/')[-1] in githubfilenames, session['annotations']))
            return githubresponse
        except:
            return False