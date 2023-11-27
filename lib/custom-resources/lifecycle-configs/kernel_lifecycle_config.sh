#!/bin/bash

set -eu 

# A lifecycle configuration script for SageMaker Studio kernel gateway.
# See SageMaker_SSH_IDE.ipynb for manual configuration and for explanation of commands.
# See https://docs.aws.amazon.com/sagemaker/latest/dg/studio-lcc.html .

# Replace with your JetBrains License Server host name
# OR keep it as is and put the value into ~/.sm-jb-license-server inside SageMaker Studio to override
JB_LICENSE_SERVER_HOST="jetbrains-license-server.example.com"

# Replace with your password
# OR keep it as is and populate ~/.vnc/passwd inside SageMaker Studio to override (see https://linux.die.net/man/1/vncpasswd ).
VNC_PASSWORD="123456"

# This is just a placeholder, replace with a local UserId
# OR keep it as is and put the value into ~/.sm-ssh-owner inside SageMaker Studio to override
LOCAL_USER_ID="AIDACKCEVSQ6C2EXAMPLE:terry@SSO"

# Get metadata from /opt/ml/metadata/resource-metadata.json
# Assumes this is being run on sagemaker kernel gateway app
resource_metadata=/opt/ml/metadata/resource-metadata.json
if command -v jq >/dev/null 2>&1; then
    LOCAL_USER_ID=$(jq --raw-output ".UserProfileName" $resource_metadata)
fi
echo "LOCAL_USER_ID is $LOCAL_USER_ID"

if [ -f /opt/sagemaker-ssh-helper/.ssh-ide-configured ]; then
    echo 'kernel-lc-config.sh: INFO - SageMaker SSH Helper is already installed, remove /opt/sagemaker-ssh-helper/.ssh-ide-configured to reinstall'
else
  pip3 uninstall -y -q awscli
  pip3 install -q sagemaker-ssh-helper

  # Uncomment two lines below to update SageMaker SSH Helper to the latest dev version from the main branch
  #git clone https://github.com/aws-samples/sagemaker-ssh-helper.git ./sagemaker-ssh-helper/ || echo 'Already cloned'
  #cd ./sagemaker-ssh-helper/ && git pull --no-rebase && git clean -f && pip install . && cd ..
fi

sm-ssh-ide get-metadata

which python3

# We assume that the kernels are is installed into the sys prefix, e.g. with ipykernel install --sys-prefix command
SYSTEM_PYTHON_PREFIX=$(python3 -c "from __future__ import print_function;import sys; print(sys.prefix)")
export JUPYTER_PATH="$SYSTEM_PYTHON_PREFIX/share/jupyter/"

# If already configured in the container, it will not take any effect:
sm-ssh-ide configure
#sm-ssh-ide configure --ssh-only

# NOTE: If NOT configuring with --ssh-only flag, make sure the instance has at least 8 GB of RAM for the desktop apps

# Useful only in combination with VNC (keep it default, if configuring with --ssh-only flag):
sm-ssh-ide set-jb-license-server "$JB_LICENSE_SERVER_HOST"

# If configured with --ssh-only flag, will not take any effect (safe to keep the default):
sm-ssh-ide set-vnc-password "$VNC_PASSWORD"

sm-ssh-ide set-local-user-id "$LOCAL_USER_ID"

sm-ssh-ide init-ssm

sm-ssh-ide stop
sm-ssh-ide start

nohup sm-ssh-ide ssm-agent &