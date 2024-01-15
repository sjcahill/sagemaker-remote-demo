FROM public.ecr.aws/lambda/python:3.10

# Copy function code to /var/task folder in image
COPY . ${LAMBDA_TASK_ROOT}

# Install function runtime dependencies defined in requirements.txt
RUN python -m pip install -r requirements.txt --target ${LAMBDA_TASK_ROOT}

# Set the CMD to point at the handler of your function
CMD [ "example_function.handler" ]