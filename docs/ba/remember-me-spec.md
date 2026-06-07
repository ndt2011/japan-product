# Spec: Chức năng Lưu Đăng Nhập (Remember Me)

**Module**: Auth (1-001)  
**Ngày**: 2026-06-07 | **Priority**: P1

---

## Mô tả

Khi người dùng tick checkbox "Lưu đăng nhập" trên màn hình login, hệ thống duy trì phiên đăng nhập trong **30 ngày** thay vì 24 giờ thông thường. Người dùng không cần đăng nhập lại mỗi ngày khi sử dụng cùng thiết bị.

---

## UI / UX

```
┌─────────────────────────────────┐
│  Email                          │
│  [nguyendoanthuy472@gmail.com ] │
│  Mật khẩu                       │
│  [●●●●●●●●●●●●          ]       │
│                                  │
│  ☐ Lưu đăng nhập                │   ← Checkbox này
│                                  │
│  [       Đăng nhập       ]       │
└─────────────────────────────────┘
```

- Mặc định: **không tích**
- Label: "Lưu đăng nhập" (tiếng Việt) / "ログイン状態を保持する" (tiếng Nhật)

---

## Luồng kỹ thuật

### Backend (Laravel 11 + Sanctum)

**Request**:
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secret123",
  "remember_me": true
}
```

**Xử lý**:
```php
$tokenName = 'auth-token';
$abilities  = ['*'];
$expiresAt  = $request->remember_me
    ? now()->addDays(30)
    : now()->addHours(24);

$token = $user->createToken(
    $tokenName,
    $abilities,
    $expiresAt
);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "2|AbCdEfGhIjKl...",
    "expires_at": "2026-07-07T10:00:00Z",
    "user": { "id": 1, "name": "Nguyen", "role": "SUPER_ADMIN" }
  },
  "message": "M0101"
}
```

### Frontend (Next.js 14)

Token **KHÔNG lưu vào localStorage**. Lưu qua Next.js API Route vào httpOnly cookie:

```typescript
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const res  = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = await res.json()

  const maxAge = body.remember_me
    ? 60 * 60 * 24 * 30  // 30 ngày
    : 60 * 60 * 24        // 24 giờ

  const response = NextResponse.json(data)
  response.cookies.set('auth_token', data.data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
  return response
}
```

### Middleware bảo vệ route

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

## Business Rules áp dụng

| Rule | Nội dung |
|------|---------|
| RULE-AUTH-03 | Token thường: 24 giờ |
| RULE-AUTH-04 | Token remember: 30 ngày |
| RULE-AUTH-05 | Tối đa 5 phiên đồng thời (prevent token flooding) |
| RULE-AUTH-06 | Đăng xuất → revoke token ngay (blacklist trong Sanctum) |

---

## Test Cases liên quan

- TC-AUTH-004: Token 30 ngày khi remember_me=true
- TC-AUTH-005: Token 24 giờ khi remember_me=false
- TC-AUTH-007: Đăng xuất → token bị revoke

---

## Lưu ý bảo mật

- Cookie phải có flag `httpOnly` (JS không đọc được) + `secure` (chỉ HTTPS) + `sameSite=lax`
- Không bao giờ lưu token trong `localStorage` hoặc `sessionStorage`
- Khi user thay đổi mật khẩu → revoke tất cả token cũ của user đó
- Token chỉ valid cho 1 thiết bị (không share giữa browser sessions khác nhau)
