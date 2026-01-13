#!/bin/bash
# Initialize database with migrations and optional seed data

set -e

echo "=== WMS Database Initialization ==="

# Run migrations
echo "Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser
echo ""
echo "Creating superuser..."
docker-compose exec backend python manage.py createsuperuser

echo ""
echo "=== Database initialization complete ==="
