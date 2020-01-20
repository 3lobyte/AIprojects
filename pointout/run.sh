
#!/bin/bash

docker run --rm -it -d \
    --name=pointout_example \
    --runtime=nvidia \
    --ipc=host \
    -p 8888:8888 \
    -v ${PWD}/ipynb:/workspace/ipynb \
    pointout_example \
    jupyter notebook --NotebookApp.token=$1 --ip=0.0.0.0 --port=8888 --allow-root --no-browser