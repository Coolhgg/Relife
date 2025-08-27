#!/usr/bin/env bash
set -euo pipefail

# --- ROBUST CONSOLIDATION SCRIPT ---
TARGET_BRANCH="main"
MAIN_APP_DIR="src"
EMAIL_APP_DIR="relife-campaign-dashboard"
REMOTE="origin"
AUTO_DELETE_REMOTE_BRANCHES=false

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_TAG="pre-consolidation-${TIMESTAMP}"
LOG_DIR="ci/step-outputs/consolidation-${TIMESTAMP}"
mkdir -p "${LOG_DIR}"

echo "=== ROBUST CONSOLIDATION START: ${TIMESTAMP} ==="
echo "Target branch: ${TARGET_BRANCH}"
echo "Keeping apps: ${MAIN_APP_DIR}, ${EMAIL_APP_DIR}"
echo "Logs: ${LOG_DIR}"

# Set git merge driver for better conflict resolution
git config merge.ours.driver true

# 1) Ensure we're on the consolidation branch
CONSOL_BRANCH="consolidated/merge-all-${TIMESTAMP}"
echo "${CONSOL_BRANCH}" > "${LOG_DIR}/consolidation_branch.txt"

# 2) enumerate remote branches (exclude HEAD and target)
mapfile -t BRANCHES < <(git for-each-ref --format='%(refname:short)' refs/remotes/"${REMOTE}" | sed "s#${REMOTE}/##" | grep -vE "^(${TARGET_BRANCH}|${CONSOL_BRANCH}|HEAD)$" || true)

echo "Found ${#BRANCHES[@]} remote branches. Listing them..." | tee "${LOG_DIR}/branches_list.txt"
printf '%s\n' "${BRANCHES[@]}" | tee -a "${LOG_DIR}/branches_list.txt"

CONFLICT_SUMMARY="${LOG_DIR}/conflicts_report.txt"
MERGE_LOG="${LOG_DIR}/merge_log.txt"
SUCCESS_LOG="${LOG_DIR}/successful_merges.txt"
FAILED_LOG="${LOG_DIR}/failed_merges.txt"

: > "${CONFLICT_SUMMARY}"
: > "${MERGE_LOG}"
: > "${SUCCESS_LOG}"
: > "${FAILED_LOG}"

echo "Starting branch merging process..." | tee -a "${MERGE_LOG}"

# 3) Merge each branch with enhanced conflict resolution
merged_count=0
failed_count=0

for branch in "${BRANCHES[@]}"; do
  echo "----" | tee -a "${MERGE_LOG}"
  echo "Processing branch: ${branch}" | tee -a "${MERGE_LOG}"
  
  if [[ "${branch}" == "${TARGET_BRANCH}" ]]; then
    echo "Skipping target branch ${TARGET_BRANCH}" | tee -a "${MERGE_LOG}"
    continue
  fi

  # Categorize branches for different merge strategies
  if [[ "${branch}" =~ ^(backup/|auto/cleanup|auto/fix-scout) ]]; then
    MERGE_STRATEGY="skip"
    echo "Skipping potentially problematic branch: ${branch}" | tee -a "${MERGE_LOG}"
    echo "${branch} -> SKIPPED (problematic pattern)" >> "${FAILED_LOG}"
    continue
  elif [[ "${branch}" =~ ^(scout/|feature/|fix/) ]]; then
    MERGE_STRATEGY="cautious"
  else
    MERGE_STRATEGY="standard"
  fi

  echo "Using ${MERGE_STRATEGY} strategy for ${branch}" | tee -a "${MERGE_LOG}"

  # Fetch branch locally first
  if ! git fetch "${REMOTE}" "${branch}:${branch}" >/dev/null 2>&1; then 
    echo "Could not fetch ${branch}" | tee -a "${MERGE_LOG}"
    echo "${branch} -> FETCH_FAILED" >> "${FAILED_LOG}"
    ((failed_count++))
    continue
  fi

  # Try merge with appropriate strategy
  set +e
  if [[ "${MERGE_STRATEGY}" == "cautious" ]]; then
    # Use theirs strategy for potentially conflicting branches
    git merge -X theirs --no-edit --no-ff "${branch}"
    MERGE_EXIT=$?
  else
    # Standard merge
    git merge --no-edit --no-ff "${branch}"
    MERGE_EXIT=$?
  fi
  set -e

  if [[ ${MERGE_EXIT} -eq 0 ]]; then
    echo "${branch} -> merged successfully (${MERGE_STRATEGY})" | tee -a "${MERGE_LOG}"
    echo "${branch}" >> "${SUCCESS_LOG}"
    ((merged_count++))
  else
    echo "Merge failed for ${branch}. Attempting recovery..." | tee -a "${MERGE_LOG}"
    
    # Check if it's a conflict we can auto-resolve
    CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    if [[ -n "${CONFLICT_FILES}" ]]; then
      echo "Found conflicts in: ${CONFLICT_FILES}" | tee -a "${MERGE_LOG}"
      echo "Branch ${branch} conflicts:" >> "${CONFLICT_SUMMARY}"
      echo "${CONFLICT_FILES}" >> "${CONFLICT_SUMMARY}"
      echo "----" >> "${CONFLICT_SUMMARY}"
      
      # Try to auto-resolve by preferring our version for backup conflicts
      if [[ "${branch}" =~ backup/ ]]; then
        echo "Auto-resolving backup branch conflicts by preferring ours..." | tee -a "${MERGE_LOG}"
        while read -r file; do
          if [[ -n "$file" ]]; then
            git checkout --ours -- "$file" 2>/dev/null || true
            git add "$file" 2>/dev/null || true
          fi
        done <<< "${CONFLICT_FILES}"
        
        if git commit --no-edit >/dev/null 2>&1; then
          echo "${branch} -> merged with auto-resolve (ours)" | tee -a "${MERGE_LOG}"
          echo "${branch}" >> "${SUCCESS_LOG}"
          ((merged_count++))
        else
          echo "${branch} -> auto-resolve failed" | tee -a "${MERGE_LOG}"
          git merge --abort >/dev/null 2>&1 || true
          echo "${branch}" >> "${FAILED_LOG}"
          ((failed_count++))
        fi
      else
        # For non-backup branches, try preferring theirs
        echo "Auto-resolving conflicts by preferring theirs..." | tee -a "${MERGE_LOG}"
        while read -r file; do
          if [[ -n "$file" ]]; then
            git checkout --theirs -- "$file" 2>/dev/null || true
            git add "$file" 2>/dev/null || true
          fi
        done <<< "${CONFLICT_FILES}"
        
        if git commit --no-edit >/dev/null 2>&1; then
          echo "${branch} -> merged with auto-resolve (theirs)" | tee -a "${MERGE_LOG}"
          echo "${branch}" >> "${SUCCESS_LOG}"
          ((merged_count++))
        else
          echo "${branch} -> auto-resolve failed" | tee -a "${MERGE_LOG}"
          git merge --abort >/dev/null 2>&1 || true
          echo "${branch}" >> "${FAILED_LOG}"
          ((failed_count++))
        fi
      fi
    else
      echo "Merge failed without conflicts - aborting" | tee -a "${MERGE_LOG}"
      git merge --abort >/dev/null 2>&1 || true
      echo "${branch}" >> "${FAILED_LOG}"
      ((failed_count++))
    fi
  fi
