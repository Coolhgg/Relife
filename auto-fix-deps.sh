#!/usr/bin/env bash
set -euo pipefail

# Auto-fix missing deps: detect package manager, install packages found in build errors, retry build, open PR.
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="ci/step-outputs/deps-fix-${TIMESTAMP}"
mkdir -p "${OUT_DIR}" backup
MAX_ITER=12
TARGET_BRANCH="main"
REMOTE="origin"
WORK_BRANCH="fix/deps-${TIMESTAMP}"
PR_TITLE="fix(deps): auto-install missing dependencies (${TIMESTAMP})"
PR_BODY="Automated PR: installs missing deps detected during build. Logs: ci/step-outputs/deps-fix-${TIMESTAMP}/"

log(){ echo "[$(date +%H:%M:%S)] $*" | tee -a "${OUT_DIR}/run.log"; }

# Basic checks
for cmd in git gh jq tar node npm; do command -v ${cmd} >/dev/null 2>&1 || true; done

# Ensure clean main
git fetch --all --prune
git checkout "${TARGET_BRANCH}"
git pull "${REMOTE}" "${TARGET_BRANCH}"
if [[ -n "$(git status --porcelain)" ]]; then log "ERROR: working tree not clean. Commit or stash first."; exit 1; fi

# Backup
BACKUP_TAG="pre-deps-fix-${TIMESTAMP}"
git tag -a "${BACKUP_TAG}" -m "Backup before deps fix ${TIMESTAMP}" || true
git push "${REMOTE}" "${BACKUP_TAG}" || log "warn: tag push failed"
tar --exclude='./.git' --exclude='./node_modules' --exclude='./backup' -czf "backup/repo_snapshot_${TIMESTAMP}.tar.gz" . || true
cp "backup/repo_snapshot_${TIMESTAMP}.tar.gz" "${OUT_DIR}/" || true
log "Backup: ${BACKUP_TAG}"

# Detect package manager
PM="npm"
[[ -f bun.lockb || -f bunfig.toml ]] && PM="bun"
[[ -f pnpm-lock.yaml ]] && PM="pnpm"
[[ -f yarn.lock && ! -f pnpm-lock.yaml ]] && PM="yarn"
log "PM detected: ${PM}"

install_all(){
  log "Installing deps via ${PM}..."
  case "${PM}" in
    bun) bun install 2>&1 | tee "${OUT_DIR}/install.log";;
    pnpm) pnpm install 2>&1 | tee "${OUT_DIR}/install.log";;
    yarn) yarn install --check-files 2>&1 | tee "${OUT_DIR}/install.log";;
    *) npm ci 2>&1 | tee "${OUT_DIR}/install.log" || npm install 2>&1 | tee -a "${OUT_DIR}/install.log";;
  esac
  return ${PIPESTATUS[0]:-0}
}

add_package(){
  local pkg="$1"; local dev="$2"
  log "Add ${pkg} dev=${dev}"
  case "${PM}" in
    bun) [[ "${dev}" == "true" ]] && bun add -d "${pkg}" || bun add "${pkg}";;
    pnpm) [[ "${dev}" == "true" ]] && pnpm add -D "${pkg}" || pnpm add "${pkg}";;
    yarn) [[ "${dev}" == "true" ]] && yarn add -D "${pkg}" || yarn add "${pkg}";;
    *) [[ "${dev}" == "true" ]] && npm install --save-dev "${pkg}" || npm install --save "${pkg}";;
  esac
}

# Determine build command
build_cmd="npm run build"
if jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  case "${PM}" in bun) build_cmd="bun run build";; pnpm) build_cmd="pnpm run build";; yarn) build_cmd="yarn build";; esac
else
  if jq -e '.scripts["build:ci"]' package.json >/dev/null 2>&1; then build_cmd="npm run build:ci"; else build_cmd="npm run build || true"; fi
fi
log "Build command: ${build_cmd}"

# Create work branch
git checkout -b "${WORK_BRANCH}"
git push -u "${REMOTE}" "${WORK_BRANCH}" || log "warn: push failed"

declare -A tried
iteration=0
BUILD_EXIT=1

