#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^crm-v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: $0 crm-v<major>.<minor>.<patch>" >&2
  exit 1
fi

release_tag="$1"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
template_path="${repo_root}/apps/crm/infra/azuredeploy.json"
temporary_template="${template_path}.tmp"
release_base="https://github.com/3netra-co/thelendersapp-toolkit/releases/download/${release_tag}"

az bicep build \
  --file "${repo_root}/apps/crm/infra/main.bicep" \
  --outfile "${temporary_template}"

jq \
  --arg api "${release_base}/released-package.zip" \
  --arg web "${release_base}/crm-web.zip" \
  '.parameters.functionPackageUri.defaultValue = $api | .parameters.webPackageUri.defaultValue = $web' \
  "${temporary_template}" \
  > "${template_path}"

rm "${temporary_template}"

printf 'Prepared %s for %s\n' "${template_path}" "${release_tag}"
