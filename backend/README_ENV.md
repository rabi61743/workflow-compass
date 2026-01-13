# Environment Variables Documentation

## Backend Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing | `django-insecure-abc123...` |
| `DB_NAME` | PostgreSQL database name | `wms_db` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your-password` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_DEBUG` | Enable debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `CELERY_BROKER_URL` | Redis URL for Celery | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | Redis URL for Celery results | `redis://localhost:6379/0` |

### Paperless-ngx Integration

| Variable | Description | Default |
|----------|-------------|---------|
| `PAPERLESS_URL` | Paperless-ngx server URL | `http://10.26.204.149:7000` |
| `PAPERLESS_API_TOKEN` | API token for authentication | _(required for integration)_ |

### Email Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `localhost` |
| `EMAIL_PORT` | SMTP server port | `25` |
| `EMAIL_USE_TLS` | Enable TLS | `False` |
| `EMAIL_HOST_USER` | SMTP username | _(empty)_ |
| `EMAIL_HOST_PASSWORD` | SMTP password | _(empty)_ |
| `DEFAULT_FROM_EMAIL` | Default sender email | `noreply@wms.gov.np` |

## Frontend Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application display name | `Workflow Management System` |
| `VITE_APP_ENV` | Environment name | `development` |
| `VITE_ENABLE_PAPERLESS` | Enable Paperless integration | `true` |
| `VITE_ENABLE_FILE_UPLOAD` | Enable file uploads | `true` |
| `VITE_ENABLE_REALTIME` | Enable real-time features | `false` |

## Setup Instructions

### Backend Setup

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   nano .env
   ```

3. Generate a secure Django secret key:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```

### Frontend Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```bash
   nano .env.local
   ```

## Production Recommendations

### Security
- Set `DJANGO_DEBUG=False`
- Use a strong, unique `DJANGO_SECRET_KEY`
- Configure `DJANGO_ALLOWED_HOSTS` with your domain
- Enable HTTPS with `SECURE_SSL_REDIRECT=True`

### Database
- Use a managed PostgreSQL service
- Enable SSL connections
- Set up regular backups

### Redis
- Use a managed Redis service for Celery
- Enable authentication

### Email
- Use a transactional email service (SendGrid, AWS SES, etc.)
- Configure SPF/DKIM records for deliverability
