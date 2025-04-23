#!/bin/bash

[[ "$1" = '--ignore-deps' ]] && ignore=true || ignore=false

# Define array of ignored files
ignored_files=(
  'frontend/package.json'
  'frontend/package-lock.json'
  'frontend/yarn.lock'
  'frontend/pnpm-lock.yaml'
)

# Check number of lines
if $ignore; then
  # Build command to ignore all deps files
  command="git diff --stat --cached"
  for file in "${ignored_files[@]}"; do
    command+=" -- ':!/$file'"
  done
else
  command='git diff --stat --cached'
fi
insertions="$(eval "$command" | grep -Eo '[0-9]+ insertions' | sed 's/ insertions//g')"

# Check if the only changes are to deps files
only_ignored_files=true
for file in $(git diff --cached --name-only); do
  is_ignored_file=false
  for ignored_file in "${ignored_files[@]}"; do
    if [[ "$file" == "$ignored_file" ]]; then
      is_ignored_file=true
      break
    fi
  done
  if ! $is_ignored_file; then
    only_ignored_files=false
    break
  fi
done

if ! $only_ignored_files && [[ "$insertions" -gt 200 ]]; then
  eval "$command"
  echo -e "\033[0;31m"
  echo "================================================================================"
  echo "= Looks like you are trying to commit $insertions lines of code                          ="
  echo -n "$(tput bold)"
  echo "= Commit rejected                                                              ="
  echo -n "$(tput sgr0)"
  echo -e -n "\033[0;31m"
  # If any file was staged (and not ignored),
  # notify the user that it should be in a separate commit
  if ! $ignore; then
    for file in "${ignored_files[@]}"; do
      if git diff --cached --name-only | grep -Fxq "$file"; then
        echo "= Note: you should commit '$file' in a separate commit    ="
      fi
    done
  fi
  echo "================================================================================"
  echo -e "\033[0m"
  exit 1
fi