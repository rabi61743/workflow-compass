#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h ${DB_HOST:-db} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}; do
    echo "Database is not ready. Waiting..."
    sleep 2
done
echo "Database is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis..."
while ! redis-cli -h ${REDIS_HOST:-redis} ping > /dev/null 2>&1; do
    echo "Redis is not ready. Waiting..."
    sleep 2
done
echo "Redis is ready!"

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if environment variables are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || echo "Superuser already exists"
fi

# Seed initial data
echo "Seeding initial data..."
python manage.py seed_roles || echo "Roles already seeded"
python manage.py seed_document_types || echo "Document types already seeded"
python manage.py seed_templates || echo "Templates already seeded"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Startup complete!"
exec "$@"
