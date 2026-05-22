# Wet3Camp Platform - API Routes Documentation

## Base URL
`https://api.wet3camp.com/api` or `/api` (for development)

## Authentication
All protected endpoints require:
```
Authorization: Bearer {jwt_token}
```

---

## Authentication Endpoints

### POST /auth/register
Register new user account with social or email login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "display_name": "John Doe",
  "role": "client|escort|advertiser",
  "phone": "+254712345678"
}
```

**Social Login:**
```json
{
  "provider": "google|facebook|apple|linkedin",
  "provider_token": "token_from_provider",
  "display_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "client"
  }
}
```

### POST /auth/login
Login with email/password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:** `200 OK`
```json
{
  "token": "jwt_token",
  "user": { ... }
}
```

### POST /auth/verify-email
Send verification code to email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

### POST /auth/verify-otp
Verify OTP code sent to email

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:** `200 OK`

### POST /auth/social-login
Social login endpoint

**Request:**
```json
{
  "provider": "google|facebook|apple|linkedin",
  "provider_id": "provider_user_id",
  "email": "user@example.com",
  "name": "User Name"
}
```

**Response:** `200 OK` or `201 Created`

---

## User Endpoints

### GET /users/me
Get current user profile

**Response:** `200 OK`
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "display_name": "John",
  "role": "client",
  "followers_count": 50,
  "following_count": 30
}
```

### PUT /users/me
Update user profile

**Request:**
```json
{
  "display_name": "New Name",
  "bio": "Updated bio",
  "phone": "+254712345678"
}
```

### POST /users/follow/:userId
Follow a user

**Response:** `200 OK`

### DELETE /users/follow/:userId
Unfollow a user

**Response:** `204 No Content`

### GET /users/followers
Get user's followers

**Response:** `200 OK`
```json
{
  "followers": [
    {
      "id": "follower_id",
      "display_name": "Follower Name",
      "profile_photo": "url"
    }
  ]
}
```

---

## Escort Endpoints

### GET /escorts
List all escorts with filters

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `location`: Filter by location
- `min_price`: Minimum hourly rate
- `max_price`: Maximum hourly rate
- `age_min`: Minimum age
- `age_max`: Maximum age
- `rating_min`: Minimum rating
- `verification`: Filter by verification level
- `sort`: `newest|rating|price|popular`

**Response:** `200 OK`
```json
{
  "escorts": [
    {
      "id": "escort_id",
      "name": "Bisola",
      "age": 24,
      "location": "Nairobi",
      "rating": 4.8,
      "reviews": 342,
      "hourly_rate": 500,
      "image": "url",
      "verified": true,
      "featured": false
    }
  ],
  "total": 1234,
  "page": 1,
  "pages": 62
}
```

### GET /escorts/:id
Get escort profile details

**Response:** `200 OK`
```json
{
  "id": "escort_id",
  "name": "Bisola",
  "age": 24,
  "bio": "Premium service...",
  "gallery": ["url1", "url2"],
  "services": [
    { "name": "video_call", "available": true }
  ],
  "pricing": {
    "hourly": 500,
    "overnight": 2500,
    "video_call": 200
  },
  "availability": { ... },
  "languages": ["English", "French"],
  "body_type": "curvy",
  "height_cm": 168,
  "rating": 4.8,
  "reviews": 342,
  "phone": "+254712345678",
  "whatsapp": "+254712345678"
}
```

### PUT /escorts/me
Update escort profile (escort-only)

**Request:**
```json
{
  "bio": "Updated bio",
  "services": [
    { "name": "incall", "available": true }
  ],
  "pricing": {
    "hourly": 600,
    "overnight": 3000
  },
  "availability": {
    "monday": { "start": "18:00", "end": "23:00", "available": true }
  }
}
```

### POST /escorts/photos
Upload escort photos (escort-only)

**Request:** `multipart/form-data`
- `photo`: Image file
- `order`: Display order

### GET /escorts/featured
Get featured escorts

**Response:** `200 OK`

---

## Booking Endpoints

### GET /bookings
Get user's bookings

**Query Parameters:**
- `status`: `pending|confirmed|completed|cancelled`
- `page`: Page number

