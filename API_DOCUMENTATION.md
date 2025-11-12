# 📡 Ruach Ministries API Documentation

**Version:** 1.0
**Last Updated:** 2025-11-12
**Base URL:** `https://api.ruach.org` (Production) | `http://localhost:1337` (Development)

Complete API reference for the Ruach Ministries platform.

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Media Endpoints](#media-endpoints)
3. [Course Endpoints](#course-endpoints)
4. [User Endpoints](#user-endpoints)
5. [Scripture Endpoints](#scripture-endpoints)
6. [AI Endpoints](#ai-endpoints)
7. [Analytics Endpoints](#analytics-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/local/register`

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "provider": "local",
    "confirmed": true,
    "blocked": false,
    "createdAt": "2025-11-12T10:00:00.000Z",
    "updatedAt": "2025-11-12T10:00:00.000Z"
  }
}
```

---

### Login

Authenticate with email and password.

**Endpoint:** `POST /api/auth/local`

**Request:**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### Forgot Password

Request password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

### Reset Password

Reset password with token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "code": "token-from-email",
  "password": "NewSecurePassword123!",
  "passwordConfirmation": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### Using JWT Token

Include the JWT token in the `Authorization` header for protected endpoints:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.ruach.org/api/users/me
```

---

## 🎬 Media Endpoints

### List Media Items

Get a paginated list of media items.

**Endpoint:** `GET /api/media-items`

**Query Parameters:**
- `pagination[page]` - Page number (default: 1)
- `pagination[pageSize]` - Items per page (default: 25, max: 100)
- `sort` - Sort by field (e.g., `publishedAt:desc`, `title:asc`)
- `filters[featured][$eq]` - Filter by featured (true/false)
- `filters[category][slug][$eq]` - Filter by category slug
- `populate` - Include relations (e.g., `*`, `thumbnail`, `category`)

**Example:**
```bash
GET /api/media-items?pagination[pageSize]=10&sort=publishedAt:desc&populate=*
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Sunday Service - Faith",
        "slug": "sunday-service-faith",
        "description": "A powerful message on faith",
        "excerpt": "Join us for worship",
        "publishedAt": "2025-11-12T10:00:00.000Z",
        "views": 1234,
        "likes": 56,
        "durationSec": 1800,
        "featured": true,
        "category": {
          "data": {
            "id": 1,
            "attributes": {
              "name": "Sermons",
              "slug": "sermons"
            }
          }
        },
        "thumbnail": {
          "data": {
            "id": 1,
            "attributes": {
              "url": "/uploads/thumbnail.jpg",
              "alternativeText": "Service thumbnail"
            }
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

---

### Get Media Item by ID

**Endpoint:** `GET /api/media-items/:id`

**Example:**
```bash
GET /api/media-items/1?populate=*
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "Sunday Service - Faith",
      "slug": "sunday-service-faith",
      "description": "A powerful message on faith",
      "videoUrl": "https://youtube.com/watch?v=...",
      "publishedAt": "2025-11-12T10:00:00.000Z",
      "views": 1234,
      "likes": 56,
      "category": { ... },
      "speakers": { ... },
      "thumbnail": { ... }
    }
  }
}
```

---

### Get Media Item by Slug

**Endpoint:** `GET /api/media-items?filters[slug][$eq]=:slug`

**Example:**
```bash
GET /api/media-items?filters[slug][$eq]=sunday-service-faith&populate=*
```

---

### Create Media Item

**Endpoint:** `POST /api/media-items` (Admin only)

**Authorization:** Required (Admin JWT)

**Request:**
```json
{
  "data": {
    "title": "New Sermon",
    "slug": "new-sermon",
    "description": "Description here",
    "videoUrl": "https://youtube.com/watch?v=...",
    "category": 1,
    "featured": false,
    "publishedAt": "2025-11-12T10:00:00.000Z"
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 123,
    "attributes": { ... }
  }
}
```

---

### Update Media Item

**Endpoint:** `PUT /api/media-items/:id` (Admin only)

**Authorization:** Required (Admin JWT)

**Request:**
```json
{
  "data": {
    "title": "Updated Title",
    "featured": true
  }
}
```

---

### Delete Media Item

**Endpoint:** `DELETE /api/media-items/:id` (Admin only)

**Authorization:** Required (Admin JWT)

**Response (200 OK):**
```json
{
  "data": {
    "id": 123,
    "attributes": { ... }
  }
}
```

---

## 📚 Course Endpoints

### List Courses

**Endpoint:** `GET /api/courses`

**Query Parameters:** Same as media items

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Biblical Foundations",
        "slug": "biblical-foundations",
        "description": "Learn the basics of faith",
        "price": 0,
        "featured": true,
        "enrollmentCount": 245,
        "lessonCount": 12,
        "thumbnail": { ... },
        "instructor": { ... }
      }
    }
  ],
  "meta": { ... }
}
```

---

### Get Course by ID

**Endpoint:** `GET /api/courses/:id?populate=*`

**Response:** Course with all relations populated

---

### Enroll in Course

**Endpoint:** `POST /api/course-enrollments` (Authenticated)

**Authorization:** Required (User JWT)

**Request:**
```json
{
  "data": {
    "course": 1,
    "user": 1
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "course": { ... },
      "user": { ... },
      "enrolledAt": "2025-11-12T10:00:00.000Z",
      "completedAt": null,
      "progress": 0
    }
  }
}
```

---

### Track Lesson Progress

**Endpoint:** `POST /api/lesson-progresses` (Authenticated)

**Authorization:** Required (User JWT)

**Request:**
```json
{
  "data": {
    "lesson": 1,
    "user": 1,
    "completed": true,
    "watchedSeconds": 600
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "lesson": { ... },
      "user": { ... },
      "completed": true,
      "watchedSeconds": 600,
      "completedAt": "2025-11-12T10:00:00.000Z"
    }
  }
}
```

---

## 👤 User Endpoints

### Get Current User

**Endpoint:** `GET /api/users/me` (Authenticated)

**Authorization:** Required (User JWT)

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "provider": "local",
  "confirmed": true,
  "blocked": false,
  "role": {
    "id": 1,
    "name": "Authenticated",
    "description": "Default role for authenticated users",
    "type": "authenticated"
  },
  "createdAt": "2025-11-12T10:00:00.000Z",
  "updatedAt": "2025-11-12T10:00:00.000Z"
}
```

---

### Update User

**Endpoint:** `PUT /api/users/:id` (Authenticated)

**Authorization:** Required (User JWT, own profile only)

**Request:**
```json
{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "new_username",
  "email": "newemail@example.com",
  ...
}
```

---

### Get User Profile

**Endpoint:** `GET /api/user-profiles/:id`

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Faith believer",
      "avatar": { ... },
      "user": { ... }
    }
  }
}
```

