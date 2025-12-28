#!/bin/bash

# This script triggers a repository_dispatch event in the private-ops repository.
# It requires a Personal Access Token (PAT) with 'Actions: Write' scope on the private-ops repo.

PRIVATE_REPO_OWNER="centervil"
PRIVATE_REPO_NAME="private-ops"
EVENT_TYPE="spotify-upload"
CONFIG_FILE=${1:-"test-show.json"}

if [ -z "$GH_PAT_PRIVATE_OPS" ]; then
  echo "Error: GH_PAT_PRIVATE_OPS environment variable is not set."
  exit 1
fi

curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GH_PAT_PRIVATE_OPS" \
  https://api.github.com/repos/${PRIVATE_REPO_OWNER}/${PRIVATE_REPO_NAME}/dispatches \
  -d "{\"event_type\": \"${EVENT_TYPE}\", \"client_payload\": {\"config_file\": \"${CONFIG_FILE}\"}}"

echo "Triggered ${EVENT_TYPE} in ${PRIVATE_REPO_NAME} with config ${CONFIG_FILE}."
