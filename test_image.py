import unittest
import image as ImageClass
import responses
import requests
import json

import pdb

# using responses to mock up responses to http requests: https://github.com/getsentry/responses

class Test(unittest.TestCase):
   @responses.activate

   def test_image(self):
      info_json = '{"@context":"http://iiif.io/api/image/2/context.json","@id":"https://www.wallandbinkley.com/rcb/tiles/images/world-0001","protocol":"http://iiif.io/api/image","width":1784,"height":3282,"sizes":[{"width":1784,"height":3282},{"width":136,"height":250}],"profile":["http://iiif.io/api/image/2/level0.json",{"supports":["cors","sizeByWhListed","baseUriRedirect"]}],"tiles":[{"width":512,"scaleFactors":[1,2,4,8]}]}'
      responses.add(responses.GET, 'https://www.wallandbinkley.com/rcb/tiles/images/world-0001/info.json',
                     json=info_json, 
                     status=200)

      request_form = {'upload': 'https://www.wallandbinkley.com/rcb/tiles/images/world-0001', 'label': 'This is the label', 'direction': 'left-to-right', 'description': 'This is the description', 'rights': 'This is the rights'}
      request_files = []
      request_url = 'http://session/origin_url'

      image = ImageClass.Image(request_form, request_files, request_url)

      self.assertFalse(image.isimage)

#   def test_manifest(self):
#      self.assertEqual(image.manifest.label, 'This is the label')

if __name__ == '__main__':
   # begin the unittest.main()
   unittest.main()
