#!/bin/bash

EXCLUDE_PATTERN='^lib/custom-resources/lifecycle-configs/kernel_lifecycle_config\.sh$'

ACCOUNT_REGEX='[0-9]{12}'
PROFILE_REGEX='[0-9]{12}_Admin'
ACCESS_KEY_REGEX='[A-Z0-9]{16,}'
SECRET_KEY_REGEX='[A-Za-z0-9/+=]{40}'

for FILE in $(git diff --cached --name-only); do
  if [[ $FILE =~ $EXCLUDE_PATTERN ]]; then
    continue
fi
  if grep -E "$ACCOUNT_REGEX" "$FILE"; then
    echo "Potential AWS Account Number found in $FILE"
    exit 1
  fi
  if grep -E "$PROFILE_REGEX" "$FILE"; then
    echo "Potential AWS Account Number found in $FILE"
    exit 1
  fi
  if grep -E "$ACCESS_KEY_REGEX" "$FILE"; then
    echo "Potential AWS Access Key ID found in $FILE"
    exit 1
  fi
  if grep -E "$SECRET_KEY_REGEX" "$FILE"; then
    echo "Potential AWS Secret Access Key found in $FILE"
    exit 1
  fi
done

exit 0