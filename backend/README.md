# API Shield Backend

A Django-based backend for the API Shield security monitoring platform. This backend provides RESTful APIs for user authentication, API endpoint monitoring, WAF rule management, threat logging, and dashboard analytics.

## Features

- **User Authentication & Authorization**: Custom user model with role-based access control
- **API Endpoint Monitoring**: Track and monitor API endpoints with performance metrics
- **WAF Rule Management**: Create and manage Web Application Firewall rules
- **Threat Detection & Logging**: Comprehensive threat logging and analysis
- **Real-time Dashboard**: Analytics and statistics for security monitoring
- **RESTful API**: Full REST API with Django REST Framework
- **Admin Interface**: Django admin for data management

## Tech Stack

- **Django 5.2.4**: Web framework
- **Django REST Framework 3.16.0**: API framework
- **Django CORS Headers**: Cross-origin resource sharing
- **SQLite**: Database (can be configured for PostgreSQL)
- **Python 3.11+**: Runtime environment

## Quick Start

### Prerequisites

- Python 3.11 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Populate sample data**
   ```bash
   python manage.py populate_sample_data
   ```

7. **Start the development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/v1/`

## API Endpoints

### Authentication

- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/register/` - User registration
- `GET /api/v1/auth/user-info/` - Get current user info
- `POST /api/v1/auth/change-password/` - Change password

### API Endpoints Management

- `GET /api/v1/endpoints/` - List all API endpoints
- `POST /api/v1/endpoints/` - Create new API endpoint
- `GET /api/v1/endpoints/{id}/` - Get specific endpoint
- `PUT /api/v1/endpoints/{id}/` - Update endpoint
- `DELETE /api/v1/endpoints/{id}/` - Delete endpoint

### WAF Rules

- `GET /api/v1/waf-rules/` - List all WAF rules
- `POST /api/v1/waf-rules/` - Create new WAF rule
- `GET /api/v1/waf-rules/{id}/` - Get specific rule
- `PUT /api/v1/waf-rules/{id}/` - Update rule
- `DELETE /api/v1/waf-rules/{id}/` - Delete rule

### Threat Logs

- `GET /api/v1/threat-logs/` - List threat logs
- `GET /api/v1/threat-logs/{id}/` - Get specific threat log
- `POST /api/v1/threat-logs/create/` - Create threat log entry

### Dashboard

- `GET /api/v1/dashboard/stats/` - Get dashboard statistics
- `GET /api/v1/dashboard/traffic/` - Get traffic data
- `GET /api/v1/dashboard/threat-types/` - Get threat type distribution
- `GET /api/v1/dashboard/endpoint-status/` - Get endpoint status

## Sample Data

The backend includes sample data for testing:

- **Users**: 3 sample users (admin, user, viewer roles)
- **API Endpoints**: 5 sample endpoints with metrics
- **WAF Rules**: 5 security rules (SQL injection, XSS, CSRF, etc.)
- **Threat Logs**: 100 sample threat entries
- **Metrics**: 7 days of sample metrics data
- **Alerts**: 4 sample system alerts

### Sample User Credentials

- **Admin**: john@example.com / password123
- **User**: jane@example.com / password123
- **Viewer**: bob@example.com / password123

## Database Models

### User Management
- `User`: Custom user model with roles and company info
- `UserProfile`: Extended user profile information

### API Monitoring
- `APIEndpoint`: API endpoints being monitored
- `APIMetrics`: Performance and security metrics
- `WAFRule`: Web Application Firewall rules
- `ThreatLog`: Security threat logs

### System Monitoring
- `SystemAlert`: System alerts and notifications
- `SystemMetrics`: System-wide performance metrics
- `UserSession`: User session tracking
- `SecurityEvent`: Security audit trail

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
JWT_SECRET_KEY=your-jwt-secret-key
```

### CORS Settings

The backend is configured to allow requests from:
- http://localhost:5173 (Vite dev server)
- http://127.0.0.1:5173
- http://localhost:3000
- http://127.0.0.1:3000

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
```

### Applying Migrations
```bash
python manage.py migrate
```

### Accessing Admin Interface
Visit `http://localhost:8000/admin/` and login with your superuser credentials.

## API Documentation

The API documentation is available at `http://localhost:8000/api/docs/` when the server is running.

## Integration with Frontend

The backend is designed to work with the React frontend. The frontend should:

1. Use the authentication endpoints for login/logout
2. Include the auth token in API requests
3. Handle CORS properly
4. Use the dashboard endpoints for real-time data

## Security Features

- Token-based authentication
- Role-based access control
- CORS protection
- Input validation and sanitization
- SQL injection protection
- XSS protection
- CSRF protection

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in settings
2. Use a production database (PostgreSQL recommended)
3. Configure proper CORS settings
4. Set up HTTPS
5. Use environment variables for sensitive data
6. Configure proper logging
7. Set up monitoring and alerting

## License

This project is part of the API Shield security monitoring platform. 