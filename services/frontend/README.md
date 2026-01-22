# Finance Tracker Frontend

React frontend for the Finance Tracker application.

## Quick Start

```bash
# install dependencies
npm install

# copy env file
cp .env.example .env

# start dev server
npm run dev
```

Runs on http://localhost:3002

## Pages

- `/` - Landing page with features and CTA
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - Protected dashboard with charts and transactions

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Recharts
- Axios
- Lucide React (icons)

## Project Structure

```
src/
├── components/
│   ├── auth/           # LoginForm, RegisterForm
│   ├── common/         # Button, Input, Card, Checkbox
│   ├── dashboard/      # Charts, TransactionList, Calendar
│   └── layout/         # Header, Sidebar
├── context/
│   └── AuthContext.jsx # Auth state management
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── DashboardPage.jsx
├── services/
│   └── api.js          # Axios instance with interceptors
├── utils/
│   ├── ProtectedRoute.jsx
│   └── validators.js
├── App.jsx
└── main.jsx
```

## Environment Variables

```
VITE_API_URL=http://localhost:3001
VITE_GATEWAY_URL=http://localhost:3000
```

## Color Scheme

- Primary: `#C4E538` (lime green)
- Background: `#1A1F1A` (dark green)
- Cards: `#2D3A2D` (medium dark green)
- Text: `#E8F5E9` (light green/white)
- Accent: `#8BC34A`

## API Integration

The frontend connects to the Auth Service for:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh (automatic)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get user profile

Tokens are stored in localStorage and automatically refreshed when expired.
