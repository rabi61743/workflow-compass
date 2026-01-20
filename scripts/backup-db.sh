#!/bin/bash
# =============================================================================
# WMS Database Backup Script
# =============================================================================
# Creates a timestamped backup of the PostgreSQL database
# Usage: ./scripts/backup-db.sh
# =============================================================================

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="wms_backup_${TIMESTAMP}.sql.gz"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== WMS Database Backup ===${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup..."
docker-compose exec -T db pg_dump -U ${DB_USER:-postgres} ${DB_NAME:-wms_db} | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

echo -e "${GREEN}✓ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}${NC}"

# Show backup size
ls -lh "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 10 backups
echo "Cleaning old backups..."
cd "$BACKUP_DIR" && ls -t wms_backup_*.sql.gz | tail -n +11 | xargs -r rm --
echo -e "${GREEN}✓ Cleanup complete${NC}"