---

## 📖 Scripture Endpoints

### Lookup Scripture

**Endpoint:** `GET /api/scripture`

**Query Parameters:**
- `reference` - Scripture reference (e.g., "John 3:16")

**Example:**
```bash
GET /api/scripture?reference=John%203:16
```

**Response (200 OK):**
```json
{
  "reference": "John 3:16",
  "verses": [
    {
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "For God so loved the world, that he gave his only begotten Son..."
    }
  ],
  "copyright": "King James Version (KJV) - Public Domain"
}
```

---

## 🤖 AI Endpoints

### Chat with AI Assistant

**Endpoint:** `POST /api/ai/chat` (Authenticated)

**Authorization:** Required (User JWT)

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What does John 3:16 mean?"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": {
    "role": "assistant",
    "content": "John 3:16 is one of the most well-known verses..."
  },
  "sources": [
    {
      "title": "Understanding John 3:16",
      "url": "/media/john-3-16-explained"
    }
  ]
}
```

---

### Generate Embeddings

**Endpoint:** `POST /api/ai/embed` (Admin only)

**Authorization:** Required (Admin JWT)

**Request:**
```json
{
  "text": "For God so loved the world...",
  "contentType": "scripture",
  "contentId": 123
}
```

**Response (200 OK):**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],
  "dimensions": 1536
}
```

