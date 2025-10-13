# API Documentation

## Authentication

### Login

Authenticates a user and returns an API token along with user details.

-   **URL:** `/api/auth/login`
-   **Method:** `POST`
-   **Headers:**
    *   `Content-Type: application/json`

-   **Request Body:**

    ```json
    {
        "email": "string",
        "password": "string"
    }
    ```

    **Example:**
    ```json
    {
        "email": "admin@sirangkul.com",
        "password": "password"
    }
    ```

-   **Success Response (200 OK):**

    ```json
    {
        "token": "your-api-token",
        "user": {
            "id": "uuid",
            "full_name": "string",
            "role": "string"
        }
    }
    ```

    **Example:**
    ```json
    {
        "token": "1|abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        "user": {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcde0",
            "full_name": "Administrator",
            "role": "administrator"
        }
    }
    ```

-   **Error Response (401 Unauthorized):**

    ```json
    {
        "message": "Invalid credentials"
    }
    ```

    **Example:**
    ```json
    {
        "message": "Invalid credentials"
    }
    ```