import argparse
import boto3
import logging
import os
import sys
import pandas as pd


logging.basicConfig(stream=sys.stdout, format="%(asctime)s %(levelname)s %(message)s", level=logging.INFO)
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    logger.info(f"Event passed to lamdba is {event}")
    main()


def main():
    ...


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", "p", default=os.environ.get("AWS_PROFILE"))
    parser.add_argument("--region", "-r", default="us-east-1")
    args, _ = parser.parse_known_args()
    print(f"Using profile {args.profile} to run lambda locally")
    print(f"Using region {args.region} to run lambda locally")

    main(args.profile, args.region)
