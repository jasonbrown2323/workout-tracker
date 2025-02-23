# Workout Tracker

A FastAPI-based workout tracking application that helps users manage and monitor their fitness progress.

## Features

- Track workouts and exercises
- PostgreSQL database for data storage
- Docker containerization for easy deployment
- RESTful API endpoints

## Prerequisites

- Docker
- Docker Compose

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/workout-tracker2.git
cd workout-tracker2
```

2. Start the application:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:8000`

## API Documentation

Once the application is running, you can access:
- API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Environment Variables

The following environment variables are configured in docker-compose.yml:

- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password

## Development

To run the application in development mode:

```bash
docker-compose up --build
```

The application will reload automatically when you make changes to the code.

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
