#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h db -p 5432 -U ${DB_USER:-postgres}; do
    sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if not exists (optional)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || true
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

exec "$@"
