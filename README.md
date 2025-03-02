# Beehiiv Auth API

A backend Node.js Express application that provides magic link authentication via SuperTokens, verifying email access via the Beehiiv API before sending a magic link. Once authenticated, it issues JWT tokens and manages sessions using PostgreSQL.

## Features

- **Magic Link Authentication**: Uses SuperTokens Passwordless for authentication
- **Beehiiv Integration**: Verifies if an email belongs to a Beehiiv subscriber before sending a magic link
- **JWT Token Issuance**: Generates custom JWT tokens for authorized clients
- **Session Management**: Stores sessions in PostgreSQL via Railway
- **Subscription Verification**: Periodically re-checks Beehiiv subscription status

## Tech Stack

- Node.js + Express.js
- SuperTokens for authentication
- PostgreSQL (Railway DB)
- JWT for token management
- Beehiiv API integration
- TypeScript
- Docker support

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (via Railway or any other provider)
- SuperTokens account (or self-hosted instance)
- Beehiiv account with API access

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd beehiiv-app-auth
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the environment variables in the `.env` file with your actual values:
   - Set your PostgreSQL connection string for `DATABASE_URL`
   - Configure your JWT secret
   - Set your SuperTokens connection URI and API key
   - Add your Beehiiv API key and publication ID

## Database Setup

Run the database migration script to create necessary tables:

```
npm run migrate
```

## Development

Start the development server with auto-reload:

```
npm run dev
```

## Production Build

Build the TypeScript code:

```
npm run build
```

Start the production server:

```
npm start
```

## Docker Deployment

Build the Docker image:

```
docker build -t beehiiv-auth-api .
```

Run the container:

```
docker run -p 3001:3001 --env-file .env beehiiv-auth-api
```

## Railway Deployment

This application is configured for easy deployment to Railway.app:

1. Push your code to a GitHub repository
2. Sign up/login to [Railway.app](https://railway.app)
3. Create a new project and select "Deploy from GitHub repo"
4. Connect your repository
5. Add a PostgreSQL database plugin from the Railway dashboard
6. Configure your environment variables (see below)
7. Deploy your application

### Setting up Environment Variables on Railway

After deploying to Railway, you need to configure your environment variables in the Railway dashboard:

1. In your project dashboard, go to the "Variables" tab
2. Click "New Variable" for each required variable
3. Set the following variables:

**Node Environment:**
- `NODE_ENV`: Set to `production` for production deployments

**JWT Configuration:**
- `JWT_SECRET`: Generate a secure random string using a tool like `openssl rand -hex 32`
- `JWT_EXPIRES_IN`: `1d` (for 1 day)
- `REFRESH_TOKEN_EXPIRES_IN`: `7d` (for 7 days)

**SuperTokens Configuration:**
- `SUPERTOKENS_CONNECTION_URI`: From your SuperTokens dashboard or self-hosted instance URL
- `SUPERTOKENS_API_KEY`: Your SuperTokens API key (if using managed service)
- `WEBSITE_DOMAIN`: Your frontend application URL (e.g., `https://your-app.example.com`)
- `API_DOMAIN`: Your Railway app URL (automatically set by Railway, e.g., `https://your-app.railway.app`)
- `API_BASE_PATH`: `/auth`

**Beehiiv API:**
- `BEEHIIV_API_KEY`: Your Beehiiv API key (from Settings > Developers > API Keys)
- `BEEHIIV_PUBLICATION_ID`: Your Beehiiv publication ID

**CORS Configuration:**
- `ALLOWED_ORIGINS`: Comma-separated list of origins allowed to call your API (e.g., `https://your-app.example.com`)

> **Note:** The `DATABASE_URL` will be automatically set by Railway when you add a PostgreSQL plugin to your project.

## API Endpoints

- `POST /auth/login` - Use email to generate a magic link.
- `POST /auth/callback` - Handles successful authentication with SuperTokens
- `GET /auth/verify` - Verifies JWT token and checks subscription status
- `POST /auth/refresh` - Refreshes expired JWT tokens

## Integration with Frontend

In your frontend application, redirect users to the SuperTokens hosted authentication page:

```javascript
window.location.href = `${API_URL}/auth/signin?redirect_uri=${encodeURIComponent(CALLBACK_URL)}`;
```

After successful authentication, users will be redirected back to your application with a JWT token:

```javascript
// Extract token from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Store token in local storage
localStorage.setItem('authToken', token);
```

Use the token for authenticated API requests:

```javascript
fetch('https://your-api.com/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
```

## License

[MIT License](LICENSE) 