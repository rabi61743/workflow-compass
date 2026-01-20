#!/bin/bash
# =============================================================================
# WMS Database Restore Script
# =============================================================================
# Restores the PostgreSQL database from a backup file
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz>
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: ./scripts/restore-db.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}=== WMS Database Restore ===${NC}"
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop backend services
echo "Stopping backend services..."
docker-compose stop backend celery celery-beat

# Restore database
echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | docker-compose exec -T db psql -U ${DB_USER:-postgres} -d ${DB_NAME:-wms_db}

# Restart services
echo "Restarting services..."
docker-compose start backend celery celery-beat

echo -e "${GREEN}✓ Database restored successfully${NC}"
