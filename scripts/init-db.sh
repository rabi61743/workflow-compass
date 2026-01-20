#!/bin/bash
# =============================================================================
# WMS Database Initialization Script
# =============================================================================
# Run this after containers are up to initialize the database
# Usage: ./scripts/init-db.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== WMS Database Initialization ===${NC}"
echo ""

# Run migrations
echo -e "${BLUE}[1/5]${NC} Running database migrations..."
docker-compose exec -T backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

# Seed roles
echo -e "${BLUE}[2/5]${NC} Seeding roles and permissions..."
docker-compose exec -T backend python manage.py seed_roles || true
echo -e "${GREEN}✓ Roles seeded${NC}"

# Seed document types
echo -e "${BLUE}[3/5]${NC} Seeding document types..."
docker-compose exec -T backend python manage.py seed_document_types || true
echo -e "${GREEN}✓ Document types seeded${NC}"

# Seed templates
echo -e "${BLUE}[4/5]${NC} Seeding letter templates..."
docker-compose exec -T backend python manage.py seed_templates || true
echo -e "${GREEN}✓ Templates seeded${NC}"

# Create demo users
echo -e "${BLUE}[5/5]${NC} Creating demo users..."
docker-compose exec -T backend python manage.py create_demo_users || true
echo -e "${GREEN}✓ Demo users created${NC}"

echo ""
echo -e "${GREEN}=== Database Initialization Complete ===${NC}"
echo ""
echo -e "${YELLOW}Demo Users:${NC}"
echo "  admin / admin123"
echo "  clerk / clerk123"
echo "  officer / officer123"
echo "  approver / approver123"
echo ""

# Optional: Create superuser
echo -e "${BLUE}Would you like to create a superuser? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    docker-compose exec backend python manage.py createsuperuser
fi
