# =============================================================================
# WMS Docker Makefile
# =============================================================================
# Quick commands for managing the Docker environment
# =============================================================================

.PHONY: help dev prod start stop restart build migrate seed superuser \
        logs logs-backend logs-frontend logs-celery shell bash dbshell \
        clean backup restore status test

.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# Default target
help:
	@echo ""
	@echo "$(BLUE)WMS Docker Commands$(NC)"
	@echo "==================="
	@echo ""
	@echo "$(GREEN)Setup & Start:$(NC)"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production environment"
	@echo ""
	@echo "$(GREEN)Control:$(NC)"
	@echo "  make stop         - Stop all containers"
	@echo "  make restart      - Restart all containers"
	@echo "  make status       - Show container status"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed initial data"
	@echo "  make superuser    - Create a superuser"
	@echo "  make dbshell      - Open PostgreSQL shell"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database (requires BACKUP=file.sql.gz)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make logs         - View all logs"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend- View frontend logs"
	@echo "  make logs-celery  - View celery logs"
	@echo "  make shell        - Open Django shell"
	@echo "  make bash         - Open bash in backend container"
	@echo ""
	@echo "$(GREEN)Cleanup:$(NC)"
	@echo "  make clean        - Remove all containers and volumes"
	@echo "  make prune        - Docker system prune"
	@echo ""

# =============================================================================
# Development Commands
# =============================================================================

dev:
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	@echo "$(BLUE)Building and starting development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# =============================================================================
# Production Commands
# =============================================================================

prod:
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose up -d

prod-build:
	@echo "$(BLUE)Building and starting production environment...$(NC)"
	docker-compose up -d --build

prod-down:
	docker-compose down

# =============================================================================
# Generic Commands
# =============================================================================

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose restart

status:
	docker-compose ps

build:
	docker-compose build

# =============================================================================
# Database Commands
# =============================================================================

migrate:
	@echo "$(BLUE)Running migrations...$(NC)"
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

seed:
	@echo "$(BLUE)Seeding data...$(NC)"
	docker-compose exec backend python manage.py seed_roles || true
	docker-compose exec backend python manage.py seed_document_types || true
	docker-compose exec backend python manage.py seed_templates || true
	docker-compose exec backend python manage.py create_demo_users || true
	@echo "$(GREEN)Seeding complete!$(NC)"

superuser:
	docker-compose exec backend python manage.py createsuperuser

dbshell:
	docker-compose exec db psql -U $${DB_USER:-postgres} -d $${DB_NAME:-wms_db}

backup:
	@echo "$(BLUE)Creating database backup...$(NC)"
	./scripts/backup-db.sh

restore:
ifndef BACKUP
	@echo "$(YELLOW)Usage: make restore BACKUP=./backups/backup_file.sql.gz$(NC)"
else
	./scripts/restore-db.sh $(BACKUP)
endif

# =============================================================================
# Logging Commands
# =============================================================================

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-celery:
	docker-compose logs -f celery celery-beat

logs-db:
	docker-compose logs -f db

# =============================================================================
# Shell Access
# =============================================================================

shell:
	docker-compose exec backend python manage.py shell

bash:
	docker-compose exec backend bash

# =============================================================================
# Cleanup Commands
# =============================================================================

clean:
	@echo "$(YELLOW)This will remove all containers and volumes!$(NC)"
	@read -p "Are you sure? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v --remove-orphans
	@echo "$(GREEN)Cleanup complete!$(NC)"

prune:
	docker system prune -f

clean-all:
	docker-compose down -v --remove-orphans --rmi all
	docker system prune -af

# =============================================================================
# Testing
# =============================================================================

test:
	docker-compose exec backend python manage.py test

test-coverage:
	docker-compose exec backend coverage run manage.py test
	docker-compose exec backend coverage report

# =============================================================================
# Health Check
# =============================================================================

health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:8000/api/health/ && echo "$(GREEN)Backend: OK$(NC)" || echo "$(YELLOW)Backend: Not responding$(NC)"
	@curl -s http://localhost/health && echo "$(GREEN)Frontend: OK$(NC)" || echo "$(YELLOW)Frontend: Not responding$(NC)"
	@docker-compose exec -T db pg_isready -U postgres && echo "$(GREEN)Database: OK$(NC)" || echo "$(YELLOW)Database: Not responding$(NC)"
	@docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo "$(GREEN)Redis: OK$(NC)" || echo "$(YELLOW)Redis: Not responding$(NC)"

# =============================================================================
# Quick Setup
# =============================================================================

setup: dev-build migrate seed
	@echo "$(GREEN)Setup complete! Development environment is running.$(NC)"
	@echo ""
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000/api/"
	@echo "Admin:    http://localhost:8000/admin/"
	@echo ""
	@echo "Demo users: admin/admin123, clerk/clerk123"
