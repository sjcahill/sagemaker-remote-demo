FROM amazonlinux:2023

ARG NB_USER="sagemaker-user"
ARG NB_UID="1000"
ARG NB_GID="100"

# Update the package repository and install packages
RUN dnf update -y \
    && yum install -y python3 python3-pip shadow-utils python3-devel gcc \ 
    && yum clean all \
    && rm -rf /var/cache/yum


# Add a new user with the specified UID/GID and create the home directory
RUN useradd --create-home --shell /bin/bash --gid "${NB_GID}" --uid "${NB_UID}" "${NB_USER}"

# Install jupyter which installs ipykernel as a dependency
RUN pip3 install --no-cache-dir jupyter

USER root


