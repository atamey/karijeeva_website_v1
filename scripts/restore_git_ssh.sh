#!/usr/bin/env bash
# Restore git SSH deploy key after pod restart.
# Safe to run multiple times; idempotent.
# Usage:  bash /app/scripts/restore_git_ssh.sh  &&  git push origin main
set -euo pipefail

mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Re-hydrate the private + public key from the persistent /app volume.
if [[ ! -f /app/.secrets/karijeeva_deploy ]]; then
  echo "FAIL: /app/.secrets/karijeeva_deploy missing — regenerate a deploy key" >&2
  exit 1
fi
cp -f /app/.secrets/karijeeva_deploy     /root/.ssh/karijeeva_deploy
cp -f /app/.secrets/karijeeva_deploy.pub /root/.ssh/karijeeva_deploy.pub
chmod 600 /root/.ssh/karijeeva_deploy
chmod 644 /root/.ssh/karijeeva_deploy.pub

# Re-install the Host alias block if missing.
if ! grep -q "Host github.com-karijeeva" /root/.ssh/config 2>/dev/null; then
  cat >> /root/.ssh/config <<'SSHCFG'

Host github.com-karijeeva
  HostName github.com
  User git
  IdentityFile /root/.ssh/karijeeva_deploy
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
SSHCFG
  chmod 600 /root/.ssh/config
fi

# Pre-seed github.com in known_hosts (idempotent; dedups on append).
touch /root/.ssh/known_hosts
ssh-keyscan -t ed25519,rsa github.com 2>/dev/null >> /root/.ssh/known_hosts
sort -u /root/.ssh/known_hosts -o /root/.ssh/known_hosts

echo "✅ SSH deploy key restored — ready to 'git push origin main'"