---

### Semantic Search

**Endpoint:** `POST /api/ai/search`

**Request:**
```json
{
  "query": "faith and works",
  "limit": 10
}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": 123,
      "type": "media",
      "title": "Faith Without Works",
      "score": 0.95,
      "url": "/media/faith-without-works"
    }
  ]
}
```

---

## 📊 Analytics Endpoints

### Track Event

**Endpoint:** `POST /api/analytics/track`

**Request:**
```json
{
  "event": "media_view",
  "properties": {
    "mediaId": 123,
    "duration": 600,
    "completed": false
  }
}
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

### Get Analytics Dashboard

**Endpoint:** `GET /api/analytics/dashboard` (Admin only)

**Authorization:** Required (Admin JWT)

**Response (200 OK):**
```json
{
  "pageViews": 12345,
  "uniqueVisitors": 3456,
  "topPages": [
    {
      "path": "/media/sunday-service",
      "views": 567
    }
  ],
  "topMedia": [
    {
      "id": 123,
      "title": "Sunday Service",
      "views": 1234
    }
  ]
}
```

---

## ⚠️ Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Invalid request parameters",
    "details": {
      "errors": [
        {
          "path": ["email"],
          "message": "Email is required"
        }
      ]
    }
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 🚦 Rate Limiting

### Limits

**Authenticated Users:**
- 1000 requests per hour
- 10,000 requests per day

**Anonymous Users:**
- 100 requests per hour
- 1,000 requests per day

**Admin Users:**
- 10,000 requests per hour
- Unlimited per day

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699876543
```

### Rate Limit Exceeded

When limit is exceeded:

**Response (429 Too Many Requests):**
```json
{
  "error": {
    "status": 429,
    "name": "TooManyRequestsError",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

---

## 🔍 Query Language

### Filtering

**Operators:**
- `$eq` - Equal
- `$ne` - Not equal
- `$lt` - Less than
- `$lte` - Less than or equal
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$in` - In array
- `$notIn` - Not in array
- `$contains` - Contains (string)
- `$notContains` - Not contains
- `$startsWith` - Starts with
- `$endsWith` - Ends with
- `$null` - Is null
- `$notNull` - Is not null

**Examples:**

Featured media:
```
?filters[featured][$eq]=true
```

Published after date:
```
?filters[publishedAt][$gte]=2025-01-01
```

Title contains "faith":
```
?filters[title][$contains]=faith
```

Category is Sermons or Worship:
```
?filters[category][slug][$in][0]=sermons&filters[category][slug][$in][1]=worship
```

### Sorting

**Single field:**
```
?sort=publishedAt:desc
```

**Multiple fields:**
```
?sort[0]=featured:desc&sort[1]=publishedAt:desc
```

### Pagination

**Page-based:**
```
?pagination[page]=2&pagination[pageSize]=25
```

**Offset-based:**
```
?pagination[start]=50&pagination[limit]=25
```

### Population

**All relations:**
```
?populate=*
```

**Specific relations:**
```
?populate[0]=thumbnail&populate[1]=category&populate[2]=speakers
```

**Nested relations:**
```
?populate[category][populate][0]=parent
```

### Field Selection

**Include specific fields:**
```
?fields[0]=title&fields[1]=slug&fields[2]=publishedAt
```

---

## 📚 Additional Resources

- **Strapi Documentation:** https://docs.strapi.io
- **REST API Guide:** https://docs.strapi.io/dev-docs/api/rest
- **GraphQL API:** https://docs.strapi.io/dev-docs/api/graphql

---

## 🔐 Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (httpOnly cookies recommended)
3. **Never expose sensitive data** in responses
4. **Validate all input** on the server
5. **Use CORS properly** to restrict origins
6. **Implement rate limiting** to prevent abuse
7. **Log security events** for audit trails
8. **Keep dependencies updated** regularly

---

## 📞 Support

- **API Issues:** Open an issue on GitHub
- **Questions:** Check documentation or ask in discussions
- **Security:** Email security@ruach.org

---

**Happy coding! 🚀**
