FROM public.ecr.aws/sagemaker/sagemaker-distribution:latest-cpu as base_image

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir sagemaker-ssh-helper

USER root

RUN mkdir -p /etc/amazon/ssm
COPY seelog.xml /etc/amazon/ssm/seelog.xml

RUN sm-setup-ssh configure && \
    sm-ssh-ide configure --ssh-only && \
    mkdir -p /var/log/amazon/ssm

