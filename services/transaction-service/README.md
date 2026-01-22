# Transaction Service

Transaction management service with smart categorization, budgets, subscriptions, goals, and analytics.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Run database migrations
npm run migrate

# Start dev server
npm run dev
```

Runs on http://localhost:3003

## Features

### Smart Categorization
- Auto-categorizes transactions based on merchant name
- Keyword matching with fuzzy search (Fuse.js)
- Learns from user corrections
- Supports Turkish and English keywords

### Budget Management
- Set monthly/weekly/yearly budgets per category
- Real-time budget tracking
- Alerts at 80%, 90%, 100% thresholds
- Budget progress visualization

### Subscription Tracking
- Manual subscription entry
- Auto-detection from recurring transactions
- Payment reminders
- Optimization recommendations
- Monthly/yearly cost summary

### Savings Goals
- Create goals with target amounts and deadlines
- Track progress with contributions
- Auto-rounding feature (round up transactions)
- Milestone notifications
- Priority system (high/medium/low)

### Analytics
- Spending trends (this month vs last month)
- Category breakdown comparison
- Financial Health Score (0-100)
- Historical spending charts

## API Endpoints

### Transactions
- `GET /api/transactions` - List with filters
- `POST /api/transactions` - Create (auto-categorized)
- `GET /api/transactions/:id` - Get single
- `PUT /api/transactions/:id` - Update
- `DELETE /api/transactions/:id` - Delete
- `GET /api/transactions/summary` - Category summary
- `GET /api/transactions/categories` - Available categories
- `POST /api/transactions/categorize` - Preview categorization

### Budgets
- `GET /api/budgets` - List all with spending
- `GET /api/budgets/progress` - Progress bars data
- `GET /api/budgets/alerts` - Unread alerts
- `POST /api/budgets` - Create/update budget
- `DELETE /api/budgets/:id` - Delete

### Subscriptions
- `GET /api/subscriptions` - List all
- `GET /api/subscriptions/summary` - Summary with upcoming
- `GET /api/subscriptions/detected` - Auto-detected recurring
- `GET /api/subscriptions/recommendations` - Optimization tips
- `POST /api/subscriptions` - Create
- `PUT /api/subscriptions/:id` - Update
- `DELETE /api/subscriptions/:id` - Delete

### Goals
- `GET /api/goals` - List all
- `GET /api/goals/summary` - Dashboard summary
- `GET /api/goals/:id` - Get single with progress
- `POST /api/goals` - Create
- `POST /api/goals/:id/contribute` - Add contribution
- `PUT /api/goals/:id` - Update
- `DELETE /api/goals/:id` - Delete

### Analytics
- `GET /api/analytics/trends` - Spending trends
- `GET /api/analytics/history` - Historical data
- `GET /api/analytics/health-score` - Financial health score

## Database Schema

### Tables
- `transactions` - All financial transactions
- `budgets` - Category budgets
- `budget_alerts` - Budget threshold alerts
- `subscriptions` - Recurring subscriptions
- `goals` - Savings goals
- `goal_contributions` - Goal contribution history
- `user_category_mappings` - User's custom categorizations

## Category Keywords

Categories are auto-detected from merchant names:
- **food**: migros, carrefour, starbucks, restaurant...
- **transport**: shell, uber, metro, thy...
- **entertainment**: spotify, netflix, steam...
- **bills**: elektrik, su, internet, telefon...
- **shopping**: trendyol, amazon, zara...
- **health**: eczane, hastane, gym...
- **education**: udemy, coursera, okul...
- **income**: maaş, salary, freelance...
- **investment**: yatırım, hisse, kripto...

## Environment Variables

```
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-secret
JWT_ISSUER=finance-tracker-auth
```

## Tech Stack

- Node.js 20+
- Express.js
- PostgreSQL
- Redis (caching)
- Fuse.js (fuzzy search)
- date-fns (date utilities)
- Joi (validation)
- Pino (logging)
