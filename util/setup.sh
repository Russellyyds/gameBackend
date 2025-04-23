#!/bin/sh
rm -f .git/hooks/pre-commit
ln -s "../../util/pre-commit.sh" ".git/hooks/pre-commit"
chmod +x ".git/hooks/pre-commit"

# Configure Git to always pass --ignore-deps to the pre-commit hook
git config core.preCommitHook "--ignore-deps"