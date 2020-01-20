FROM nvidia/cuda:10.0-cudnn7-runtime-ubuntu16.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    wget \
    unzip \
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
    scikit-learn \
    scikit-image \
    tqdm \
    opencv 

RUN pip --no-cache-dir install \
    --upgrade pip \
    albumentations \
    jupyter_contrib_nbextensions

RUN jupyter contrib nbextension install --user
RUN jupyter nbextension enable codefolding/main
RUN jupyter nbextension enable collapsible_headings/main
RUN jupyter nbextension enable scroll_down/main
RUN jupyter nbextension enable execute_time/ExecuteTime
RUN jupyter nbextension enable livemdpreview/livemdpreview
RUN jupyter nbextension enable spellchecker/main

WORKDIR /workspace
RUN chmod -R a+w .