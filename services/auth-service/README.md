# Auth Service

Handles all the login/signup/token stuff for the finance tracker app.

## What's in here

- User registration and login (the usual)
- JWT tokens with refresh token rotation
- Password hashing with bcrypt
- Rate limiting so people can't brute force
- Account gets locked after too many failed attempts (learned this the hard way...)

## Quick start

```bash
npm install
cp .env.example .env   # edit this with your db creds
npm run migrate        # set up the tables
npm run dev            # starts on :3001
```

Or just use docker-compose from the root folder, it handles everything.

## Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| POST | /api/auth/register | sign up |
| POST | /api/auth/login | get tokens |
| POST | /api/auth/refresh | new access token |
| POST | /api/auth/logout | kill the session |
| GET | /api/auth/me | who am i |
| PUT | /api/auth/me | update profile |
| GET | /health | k8s health check |

## Testing

```bash
npm test
```

Coverage is around 70-80%, good enough for now. Most of the important auth logic is covered.

## Env vars

Check `.env.example` - pretty self explanatory. The important ones:

- `JWT_ACCESS_SECRET` - change this in prod obviously
- `JWT_REFRESH_SECRET` - this too
- `DB_*` - postgres connection stuff
- `REDIS_*` - redis for token storage

## Notes

- Tokens are stored in Redis so we can revoke them
- Failed login attempts are tracked, 5 fails = 30 min lockout
- Passwords need uppercase, lowercase, number, and special char (yeah I know it's annoying but whatever)
