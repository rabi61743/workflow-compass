#!/bin/bash
#=============================================================================
# WMS Docker Setup Script
# Automated setup for development and production environments
#=============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║     WMS - Workflow Management System                         ║"
    echo "║     Docker Setup Script                                      ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Setup environment files
setup_env() {
    print_info "Setting up environment files..."
    
    # Create root .env if not exists
    if [ ! -f ".env" ]; then
        if [ -f "docker.env.example" ]; then
            cp docker.env.example .env
            print_success "Created .env from docker.env.example"
        else
            cat > .env << 'EOF'
# =============================================================================
# WMS Docker Environment Configuration
# =============================================================================

# Database Configuration
DB_NAME=wms_db
DB_USER=postgres
DB_PASSWORD=wms_secure_password_2024

# Django Configuration
DJANGO_SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:5173,http://localhost:3000,http://frontend

# Frontend Configuration
VITE_API_URL=http://localhost:8000/api

# Paperless-ngx Integration (Optional)
PAPERLESS_URL=http://10.26.204.149:7000
PAPERLESS_API_TOKEN=

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@wms.gov.np
EOF
            print_success "Created .env with default values"
        fi
        print_warning "Please update .env with your actual values"
    else
        print_info ".env already exists, skipping..."
    fi
    
    # Create backend .env if not exists
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env from backend/.env.example"
        fi
    fi
}

# Build Docker images
build_images() {
    local env=$1
    print_info "Building Docker images for $env environment..."
    
    if [ "$env" == "dev" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    else
        docker-compose build
    fi
    
    print_success "Docker images built successfully"
}

# Start containers
start_containers() {
    local env=$1
    print_info "Starting containers in $env mode..."
    
    if [ "$env" == "dev" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
    
    print_success "Containers started"
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    # Wait for database
    print_info "Waiting for PostgreSQL..."
    until docker-compose exec -T db pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-wms_db} 2>/dev/null; do
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_info "Waiting for Redis..."
    until docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for backend
    print_info "Waiting for Django backend..."
    sleep 5
    until curl -s http://localhost:8000/api/health/ > /dev/null 2>&1 || [ $? -eq 52 ]; do
        sleep 2
    done
    print_success "Backend is ready"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    docker-compose exec -T backend python manage.py migrate --noinput
    print_success "Migrations completed"
}

# Seed initial data
seed_data() {
    print_info "Seeding initial data..."
    
    # Seed roles and permissions
    docker-compose exec -T backend python manage.py seed_roles || true
    print_success "Roles seeded"
    
    # Seed document types
    docker-compose exec -T backend python manage.py seed_document_types || true
    print_success "Document types seeded"
    
    # Seed letter templates
    docker-compose exec -T backend python manage.py seed_templates || true
    print_success "Templates seeded"
}

# Create demo users
create_demo_users() {
    print_info "Creating demo users..."
    docker-compose exec -T backend python manage.py create_demo_users || true
    print_success "Demo users created"
}

# Create superuser
create_superuser() {
    print_info "Creating superuser..."
    echo ""
    print_warning "You will be prompted to create a superuser account"
    docker-compose exec backend python manage.py createsuperuser
}

# Collect static files
collect_static() {
    print_info "Collecting static files..."
    docker-compose exec -T backend python manage.py collectstatic --noinput --clear 2>/dev/null || true
    print_success "Static files collected"
}

# Show status
show_status() {
    echo ""
    print_info "Container Status:"
    docker-compose ps
    echo ""
}

# Show URLs
show_urls() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  WMS is now running!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Frontend:${NC}      http://localhost:5173  (dev) / http://localhost (prod)"
    echo -e "  ${BLUE}Backend API:${NC}   http://localhost:8000/api/"
    echo -e "  ${BLUE}Admin Panel:${NC}   http://localhost:8000/admin/"
    echo ""
    echo -e "  ${YELLOW}Demo Users:${NC}"
    echo -e "    Admin:      admin / admin123"
    echo -e "    Clerk:      clerk / clerk123"
    echo -e "    Officer:    officer / officer123"
    echo -e "    Approver:   approver / approver123"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

# Stop containers
stop_containers() {
    print_info "Stopping containers..."
    docker-compose down
    print_success "Containers stopped"
}

# Clean up everything
cleanup() {
    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup complete"
    fi
}

# Show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Development setup
setup_dev() {
    print_banner
    print_info "Setting up DEVELOPMENT environment..."
    echo ""
    
    check_docker
    setup_env
    build_images "dev"
    start_containers "dev"
    wait_for_services
    run_migrations
    seed_data
    create_demo_users
    collect_static
    show_status
    show_urls
}

# Production setup
setup_prod() {
    print_banner
    print_info "Setting up PRODUCTION environment..."
    echo ""
    
    check_docker
    setup_env
    
    # Ensure debug is off in production
    sed -i 's/DJANGO_DEBUG=True/DJANGO_DEBUG=False/' .env 2>/dev/null || true
    
    build_images "prod"
    start_containers "prod"
    wait_for_services
    run_migrations
    seed_data
    collect_static
    show_status
    
    echo ""
    print_warning "For production, you should create a superuser manually:"
    echo "  ./setup.sh superuser"
    echo ""
    show_urls
}

# Quick start (uses existing images)
quick_start() {
    local env=${1:-dev}
    print_banner
    print_info "Quick starting $env environment..."
    
    start_containers "$env"
    wait_for_services
    show_status
    show_urls
}

# Show help
show_help() {
    print_banner
    echo "Usage: ./setup.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev           Setup and start development environment (default)"
    echo "  prod          Setup and start production environment"
    echo "  start         Quick start (uses existing images)"
    echo "  stop          Stop all containers"
    echo "  restart       Restart all containers"
    echo "  build         Rebuild Docker images"
    echo "  migrate       Run database migrations"
    echo "  seed          Seed initial data (roles, document types, templates)"
    echo "  superuser     Create a superuser account"
    echo "  demo-users    Create demo users"
    echo "  logs          Show logs (optionally specify service: logs backend)"
    echo "  status        Show container status"
    echo "  shell         Open Django shell"
    echo "  bash          Open bash in backend container"
    echo "  dbshell       Open PostgreSQL shell"
    echo "  cleanup       Remove all containers and volumes"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh dev          # Full development setup"
    echo "  ./setup.sh prod         # Full production setup"
    echo "  ./setup.sh logs backend # View backend logs"
    echo "  ./setup.sh shell        # Open Django shell"
    echo ""
}

# Main script logic
main() {
    local command=${1:-dev}
    
    case $command in
        dev)
            setup_dev
            ;;
        prod)
            setup_prod
            ;;
        start)
            quick_start "${2:-dev}"
            ;;
        stop)
            stop_containers
            ;;
        restart)
            stop_containers
            start_containers "${2:-dev}"
            show_status
            ;;
        build)
            build_images "${2:-dev}"
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            seed_data
            ;;
        superuser)
            create_superuser
            ;;
        demo-users)
            create_demo_users
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        shell)
            docker-compose exec backend python manage.py shell
            ;;
        bash)
            docker-compose exec backend bash
            ;;
        dbshell)
            docker-compose exec db psql -U ${DB_USER:-postgres} -d ${DB_NAME:-wms_db}
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
