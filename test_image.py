import unittest
import image as ImageClass
import requests
import requests_mock
import json

class Test(unittest.TestCase):
   def test_image(self):
      request_form = {'upload': 'file:testdata/imagetest', 'label': 'This is the label', 'direction': 'left-to-right', 'description': 'This is the description', 'rights': 'This is the rights'}
      request_files = []
      request_url = 'http://session/origin_url/'

      image = ImageClass.Image(request_form, request_files, request_url)
      self.assertFalse(image.isimage)
      self.assertEqual(image.manifest.label, 'This is the label')
      mfst = image.manifest.toJSON(top=True)
      self.assertEqual(mfst['sequences'][0]['canvases'][0]['width']
, 1784)

if __name__ == '__main__':
   # begin the unittest.main()
   unittest.main()
