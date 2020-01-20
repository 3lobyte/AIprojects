FROM nvidia/cuda:10.0-cudnn7-devel-ubuntu16.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    #cmake \
    git \
    curl \
    wget \
    unzip \
    #ca-certificates \
    #libjpeg-dev \
    #libpng-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -o ~/miniconda.sh -O  https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh  && \
    chmod +x ~/miniconda.sh && \
    ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -ya

ENV PATH /opt/conda/bin:$PATH

RUN conda install pytorch torchvision cudatoolkit=10.0 -c pytorch

RUN conda install \
    jupyter \
    pandas \
    matplotlib \
    scikit-learn

RUN conda install tqdm
RUN conda install -c conda-forge onnx

WORKDIR /workspace
RUN chmod -R a+w .