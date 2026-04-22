#!/bin/bash
# Workspace backup script
# Runs: every day at 05:00

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
WORKSPACE="/home/ubuntu"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Zip the workspace (exclude large unnecessary folders)
zip -r "$BACKUP_DIR/backup-$DATE.zip" $WORKSPACE \
  --exclude "*.git*" \
  --exclude "node_modules/*" \
  --exclude "backup-*"

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t backup-*.zip | tail -n +8 | xargs -r rm

# Commit to git if changes exist
cd $WORKSPACE
git add -A
git commit -m "Backup $DATE" 2>/dev/null

# Push to GitHub (only if there are changes)
git push origin main 2>/dev/null

echo "Backup complete: $DATE"