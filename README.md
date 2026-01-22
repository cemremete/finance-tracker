# Finance Tracker

I learned a ton about microservices, JWT auth, and why everyone complains about Kubernetes. This is definitely overengineered for a personal finance app - I could've done this with a single Express server and SQLite. But where's the fun in that?

## What it actually does

- **Dashboard** - see all your money stuff in one place (currently shows mock data, working on connecting it to real APIs)
- **Transaction tracking** - auto-categorizes your spending (turns out I spend way too much on food delivery)
- **Budget alerts** - sends you a warning when you're about to blow your budget
- **Savings goals** - set a target, track progress, feel good about yourself

## Architecture 

```
                         ┌─────────────────┐
                         │   API Gateway   │
                         │    (Express)    │
                         └────────┬────────┘
                                  │
        ┌─────────────┬───────────┼───────────┬─────────────┐
        ▼             ▼           ▼           ▼             ▼
   ┌─────────┐  ┌───────────┐ ┌────────┐ ┌─────────┐  ┌──────────┐
   │  Auth   │  │Transaction│ │Analytics│ │ Budget │  │  etc...  │
   │(Node.js)│  │ (Node.js) │ │  (wip)  │ │  (wip) │  │          │
   └────┬────┘  └─────┬─────┘ └────┬───┘ └────┬────┘  └────┬─────┘
        │             │            │          │            │
        └─────────────┴────────────┴──────────┴────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   PostgreSQL  +  Redis    │
                    └───────────────────────────┘
```

## Tech I used (and why)

- **Node.js/Express** - I know it well, didn't want to fight the framework while learning other stuff
- **PostgreSQL** - needed something more serious than SQLite for the portfolio
- **Redis** - for caching and storing JWT blacklist (learned this the hard way after tokens wouldn't invalidate)
- **React + Tailwind** - fast to build, looks decent without being a designer
- **Docker + K8s** - the whole point was to learn this, so yeah

## Getting it running

You need Docker. That's it.

```bash
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker

# spin up postgres, redis, and all services
docker-compose up -d

# check if everything's healthy
docker-compose ps
```

Frontend: http://localhost:3002
Auth API: http://localhost:3001
Gateway: http://localhost:3000

## Current status (I'm being honest here)

| Thing | Status | Notes |
|-------|--------|-------|
| Auth service | Works | Login, register, JWT refresh, logout - all good |
| Transaction service | Works | CRUD, auto-categorization, budgets |
| API Gateway | Works | Routes requests, handles auth |
| Frontend - Auth | Works | Can register and login |
| Frontend - Dashboard | Fake data | Charts show hardcoded numbers, need to wire up APIs |
| Analytics service | Stub | Just a folder with package.json |
| Notifications | Stub | Same |
| Bank integration | Stub | Would need Plaid, costs money |

## Project structure

```
finance-tracker/
├── services/
│   ├── auth-service/         # JWT, bcrypt, the whole auth thing
│   ├── api-gateway/          # routes + rate limiting
│   ├── transaction-service/  # transactions, budgets, goals
│   ├── frontend/             # works but dashboard uses mock data
│   └── [other services]/     # stubs for now
├── kubernetes/               # k8s manifests (haven't tested in prod)
├── docker-compose.yml
└── Makefile                  # helpful shortcuts
```

## Running tests

```bash
# all tests
make test

# just auth (this one actually has tests)
cd services/auth-service && npm test
```

## API endpoints

Auth stuff:
| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | /api/auth/register | create account |
| POST | /api/auth/login | get tokens |
| POST | /api/auth/refresh | refresh expired token |
| POST | /api/auth/logout | kill the session |
| GET | /api/auth/me | who am I |

Transaction stuff:
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/transactions | list with filters |
| POST | /api/transactions | add new one |
| GET | /api/budgets/progress | how broke am I |
| GET | /api/analytics/health-score | financial health 0-100 |

## What I learned building this

1. **Microservices are a pain** for solo projects. Service discovery, inter-service auth, distributed logging... I get why people use monoliths now.

2. **JWT refresh tokens** are trickier than tutorials make them seem. Had to implement token blacklisting in Redis because "just let them expire" doesn't work for logout.

3. **Rate limiting matters** - got locked out of my own app during testing because I forgot to disable it in dev mode. Fun times.

4. **Mock data is a trap** - I kept saying "I'll connect it to real APIs later" and now half the dashboard is still fake. Don't be like me.

## What's next (if I have time)

- [ ] Actually connect dashboard to real APIs
- [ ] Add forgot password flow (currently just a dead link lol)
- [ ] Dark/light theme toggle
- [ ] Maybe Plaid integration if I can afford it
- [ ] Write more tests (auth service is the only one with decent coverage)

## Contributing

If you actually want to contribute to this, cool. I'm not picky about code style as long as it works and I can understand it.