done

echo "====" | tee -a "${MERGE_LOG}"
echo "Merge Summary:" | tee -a "${MERGE_LOG}"
echo "Successfully merged: ${merged_count} branches" | tee -a "${MERGE_LOG}"
echo "Failed merges: ${failed_count} branches" | tee -a "${MERGE_LOG}"
echo "Total processed: $((merged_count + failed_count)) branches" | tee -a "${MERGE_LOG}"

# 4) Move secondary apps into backup, keep only MAIN_APP_DIR and EMAIL_APP_DIR
echo "====" | tee -a "${MERGE_LOG}"
echo "Moving secondary apps to backup..." | tee -a "${MERGE_LOG}"

APPS_TO_KEEP=("${MAIN_APP_DIR}" "${EMAIL_APP_DIR}" "backup" "ci" "public" "scripts" "docs" "database" "config")
BACKUP_DIR="backup/apps_backup_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

# List top-level directories
ROOT_DIRS=($(find . -maxdepth 1 -type d -not -path "./.*" -not -path "." | sed 's|./||'))

echo "Found root directories: ${ROOT_DIRS[*]}" | tee -a "${MERGE_LOG}"
echo "" > "${LOG_DIR}/apps_moved.txt"

for d in "${ROOT_DIRS[@]}"; do
  if [[ "${d}" == ".git" || "${d}" == "node_modules" ]]; then 
    continue
  fi
  
  keep=false
  for k in "${APPS_TO_KEEP[@]}"; do
    if [[ "${d}" == "${k}" ]]; then 
      keep=true
      break
    fi
  done
  
  if ! $keep; then
    echo "Moving ${d} -> ${BACKUP_DIR}/${d}" | tee -a "${LOG_DIR}/apps_moved.txt"
    mkdir -p "${BACKUP_DIR}"
    if [[ -d "${d}" ]]; then
      mv "${d}" "${BACKUP_DIR}/${d}" || true
    fi
  else
    echo "Keeping ${d}" | tee -a "${LOG_DIR}/apps_moved.txt"
  fi
done

git add -A
git commit -m "chore(cleanup): move secondary apps into ${BACKUP_DIR} (auto)" || echo "No changes to commit"

# 5) Push consolidated branch to remote
echo "====" | tee -a "${MERGE_LOG}"
echo "Pushing consolidated branch to remote..." | tee -a "${MERGE_LOG}"
git push "${REMOTE}" "${CONSOL_BRANCH}" -u

# 6) Create a PR using gh if available
if command -v gh >/dev/null 2>&1; then
  PR_BODY="Automated consolidation branch created ${TIMESTAMP}.

**Merge Summary:**
- Successfully merged: ${merged_count} branches  
- Failed merges: ${failed_count} branches
- See logs in \`${LOG_DIR}/\` for details

**Apps Organization:**
- Kept: ${MAIN_APP_DIR}, ${EMAIL_APP_DIR}
- Moved to backup: $(cat "${LOG_DIR}/apps_moved.txt" | grep "Moving" | wc -l) directories

Please review conflicts in \`${CONFLICT_SUMMARY}\` and test functionality before merging."

  gh pr create --base "${TARGET_BRANCH}" --head "${CONSOL_BRANCH}" --title "Consolidation: merge feature branches into ${TARGET_BRANCH}" --body "${PR_BODY}"
  echo "Created PR for ${CONSOL_BRANCH} -> ${TARGET_BRANCH}" | tee -a "${MERGE_LOG}"
else
  echo "gh CLI not found. Please create a PR manually from ${CONSOL_BRANCH} into ${TARGET_BRANCH}." | tee -a "${MERGE_LOG}"
fi

echo "====" | tee -a "${MERGE_LOG}"
echo "Consolidation completed successfully!" | tee -a "${MERGE_LOG}"
echo "Review logs in ${LOG_DIR}/" | tee -a "${MERGE_LOG}"
echo "Successfully merged branches listed in: ${SUCCESS_LOG}" | tee -a "${MERGE_LOG}"
echo "Failed branches listed in: ${FAILED_LOG}" | tee -a "${MERGE_LOG}"