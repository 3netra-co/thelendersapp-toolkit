#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_dir="${repo_root}/dist/azure-installer"
api_dir="${repo_root}/apps/crm/api"
web_dir="${repo_root}/apps/crm/web"

rm -rf "${release_dir}"
mkdir -p "${release_dir}/api-package" "${release_dir}/web-package"

cp "${api_dir}/function_app.py" "${api_dir}/host.json" "${api_dir}/requirements.txt" "${release_dir}/api-package/"
cp -R "${api_dir}/crm_api" "${release_dir}/api-package/crm_api"

(
  cd "${release_dir}/api-package"
  zip -q -r "${release_dir}/released-package.zip" . \
    -x '*/__pycache__/*' '*.pyc'
)

(
  cd "${web_dir}"
  npm ci
  npm run typecheck
  npm run build
  cd dist/web
  zip -q -r "${release_dir}/crm-web.zip" .
)

az bicep build \
  --file "${repo_root}/apps/crm/infra/main.bicep" \
  --outfile "${release_dir}/azuredeploy.json"

rm -rf "${release_dir}/api-package" "${release_dir}/web-package"

printf 'Created Azure installer artifacts in %s\n' "${release_dir}"
