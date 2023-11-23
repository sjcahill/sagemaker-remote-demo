#!/bin/bash

set -euo pipefail


# This assumes you have a private ECR repository called `sagemaker-custom-images`
repo_name="sagemaker-custom-images"
image_name="sagemaker-image"

if [[ $1 == "--profile" ]]; then
    profile=$2
fi

if [[ -z "${profile}" ]]; then
    echo "Must pass in a value for profile"
    exit 1
fi

account=$(aws sts get-caller-identity --profile "${profile}" | jq --raw-output ".Account")

echo "Your account number is ${account}"

aws ecr get-login-password --region us-east-1 --profile "${profile}" | docker login --username AWS --password-stdin ${account}.dkr.ecr.us-east-1.amazonaws.com

docker build -t ${sagemaker_image}:latest .

docker tag ${sagemaker_image}:latest ${account}.dkr.ecr.us-east-1.amazonaws.com/${repo_name}:my-sagemaker-image   

docker push ${account}.dkr.ecr.us-east-1.amazonaws.com/${repo_name}:my-sagemaker-image