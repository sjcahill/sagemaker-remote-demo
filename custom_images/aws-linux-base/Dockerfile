FROM public.ecr.aws/amazon-linux/amazon-linux:2

ARG NB_USER="sagemaker-user"
ARG NB_UID="1000"
ARG NB_GUID="100"

RUN \
    yum install --assumeyes pytho3 shadowutils && \
    useradd --create-home --shell /bin/bash --gid ${NB_GUID} --uid ${NB_UID} ${NB_USER} && \
    yum clean all && \
    python3 -m pip install ipykernel && \
    python -m ipykernel install

USER root


