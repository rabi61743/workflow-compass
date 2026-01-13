# WMS Backend - Django REST API

This is the Django backend for the Workflow Management System (WMS).

## Project Structure

```
backend/
├── config/                 # Django project configuration
│   ├── settings.py        # Main settings
│   ├── urls.py            # Root URL configuration
│   └── wsgi.py            # WSGI entry point
├── apps/
│   ├── accounts/          # User management & authentication
│   │   └── models.py      # User, UserRole, Permission
│   ├── organization/      # Office hierarchy
│   │   └── models.py      # Office, Designation
│   ├── darta/             # Incoming letters
│   │   └── models.py      # DartaLetter, DartaRecipient, DocumentType
│   ├── chalani/           # Outgoing letters
│   │   └── models.py      # ChalaniLetter, ChalaniRecipient, LetterTemplate
│   ├── workflow/          # Workflow & file tracking
│   │   └── models.py      # WorkflowStep, FileTracker, Attachment, AuditLog
│   └── notifications/     # Notification system
│       └── models.py      # Notification
├── requirements.txt       # Python dependencies
└── manage.py             # Django CLI
```

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the backend folder:
```env
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=wms_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Create Database
```bash
# Create PostgreSQL database
createdb wms_db

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Obtain JWT token
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Accounts
- `GET /api/accounts/users/` - List users
- `GET /api/accounts/users/{id}/` - User detail

### Organization
- `GET /api/organization/offices/` - List offices
- `GET /api/organization/offices/{id}/` - Office detail

### Darta (Incoming)
- `GET /api/darta/letters/` - List Darta letters
- `POST /api/darta/letters/` - Create Darta
- `GET /api/darta/letters/{id}/` - Darta detail

### Chalani (Outgoing)
- `GET /api/chalani/letters/` - List Chalani letters
- `POST /api/chalani/letters/` - Create Chalani
- `GET /api/chalani/letters/{id}/` - Chalani detail

### Workflow
- `POST /api/workflow/steps/` - Create workflow action
- `GET /api/workflow/files/` - List file trackers

### Notifications
- `GET /api/notifications/` - List notifications
- `PATCH /api/notifications/{id}/` - Mark as read

## Security Notes

1. **Roles are stored in a separate table** (`user_roles`) to prevent privilege escalation
2. **JWT authentication** is used for API access
3. **CORS** is configured for frontend access
4. **Audit logging** tracks all system actions

## Next Steps

1. Create serializers for each model
2. Create ViewSets with proper permissions
3. Add custom permissions for role-based access
4. Implement NGX DMS integration for attachments
5. Add Celery tasks for email/SMS notifications
