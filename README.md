# Workout Tracker

A full-stack application for tracking workouts, with a FastAPI backend and React frontend.

## Features

- User authentication with JWT
- Track workouts, exercises, sets, reps, and weight
- Workout plans and templates
- Exercise statistics and progress tracking
- Plate calculator for barbell exercises
- PostgreSQL database for data storage
- Docker containerization for easy deployment
- RESTful API endpoints

## Prerequisites

- Docker and Docker Compose

## Setup

### Production Setup

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Access the application
# Frontend: http://localhost
# API docs: http://localhost/docs
```

### Development Setup

```bash
# Start with development configuration
docker compose -f docker-compose.dev.yml up -d

# Access development services
# Frontend: http://localhost:3002
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs
```

## Configuration

### Environment Variables

Backend:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT authentication
- `ALLOWED_ORIGINS`: CORS configuration (comma-separated list or "*" for all)

Frontend:
- `REACT_APP_API_URL`: API endpoint URL
- `REACT_APP_ENV`: "development" or "production"

## Running Tests

Backend Tests:
```bash
docker compose exec backend pytest -v --cov=app --cov-report=term-missing
```

Frontend Tests:
```bash
docker compose exec frontend npm test
```

## API Structure

- `/auth`: Authentication (login, user info)
- `/users`: User management
- `/workouts`: Workout session management
- `/workout-plans`: Workout planning
- `/workout-templates`: Exercise templates

## License

MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
