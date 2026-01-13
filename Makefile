# WMS Docker Makefile
# ====================

.PHONY: help build up down logs shell migrate superuser clean dev prod

# Default target
help:
	@echo "WMS Docker Commands"
	@echo "==================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production environment"
	@echo "  make prod-down    - Stop production environment"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make superuser    - Create a superuser"
	@echo "  make db-shell     - Open database shell"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs         - View all logs"
	@echo "  make logs-backend - View backend logs"
	@echo "  make shell        - Open backend shell"
	@echo "  make clean        - Remove all containers and volumes"

# Development commands
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Production commands
prod:
	docker-compose up -d

prod-build:
	docker-compose up -d --build

prod-down:
	docker-compose down

# Database commands
migrate:
	docker-compose exec backend python manage.py migrate

superuser:
	docker-compose exec backend python manage.py createsuperuser

db-shell:
	docker-compose exec db psql -U $${DB_USER:-postgres} -d $${DB_NAME:-wms_db}

# Logging
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-celery:
	docker-compose logs -f celery

# Shell access
shell:
	docker-compose exec backend python manage.py shell

bash:
	docker-compose exec backend bash

# Cleanup
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Build only
build:
	docker-compose build

# Restart services
restart:
	docker-compose restart

restart-backend:
	docker-compose restart backend celery celery-beat