**Response:** `200 OK`

### POST /bookings
Create new booking

**Request:**
```json
{
  "escort_id": "escort_id",
  "booking_date": "2026-06-15",
  "start_time": "18:00",
  "duration_minutes": 60,
  "service_type": "incall|outcall|video_call",
  "location": "Address (if outcall)",
  "client_note": "Optional notes"
}
```

**Response:** `201 Created`

### GET /bookings/:id
Get booking details

**Response:** `200 OK`

### PUT /bookings/:id
Update booking

**Request:**
```json
{
  "status": "confirmed|cancelled",
  "cancellation_reason": "Reason if cancelled"
}
```

### DELETE /bookings/:id
Cancel booking

**Response:** `204 No Content`

---

## Payment Endpoints

### POST /payments/initiate
Initiate payment for booking

**Request:**
```json
{
  "booking_id": "booking_id",
  "amount": 5000,
  "payment_method": "card|mPesa|paypal|bank_transfer",
  "currency": "KES"
}
```

**Response:** `200 OK`
```json
{
  "payment_id": "payment_id",
  "status": "pending",
  "payment_url": "https://payment-gateway.com/checkout",
  "transaction_id": "txn_123456"
}
```

### POST /payments/verify
Verify payment status

**Request:**
```json
{
  "payment_id": "payment_id",
  "transaction_id": "txn_123456"
}
```

**Response:** `200 OK`

### GET /payments/history
Get payment history

**Response:** `200 OK`

---

## Review Endpoints

### POST /reviews
Submit review for completed booking

**Request:**
```json
{
  "booking_id": "booking_id",
  "rating": 5,
  "comment": "Excellent service!",
  "photos": ["url1", "url2"]
}
```

**Response:** `201 Created`

### GET /reviews/:escortId
Get escort reviews

**Query Parameters:**
- `page`: Page number
- `sort`: `newest|helpful|rating`

**Response:** `200 OK`

### POST /reviews/:reviewId/helpful
Mark review as helpful

**Response:** `200 OK`

---

## Favorites Endpoint

### POST /favorites/:escortId
Add escort to favorites

**Response:** `201 Created`

### DELETE /favorites/:escortId
Remove from favorites

**Response:** `204 No Content`

### GET /favorites
Get user's favorite escorts

**Response:** `200 OK`

---

## Messages Endpoints

### GET /messages/:userId
Get conversation with user

**Query Parameters:**
- `page`: Page number
- `limit`: Messages per page

**Response:** `200 OK`

### POST /messages/:userId
Send message

**Request:**
```json
{
  "message": "Hello!",
  "attachment_url": "optional_url"
}
```

**Response:** `201 Created`

### GET /messages/conversations
Get all conversations

**Response:** `200 OK`

---

## Admin Endpoints (admin-only)

### GET /admin/stats
Get platform statistics

**Response:** `200 OK`
```json
{
  "total_users": 5000,
  "total_escorts": 500,
  "total_bookings": 2000,
  "total_revenue": 500000,
  "pending_approvals": 25
}
```

### GET /admin/approvals/pending
Get pending approvals

**Response:** `200 OK`

### POST /admin/approvals/:id/approve
Approve pending profile/photo

**Response:** `200 OK`

### POST /admin/approvals/:id/reject
Reject pending profile/photo

**Request:**
```json
{
  "reason": "Does not meet guidelines"
}
```

### GET /admin/users
Search users

**Query Parameters:**
- `search`: Search term
- `role`: Filter by role
- `status`: Filter by status

### POST /admin/users/:id/suspend
Suspend user account

### POST /admin/users/:id/ban
Ban user account

### GET /admin/reports
Get user reports

### POST /admin/reports/:id/resolve
Resolve report

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Rate Limiting

- Standard: 1000 requests/hour per user
- Auth endpoints: 10 requests/hour per IP
- Payment endpoints: 100 requests/hour

---

## Webhooks

- `booking.created`
- `booking.confirmed`
- `booking.completed`
- `booking.cancelled`
- `payment.completed`
- `payment.failed`
- `review.submitted`
- `user.verified`
