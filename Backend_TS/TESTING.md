# Authentication Routes Testing Guide

## Setup

### Prerequisites

- MongoDB running locally or accessible via `MONGODB_URI` in `.env`
- Node.js and npm installed

### Install Dependencies

```bash
npm install
```

Jest and Supertest are already included.

---

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode (re-run on file changes)

```bash
npm run test:watch
```

### Run tests with verbose output

```bash
npm test -- --verbose
```

### Run a specific test file

```bash
npm test -- tests/auth.test.ts
```

### Run tests with coverage report

```bash
npm test -- --coverage
```

---

## Test Coverage

### ✅ Register Tests

- ✔ Register a new user successfully
- ✔ Fail with duplicate username
- ✔ Fail with invalid email
- ✔ Fail with short password

### ✅ Login Tests

- ✔ Login successfully
- ✔ Fail with wrong password
- ✔ Fail with non-existent user
- ✔ Create session with device info (iPhone, Android, etc.)

### ✅ Sessions Tests

- ✔ List all active sessions
- ✔ Fail without authentication
- ✔ Fail with invalid token
- ✔ Verify session contains: device, ip, createdAt, expiresAt
- ✔ Verify sensitive data (hashedRefreshToken) is not exposed

### ✅ Refresh Token Tests

- ✔ Refresh access token successfully
- ✔ Fail with missing refresh token
- ✔ Fail with invalid refresh token

### ✅ Logout Session Tests

- ✔ Logout from specific session
- ✔ Fail without authentication
- ✔ Fail with missing session ID
- ✔ Verify session is deleted from database

### ✅ Logout All Sessions Tests

- ✔ Logout from all sessions
- ✔ Fail without authentication

### ✅ Profile Tests

- ✔ Get user profile
- ✔ Fail without authentication
- ✔ Fail with invalid token

---

## Expected Test Output

When all tests pass, you should see:

```
PASS  tests/auth.test.ts
  Auth Routes
    POST /api/auth/register
      ✓ should register a new user successfully (234 ms)
      ✓ should fail with duplicate username (123 ms)
      ✓ should fail with invalid email (98 ms)
      ✓ should fail with short password (102 ms)
    POST /api/auth/login
      ✓ should login successfully (156 ms)
      ✓ should fail with wrong password (145 ms)
      ✓ should fail with non-existent user (134 ms)
      ✓ should create session with device info (189 ms)
    GET /api/auth/sessions
      ✓ should list all active sessions (167 ms)
      ✓ should fail without authentication (105 ms)
      ✓ should fail with invalid token (98 ms)
    POST /api/auth/refresh-token
      ✓ should refresh access token (201 ms)
      ✓ should fail with missing refresh token (89 ms)
      ✓ should fail with invalid refresh token (134 ms)
    POST /api/auth/logout-session
      ✓ should logout from specific session (156 ms)
      ✓ should fail without authentication (94 ms)
      ✓ should fail with missing session ID (87 ms)
    POST /api/auth/logout-all
      ✓ should logout from all sessions (145 ms)
      ✓ should fail without authentication (92 ms)
    GET /api/auth/profile
      ✓ POST /auth/login first (178 ms)
      ✓ should get user profile (134 ms)
      ✓ should fail without authentication (89 ms)
      ✓ should fail with invalid token (123 ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
```

---

## Manual Testing with cURL

### 1. Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` and `refreshToken` from the response.

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone)" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Get active sessions

```bash
curl -X GET http://localhost:5000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh access token

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Logout from one device

```bash
curl -X POST http://localhost:5000/api/auth/logout-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID_FROM_SESSIONS_LIST"
  }'
```

### 6. Logout from all devices

```bash
curl -X POST http://localhost:5000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Get profile

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Using Postman

1. Import the collection from [auth-routes.postman_collection.json](./auth-routes.postman_collection.json)
2. Set `baseUrl` environment variable to `http://localhost:5000`
3. Run requests in order from top to bottom
4. Use Postman's "Tests" tab to auto-verify responses

---

## Troubleshooting

### Tests fail with "MongoDB connection error"

- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Make sure the database exists

### Tests timeout

- Increase Jest timeout: Add `--testTimeout=30000` to test command
- Check if MongoDB is responsive

### TypeScript errors

- Run `npm run build` to compile
- Check tsconfig.json is correct

### Session tests fail

- Make sure previous tests cleaned up data
- Check User and UserSession collections in MongoDB

---

## Continuous Integration

To run tests in CI/CD pipeline:

```bash
npm test -- --coverage --passWithNoTests
```

---

## Test Database Cleanup

Tests automatically clean up after themselves. To manually clear test data:

```bash
# In MongoDB shell
use lingo-test
db.users.deleteMany({})
db.usersessions.deleteMany({})
```

---

## Security Features Tested

✅ Password hashing with bcrypt
✅ JWT token generation and validation
✅ Hashed refresh token storage
✅ Session expiration
✅ Multi-device login tracking
✅ Device and IP logging
✅ Authorization middleware
✅ Input validation with Zod
✅ Proper error messages
