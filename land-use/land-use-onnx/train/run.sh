#!/bin/bash

docker run --rm -it -d \
    --name=land-use-onnx \
    --runtime=nvidia \
    --ipc=host \
    -p 8888:8888 \
    -v ${PWD}/ipynb:/workspace/ipynb \
    land-use-onnx \
    jupyter notebook --NotebookApp.token=$1 --ip=0.0.0.0 --port=8888 --allow-root --no-browser
