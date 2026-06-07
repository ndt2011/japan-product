# Bruno / Postman — Auth test collection

Chạy khi API local: `http://localhost:8000/api`

## TC-AUTH-001 — Login thành công

```
POST /auth/login
{
  "login_id": "admin",
  "password": "Admin@123",
  "remember_me": false
}
```
Expect: 200, `message: M0103`, `data.token`, `data.expires_at`

## TC-AUTH-004 — Remember Me 30 ngày

```
POST /auth/login
{ "login_id": "admin", "password": "Admin@123", "remember_me": true }
```
Expect: `expires_at` ~ now + 30 days

## TC-AUTH-005 — Session 24h

```
POST /auth/login
{ "login_id": "admin", "password": "Admin@123", "remember_me": false }
```
Expect: `expires_at` ~ now + 24 hours

## TC-AUTH-007 — Logout revoke

1. Login → lưu `token`
2. `POST /auth/logout` + `Authorization: Bearer {token}`
3. `GET /auth/me` + cùng token → 401

## TC-AUTH-002 — Sai password

```
POST /auth/login
{ "login_id": "admin", "password": "wrong" }
```
Expect: 401, `M0101`
