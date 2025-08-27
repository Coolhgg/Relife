#!/usr/bin/env bash
set -euo pipefail

# --- CONFIG (do not change unless you know what you are doing) ---
TARGET_BRANCH="main"
MAIN_APP_DIR="src"
EMAIL_APP_DIR="relife-campaign-dashboard"
REMOTE="origin"
AUTO_DELETE_REMOTE_BRANCHES=false

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_TAG="pre-consolidation-${TIMESTAMP}"
LOG_DIR="ci/step-outputs/consolidation-${TIMESTAMP}"
mkdir -p "${LOG_DIR}"

echo "=== CONSOLIDATION START: ${TIMESTAMP} ==="
echo "Target branch: ${TARGET_BRANCH}"
echo "Keeping apps: ${MAIN_APP_DIR}, ${EMAIL_APP_DIR}"
echo "Logs: ${LOG_DIR}"

# 1) fetch everything and create a backup tag of the current default
git fetch --all --prune
git checkout "${TARGET_BRANCH}"
git pull "${REMOTE}" "${TARGET_BRANCH}"
git tag -a "${BACKUP_TAG}" -m "Backup before consolidation ${TIMESTAMP}"
git push "${REMOTE}" "${BACKUP_TAG}" || true
echo "Created backup tag ${BACKUP_TAG} and pushed to remote." | tee "${LOG_DIR}/run.log"

# 2) create consolidation branch from main
CONSOL_BRANCH="consolidated/merge-all-${TIMESTAMP}"
git checkout -b "${CONSOL_BRANCH}"
echo "${CONSOL_BRANCH}" > "${LOG_DIR}/consolidation_branch.txt"

# 3) enumerate remote branches (exclude HEAD and target)
mapfile -t BRANCHES < <(git for-each-ref --format='%(refname:short)' refs/remotes/"${REMOTE}" | sed "s#${REMOTE}/##" | grep -vE "^(${TARGET_BRANCH}|${CONSOL_BRANCH}|HEAD)$" || true)

echo "Found ${#BRANCHES[@]} remote branches. Listing them..." | tee "${LOG_DIR}/branches_list.txt"
printf '%s\n' "${BRANCHES[@]}" | tee -a "${LOG_DIR}/branches_list.txt"

CONFLICT_SUMMARY="${LOG_DIR}/conflicts_report.txt"
: > "${CONFLICT_SUMMARY}"
: > "${LOG_DIR}/merge_log.txt"

# 4) Merge each branch into consolidation branch
for branch in "${BRANCHES[@]}"; do
  echo "----" | tee -a "${LOG_DIR}/run.log"
  echo "Merging branch: ${branch}" | tee -a "${LOG_DIR}/run.log"
  if [[ "${branch}" == "${TARGET_BRANCH}" ]]; then
    echo "Skipping target branch ${TARGET_BRANCH}" | tee -a "${LOG_DIR}/run.log"
    continue
  fi

  # fetch branch locally
  git fetch "${REMOTE}" "${branch}:${branch}" >/dev/null 2>&1 || { echo "Could not fetch ${branch}"; echo "${branch} -> FETCH_FAILED" >> "${LOG_DIR}/merge_log.txt"; continue; }

  # attempt merge without committing to see conflicts
  set +e
  git merge --no-edit --no-ff --no-commit "${branch}"
  MERGE_EXIT=$?
  set -e

  if [[ ${MERGE_EXIT} -eq 0 ]]; then
    git commit -m "chore(merge): merge ${branch} into ${CONSOL_BRANCH} (auto)"
    echo "${branch} -> merged cleanly" >> "${LOG_DIR}/merge_log.txt"
  else
    echo "Merge conflict detected with branch ${branch}. Attempting conservative auto-resolution preferring incoming branch changes..." | tee -a "${LOG_DIR}/run.log"
    CONFLICT_FILES=$(git diff --name-only --diff-filter=U || true)
    if [[ -n "${CONFLICT_FILES}" ]]; then
      echo "Conflicted files: ${CONFLICT_FILES}" >> "${CONFLICT_SUMMARY}"
      # Accept incoming branch ("theirs") for each conflicted file and add
      while read -r file; do
        if [[ -z "$file" ]]; then continue; fi
        git checkout --theirs -- "$file" || true
        git add "$file" || true
        echo "AUTO-RESOLVE (theirs): $file" >> "${LOG_DIR}/auto_resolved_${branch}.txt"
      done <<< "${CONFLICT_FILES}"
      set +e
      git commit -m "chore(merge): merge ${branch} into ${CONSOL_BRANCH} (auto-resolved conflicts preferring incoming branch)" || {
        echo "Auto-commit failed for ${branch}. Aborting merge and marking for manual review." | tee -a "${LOG_DIR}/run.log"
        git merge --abort || true
        echo "${branch} -> MERGE_ABORTED" >> "${LOG_DIR}/merge_log.txt"
        echo "Manual merge required for ${branch}" >> "${CONFLICT_SUMMARY}"
        continue
      }
      set -e
      echo "${branch} -> merged with auto-resolve (theirs)" >> "${LOG_DIR}/merge_log.txt"
    else
      echo "Merge failed with no conflict files listed — aborting and marking for manual review." | tee -a "${LOG_DIR}/run.log"
      git merge --abort || true
      echo "${branch} -> MERGE_ABORTED_NO_FILES" >> "${LOG_DIR}/merge_log.txt"
      echo "Manual merge required for ${branch}" >> "${CONFLICT_SUMMARY}"
      continue
    fi
  fi
