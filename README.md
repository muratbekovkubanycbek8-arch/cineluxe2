# CineLuxe Premium Movie Platform

A modern, full-stack online movie recommendation platform designed with a classic premium aesthetic (Dark Theme + Gold Accents).

## Features
- **Frontend**: React + Vite + React Router + Context API.
- **Backend**: Node.js + Express + MongoDB.
- **Authentication**: Secure JWT sessions with bcryptjs for password hashing.
- **Role-based Access**: Users vs Admin panel viewing.
- **Subscription Engine**: Mocked Stripe integration for seamless premium content upgrades.

## Prerequisites
- Node.js installed on your machine.
- MongoDB installed locally or a valid `MONGO_URI` in your backend `.env`.

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the React application:
   ```bash
   npm run dev
   ```
   *The client will start, and you can access the app at `http://localhost:5173`.*

## First Using It
1. Click **Subscribe** / **Sign Up** to create a test user. The very first user created is automatically assigned the `admin` role.
2. Visit `/admin` by clicking Admin on the Navbar to manage the catalog.
3. Visit Subscription to "Upgrade to Premium".