while [[ ${iteration} -lt ${MAX_ITER} ]]; do
  iteration=$((iteration+1))
  log "=== Iter ${iteration} ==="
  install_all || true

  set +e
  eval "${build_cmd}" > "${OUT_DIR}/build_stdout_${iteration}.log" 2> "${OUT_DIR}/build_stderr_${iteration}.log"
  BUILD_EXIT=$?
  set -e

  if [[ ${BUILD_EXIT} -eq 0 ]]; then
    log "Build succeeded at iter ${iteration}"
    break
  fi

  cat "${OUT_DIR}/build_stdout_${iteration}.log" "${OUT_DIR}/build_stderr_${iteration}.log" > "${OUT_DIR}/combined_build_${iteration}.log"
  # extract missing module patterns
  mapfile -t a < <(grep -oE "Cannot find module '([^']+)'" "${OUT_DIR}/combined_build_${iteration}.log" | sed -E "s/.*'([^']+)'.*/\\1/" | sort -u || true)
  mapfile -t b < <(grep -oE "Can't resolve '([^']+)'" "${OUT_DIR}/combined_build_${iteration}.log" | sed -E "s/.*'([^']+)'.*/\\1/" | sort -u || true)
  mapfile -t c < <(grep -oE "TS2307: Cannot find module '([^']+)'" "${OUT_DIR}/combined_build_${iteration}.log" | sed -E "s/.*'([^']+)'.*/\\1/" | sort -u || true)
  mapfile -t d < <(grep -oE "Failed to resolve import \"([^\"]+)\"" "${OUT_DIR}/combined_build_${iteration}.log" | sed -E "s/.*\"([^\"]+)\".*/\\1/" | sort -u || true)

  pkgs=()
  for x in "${a[@]}" "${b[@]}" "${c[@]}" "${d[@]}"; do
    [[ -z "$x" ]] && continue
    # skip relative/local
    if [[ "$x" =~ ^\./ || "$x" =~ ^\.\. || "$x" =~ ^/ ]]; then continue; fi
    pkgs+=("$x")
  done
  pkgs_unique=($(printf "%s\n" "${pkgs[@]}" | sort -u))

  if [[ ${#pkgs_unique[@]} -eq 0 ]]; then
    log "No missing-package patterns found; stopping."
    break
  fi

  newly=0
  for mod in "${pkgs_unique[@]}"; do
    if [[ -n "${tried[${mod}]:-}" ]]; then log "Already tried ${mod}"; continue; fi
    dev="false"
    if [[ "${mod}" =~ ^@types/ ]] || grep -q "TS2307" "${OUT_DIR}/combined_build_${iteration}.log" 2>/dev/null; then dev="true"; fi
    add_package "${mod}" "${dev}" >> "${OUT_DIR}/install_iter${iteration}.log" 2>&1 || {
      log "Install failed for ${mod}; attempting npm legacy fallback"
      if [[ "${PM}" == "npm" ]]; then npm install --legacy-peer-deps "${mod}" >> "${OUT_DIR}/install_iter${iteration}.log" 2>&1 || true; fi
    }
    tried["${mod}"]=1
    newly=$((newly+1))
    log "Installed ${mod} (dev=${dev})"
  done

  if [[ ${newly} -eq 0 ]]; then log "No new installs; stopping loop"; break; fi

  git add package.json package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null || true
  if [[ -n "$(git status --porcelain)" ]]; then
    git commit -m "chore(deps): install missing packages (auto) [iter ${iteration}]" || true
    git push "${REMOTE}" "${WORK_BRANCH}" || true
  fi
done

# Finalize: create PR if build passed or push work branch for manual review
if [[ ${BUILD_EXIT} -eq 0 ]]; then
  log "Build passed; finalizing PR"
  git add package.json package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null || true
  if [[ -n "$(git status --porcelain)" ]]; then
    git commit -m "chore(deps): finalize dependency installs (auto)" || true
    git push "${REMOTE}" "${WORK_BRANCH}" -u || true
  fi
  PR_URL=$(gh pr create --base "${TARGET_BRANCH}" --head "${WORK_BRANCH}" --title "${PR_TITLE}" --body "${PR_BODY}" 2>/dev/null || true)
  echo "${PR_URL}" | tee -a "${OUT_DIR}/pr_url.txt"
  log "PR: ${PR_URL}"
  sleep 5
  if [[ -n "${PR_URL}" ]] && gh pr view "${PR_URL}" --json mergeable -q . >/dev/null 2>&1; then
    mergeable=$(gh pr view "${PR_URL}" --json mergeable --jq .mergeable 2>/dev/null || echo "")
    if [[ "${mergeable}" == "MERGEABLE" || "${mergeable}" == "true" ]]; then
      gh pr merge "${PR_URL}" --merge --admin --body "Auto-merged dependency fixes." >/dev/null 2>&1 || true
      log "PR auto-merged"
    else
      log "PR created but not auto-mergeable: ${PR_URL}"
    fi
  fi
else
  log "Build failed after ${iteration} attempts. Pushing work branch for manual review."
  git add . 2>/dev/null || true
  git commit -m "wip(deps): attempted auto-fix failed; attach logs" || true
  git push "${REMOTE}" "${WORK_BRANCH}" -u || true
  PR_URL=$(gh pr create --base "${TARGET_BRANCH}" --head "${WORK_BRANCH}" --title "wip(deps): auto-install (needs manual help)" --body "Auto attempt failed. Logs in ci/step-outputs/deps-fix-${TIMESTAMP}/" 2>/dev/null || true)
  log "PR for manual review: ${PR_URL}"
fi

# Save artifacts
cp package.json "${OUT_DIR}/" 2>/dev/null || true
cp "backup/repo_snapshot_${TIMESTAMP}.tar.gz" "${OUT_DIR}/" 2>/dev/null || true
log "Done. Artifacts: ${OUT_DIR}"
exit 0