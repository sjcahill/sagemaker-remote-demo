FROM python:3.11.1

ENV STUDIO_LOGGING_DIR="/var/log/studio/"
# Install jupyter which installs ipykernel as a dependency
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir ipykernel sagemaker-ssh-helper awscli boto3 numpy pandas && \
    python -m ipykernel install --sys-prefix

RUN mkdir -p /etc/amazon/ssm
COPY seelog.xml /etc/amazon/ssm/seelog.xml
COPY kernel_lc_config.sh .

RUN sm-setup-ssh configure && \
    sm-ssh-ide configure --ssh-only && \
    mkdir -p /var/log/amazon/ssm



