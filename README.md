# Fullstack Authentication App

A complete fullstack authentication application built with Node.js, Express, MongoDB, and JWT.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT token-based authentication
- Protected dashboard route
- Responsive frontend with HTML, CSS, and JavaScript

## Prerequisites

- Node.js (v14 or higher)
- MongoDB

## Installation

1. Clone or download the project files.

2. Install dependencies:
   ```
   npm install
   ```

3. Set up MongoDB:
   - Download and install MongoDB from https://www.mongodb.com/try/download/community
   - Start MongoDB service (on Windows, run as administrator):
     ```
     net start MongoDB
     ```
     Or if installed in a custom location, navigate to the MongoDB bin folder and run:
     ```
     mongod --dbpath "C:\data\db"
     ```
     (Create the data/db folder if it doesn't exist)

4. Configure environment variables:
   - The `.env` file is already set up with a default JWT secret.
   - You can change the JWT_SECRET in `.env` for production.

## Running the Application

1. Start MongoDB (if not already running).

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and navigate to `http://localhost:5000`

## API Endpoints

- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /dashboard` - Protected dashboard (requires JWT token)

## Project Structure

```
fullstack-auth-app/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
├── models/
│   └── User.js       # User model
├── middleware/
│   └── auth.js       # Authentication middleware
└── public/
    ├── index.html    # Main page with login/register forms
    ├── dashboard.html # Protected dashboard page
    ├── style.css     # CSS styles
    └── script.js     # Frontend JavaScript
```

## Usage

1. Register a new account using the registration form.
2. Login with your credentials.
3. Access the protected dashboard.
4. Logout to return to the login page.

## Security Notes

- Passwords are hashed using bcrypt.
- JWT tokens expire after 1 hour.
- In production, use a strong JWT_SECRET and consider using HTTPS.