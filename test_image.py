import unittest
import image as ImageClass
import pdb

class Test(unittest.TestCase):

   request_form = {'upload': 'http://dummyurl'}
   request_files = []
   request_url = None

   image = ImageClass.Image(request_form, request_files, request_url)

   def test_image(self):
       self.assertFalse(self.image.isimage)

if __name__ == '__main__':
   # begin the unittest.main()
   unittest.main()
