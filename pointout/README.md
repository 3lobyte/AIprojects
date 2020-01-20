# POINTOUT

In this repository you will find an example on how to train an object detection deep learning algorithm using a dataset downloaded from [POINTOUT](https://targetdetection.com/). 

POINTOUT is a web platform to build collaborative datasets for object detection on satellite images. You can register to start making annotations directly onto the map in a wide variety of objects. If you find the tool useful, feel free to add more annotations or even create new datasets !

In [data.ipynb](ipynb/data.ipynb) you will learn how to download a dataset and process it so it can be used to train a model. Once you feel comfortable with the data, go to [train_ssd.ipynb](ipynb/train_ssd.ipynb) to see an example on how to train a target detection deep learning model (SSD in this case) using the data generated before.

## Instructions

### Running on Google Colab

If you are familiar with Google Colab, just click the **Open in Colab** buttons bellow. Make sure to copy the notebook to your Google Drive and select the GPU runtime in order to share data between notebooks.


| Data exploration | Training SSD |
| ---------------- | -------- |
| [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/juansensio/pointout/blob/master/ipynb/data.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/juansensio/pointout/blob/master/ipynb/train_ssd.ipynb)  |



### Running locally

If you prefer to run it locally, it is recommended to use Docker. 

First, build the docker image

```sh
./build.sh
```

Then, start the container

```sh
./run.sh <your_access_token>
```

You can now open the notebook on [localhost:8888](http://localhost:8888).

Note that you will need an NVIDIA GPU with CUDA10 and CUDNN7 installed.

## Dependencies

- docker
- nvidia-docker