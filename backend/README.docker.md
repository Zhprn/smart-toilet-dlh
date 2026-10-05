# Docker Setup for Rexco API

This guide explains how to run the Rexco API and PostgreSQL database using Docker.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1.  **Build and Start the services:**

    ```bash
    docker-compose up -d --build
    ```

    This will start the API on port 3000 and PostgreSQL on port 5432.

2.  **Run Database Migrations:**

    After the containers are running, you need to apply the database migrations.

    ```bash
    docker-compose exec app npx prisma migrate deploy
    ```

3.  **Access the API:**

    The API will be available at `http://localhost:3000`.
    Swagger documentation: `http://localhost:3000/api`.

## Environment Variables

The `docker-compose.yml` file sets default environment variables for development.
You can override them by creating a `.env` file or setting them in your shell.

- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: Secret key for JWT tokens.
- `PORT`: API port (default: 3000).

## Stopping the Services

To stop the containers:

```bash
docker-compose down
```

To stop and remove volumes (reset database):

```bash
docker-compose down -v
```