done

echo "All merges attempted. See ${LOG_DIR}/merge_log.txt and ${CONFLICT_SUMMARY}." | tee -a "${LOG_DIR}/run.log"

# 5) Optional: run install/build/tests to ensure consolidated branch compiles
echo "Attempting npm ci (if present) and build/test scripts..." | tee -a "${LOG_DIR}/run.log"
if [ -f package-lock.json ] || [ -f pnpm-lock.yaml ] || [ -f yarn.lock ]; then
  npm ci --no-audit --prefer-offline || echo "npm ci failed or not applicable" | tee -a "${LOG_DIR}/run.log"
fi

if npm run | grep -q "build"; then
  npm run build --silent || echo "Build failed; check logs." | tee -a "${LOG_DIR}/run.log"
fi
if npm run | grep -q "test"; then
  npm test --silent || echo "Some tests failed; review." | tee -a "${LOG_DIR}/run.log"
fi

# 6) Move secondary apps into backup, keep only MAIN_APP_DIR and EMAIL_APP_DIR
APPS_TO_KEEP=("${MAIN_APP_DIR}" "${EMAIL_APP_DIR}")
BACKUP_DIR="backup/apps_backup_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

# list top-level directories tracked in repo
ROOT_DIRS=($(git ls-tree -d --name-only HEAD || true))

for d in "${ROOT_DIRS[@]}"; do
  if [[ "${d}" == ".git" ]]; then continue; fi
  keep=false
  for k in "${APPS_TO_KEEP[@]}"; do
    if [[ "${d}" == "${k}" ]]; then keep=true; fi
  done
  if ! $keep; then
    # move into backup folder (git mv if possible)
    mkdir -p "${BACKUP_DIR}"
    git mv "${d}" "${BACKUP_DIR}/${d}" 2>/dev/null || mv "${d}" "${BACKUP_DIR}/${d}" || true
    echo "Moved ${d} -> ${BACKUP_DIR}/${d}" >> "${LOG_DIR}/apps_moved.txt"
  fi
done

git add -A
git commit -m "chore(cleanup): move secondary apps into ${BACKUP_DIR} (auto)" || true

# 7) push consolidated branch to remote
git push "${REMOTE}" "${CONSOL_BRANCH}" -u

# 8) Create a PR using gh if available
if command -v gh >/dev/null 2>&1; then
  gh pr create --base "${TARGET_BRANCH}" --head "${CONSOL_BRANCH}" --title "Consolidation: merge feature branches into ${TARGET_BRANCH}" --body "Automated consolidation branch created ${TIMESTAMP}. Please review conflicts and tests. Logs in ${LOG_DIR}."
  echo "Created PR for ${CONSOL_BRANCH} -> ${TARGET_BRANCH}" | tee -a "${LOG_DIR}/run.log"
else
  echo "gh CLI not found. Please create a PR manually from ${CONSOL_BRANCH} into ${TARGET_BRANCH}." | tee -a "${LOG_DIR}/run.log"
fi

echo "Consolidation finished. Review logs in ${LOG_DIR}. Manual review required for entries in ${CONFLICT_SUMMARY}." | tee -a "${LOG_DIR}/run.log"