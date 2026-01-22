# Finance Tracker Frontend

React frontend for the finance tracker app. Built with Vite + Tailwind CSS.

## Quick start

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Pages

- `/` - Landing page with sidebar, hero, stats, features
- `/dashboard` - Main dashboard with charts and transactions

## Tech

- React 18
- Vite
- Tailwind CSS
- Recharts (for the graphs)
- Lucide React (icons)
- React Router

## Structure

```
src/
├── components/
│   ├── landing/      # landing page stuff
│   │   ├── Sidebar.jsx
│   │   ├── HeroSection.jsx
│   │   ├── StatsSection.jsx
│   │   └── FeaturesSection.jsx
│   └── dashboard/    # dashboard components
│       ├── LineChartCard.jsx
│       ├── DonutChartCard.jsx
│       ├── CalendarCard.jsx
│       ├── TransactionsList.jsx
│       └── BalanceCard.jsx
├── pages/
│   ├── Landing.jsx
│   └── Dashboard.jsx
└── App.jsx
```

## Colors

Using a green/olive theme:
- Dark olive: `#3D4A1F` (sidebar, cards)
- Lime green: `#C5E86C` (accents, CTAs)
- Mint green: `#A8E6A3` (income, success)
- Red: `#EF4444` (expenses)

## TODO

- [ ] Connect to auth service
- [ ] Add login/register pages
- [ ] Real transaction data from API
- [ ] Mobile responsive (works ok but could be better)
- [ ] Add more chart types
- [ ] Dark/light mode toggle maybe?
