from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from model import Model
from PIL import Image
import numpy as np 
import torch

app = Flask(__name__)
CORS(app)
api = Api(app)

cats = [
    'airplane',
    'runway',
    'golfcourse',
    'agricultural',
    'mediumresidential',
    'mobilehomepark',
    'river',
    'tenniscourt',
    'parkinglot',
    'overpass',
    'freeway',
    'denseresidential',
    'chaparral',
    'harbor',
    'storagetanks',
    'buildings',
    'sparseresidential',
    'forest',
    'intersection',
    'baseballdiamond',
    'beach'
]

# load model
net = torch.load('./model.pth')
net.eval()   

class Predict(Resource):
    def post(self):

        # get image from request
        img = request.files.get('file') 
        img.save('./'+img.filename)     

        # load image
        img = Image.open(img.filename).convert('RGB').resize((224,224))
        img = np.array(img)
        img = torch.FloatTensor(img.transpose((2,0,1)) / 255)

        # get predictions
        pred = net(img.unsqueeze(0)).squeeze()
        pred_lab = torch.argmax(pred).item()
        prediction = cats[pred_lab]

        return {'prediction': prediction}

api.add_resource(Predict, '/predict')

if __name__ == '__main__':
    app.run(port=8000, debug=True)