# Karijeeva Auth Testing Playbook

## Env
- `JWT_SECRET` set in /app/backend/.env (random 64-byte hex)
- `JWT_TTL_DAYS=7`
- No admin seeded — customer auth only in Phase 3

## Endpoints
- POST /api/auth/register  {name,email,password}
- POST /api/auth/login     {email,password}
- POST /api/auth/logout    (clears cookie)
- GET  /api/auth/me        (cookie or Bearer)

## Key points
- bcrypt cost 12 via `passlib.context`
- JWT HS256, 7-day, stored as httpOnly cookie `access_token`
  + returned in body as `access_token` for SPA memory-hold fallback
- User _id: uuid4 string (not ObjectId)
- Passwords are never returned in any response

## Curl smoke test
```
API=https://karijeeva-oils.preview.emergentagent.com
curl -c /tmp/c.txt -X POST $API/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@k.in","password":"Passw0rd!"}'
curl -b /tmp/c.txt $API/api/auth/me
curl -b /tmp/c.txt -X POST $API/api/auth/logout
```
