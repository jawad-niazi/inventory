# Inventory Management System

A full-stack multi-tenant inventory management application built with React on the frontend and Node.js/Express on the backend. The project is designed to manage products, stock movements, sales, purchases, suppliers, customers, expenses, and other inventory-related workflows.

## Overview

This repository includes:
- a React + Vite frontend
- an Express backend API
- Supabase integration for authentication and storage
- Cloudinary support for image uploads
- modular route structure for inventory operations
- environment-based configuration for local and deployment use

## Tech Stack

Frontend
- React
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React
- Axios

Backend
- Node.js
- Express
- Supabase JavaScript SDK
- JWT authentication
- bcryptjs
- Cloudinary
- Multer
- PDFKit
- CORS
- Morgan

Database / Storage
- Supabase
- PostgreSQL (via Supabase)

## Project Structure

```bash
.
├── client/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validations/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── inspect_failures.js
├── supabase/
├── .gitignore
├── README.md
├── api.js
└── .env.example
```

## Features

- User authentication and session handling through Supabase
- Register, login, logout, password reset, and forgot-password flows
- Inventory and stock tracking
- Product management
- Category management
- Supplier management
- Customer management
- Sales, purchases, returns, and transfers
- Expense tracking
- Invoice and quotation support
- Cloudinary-powered upload support for product or document images

## Backend Routes

The API is organized into a central route index with modules for:

- `/api/users`
- `/api/categories`
- `/api/products`
- `/api/inventory`
- `/api/shops`
- `/api/sales`
- `/api/purchases`
- `/api/transfers`
- `/api/expenses`
- `/api/suppliers`
- `/api/customers`
- `/api/returns`
- `/api/invoices`
- `/api/quotations`

Authentication routes:
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Frontend Behavior

The frontend app redirects users based on auth state:
- if a user is logged in, it navigates to `/dashboard`
- otherwise, it redirects to `/login`

This indicates the app is intended to support a protected dashboard workflow after authentication.

## Prerequisites

Before running this project, make sure you have:
- Node.js 18+
- npm
- a Supabase project
- a Cloudinary account
- MongoDB is not used here; the current setup is built around Supabase/PostgreSQL

## Environment Variables

### Frontend
Create a `.env` file in the `client` folder:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=
```

### Backend
Create a `.env` file in the `server` folder:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=4000
FRONTEND_URL=http://localhost:5173
SITE_URL=http://localhost:5173
```

## Installation

### 1. Install frontend dependencies

```bash
cd client
npm install
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

## Running the Project

### Start the backend

```bash
cd server
npm run dev
```

The backend runs on:
- http://localhost:4000

### Start the frontend

```bash
cd client
npm run dev
```

The frontend runs on:
- http://localhost:5173

## Notes

- The project is configured to allow local development with a Vite proxy and a backend CORS whitelist.
- The backend uses authenticated API middleware for protected routes.
- The app appears to be in a structured starter/boilerplate stage, with route modules and service structure already laid out for a larger inventory system.

## Deployment

For production deployment:
- set frontend `VITE_API_URL` to your live backend URL
- set backend `FRONTEND_URL` to your deployed frontend origin
- configure all Supabase and Cloudinary keys in your hosting environment

## License

There is no explicit license file in the repository at the moment. If this project is intended for public distribution or commercial use, adding a proper license is recommended.

## Contributing

If you want to extend this project:
1. fork the repository
2. create a feature branch
3. implement the feature
4. open a pull request with a clear summary
