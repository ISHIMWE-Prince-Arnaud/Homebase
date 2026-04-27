# Error Codes Reference

Complete reference for all error responses from the Homebase API.

## HTTP Status Codes Used

| Status | Meaning | Usage |
|--------|---------|-------|
| 200 | OK | Successful GET, PATCH operations |
| 201 | Created | Successful POST operations |
| 204 | No Content | Successful DELETE operations |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Business logic validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Error Response Format

### Standard Error Structure

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "Email already exists" }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | number | HTTP status code |
| `message` | string | Human-readable error description |
| `error` | string | Error category (e.g., "Bad Request") |
| `details` | array | Optional field-level validation errors |

## Authentication Errors (401)

### Missing Token

**Status:** 401  
**Scenario:** No JWT cookie present on protected endpoint

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Resolution:** Authenticate via `/auth/login` or `/auth/register` to receive JWT cookie.

### Invalid Token

**Status:** 401  
**Scenario:** JWT signature invalid, token malformed, or tampered

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Resolution:** Re-authenticate to receive new valid token.

### Expired Token

**Status:** 401  
**Scenario:** JWT has exceeded `JWT_EXPIRATION` (default 7 days)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Resolution:** Login again to refresh token.

## Authorization Errors (403)

### Not Household Member

**Status:** 403  
**Scenario:** User attempts to access data from a household they don't belong to

```json
{
  "statusCode": 403,
  "message": "You do not have access to this household",
  "error": "Forbidden"
}
```

**Resolution:** Ensure user's `householdId` matches the requested resource's `householdId`.

### Household Required

**Status:** 403  
**Scenario:** User without a household attempts household-scoped operation

```json
{
  "statusCode": 403,
  "message": "You must be in a household to perform this action",
  "error": "Forbidden"
}
```

**Resolution:** User must create or join a household first via `/households`.

## Validation Errors (400)

### Email Already Exists

**Status:** 400 / 409  
**Endpoint:** `POST /auth/register`  
**Scenario:** Attempting to register with an email already in use

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "Email already exists" }
  ]
}
```

### Invalid Email Format

**Status:** 400  
**Scenario:** Email doesn't match valid email pattern

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Weak Password

**Status:** 400  
**Scenario:** Password doesn't meet minimum requirements (if enforced)

```json
{
  "statusCode": 400,
  "message": "Password must be at least 8 characters",
  "error": "Bad Request"
}
```

### Required Field Missing

**Status:** 400  
**Scenario:** Required field not provided

```json
{
  "statusCode": 400,
  "message": ["name should not be empty"],
  "error": "Bad Request"
}
```

## Not Found Errors (404)

### User Not Found

**Status:** 404  
**Endpoint:** `POST /auth/login`  
**Scenario:** Login attempted with non-existent email

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Chore Not Found

**Status:** 404  
**Endpoint:** `GET|PATCH|DELETE /chores/:id`  
**Scenario:** Chore ID doesn't exist or doesn't belong to user's household

```json
{
  "statusCode": 404,
  "message": "Chore not found",
  "error": "Not Found"
}
```

### Expense Not Found

**Status:** 404  
**Endpoint:** Expense endpoints  
**Scenario:** Expense ID invalid or inaccessible

```json
{
  "statusCode": 404,
  "message": "Expense not found",
  "error": "Not Found"
}
```

### Household Not Found

**Status:** 404  
**Endpoint:** Various  
**Scenario:** Referenced household doesn't exist

```json
{
  "statusCode": 404,
  "message": "Household not found",
  "error": "Not Found"
}
```

### Notification Not Found

**Status:** 404  
**Endpoint:** Notification endpoints  
**Scenario:** Notification ID invalid

```json
{
  "statusCode": 404,
  "message": "Notification not found",
  "error": "Not Found"
}
```

## Business Logic Errors (422)

### Invalid Invite Code

**Status:** 400 / 422  
**Endpoint:** `POST /households/join`  
**Scenario:** Join code doesn't match any existing household

```json
{
  "statusCode": 400,
  "message": "Invalid invite code",
  "error": "Bad Request"
}
```

### Already in Household

**Status:** 422  
**Endpoint:** `POST /households` or `POST /households/join`  
**Scenario:** User already belongs to a household

```json
{
  "statusCode": 422,
  "message": "You must leave your current household first",
  "error": "Unprocessable Entity"
}
```

### Outstanding Balance (Cannot Leave Household)

**Status:** 422  
**Endpoint:** `POST /households/leave`  
**Scenario:** User tries to leave with non-zero balance

```json
{
  "statusCode": 422,
  "message": "You must settle your balance before leaving the household",
  "error": "Unprocessable Entity"
}
```

**Resolution:** User must record payments to bring balance to zero or receive payments to offset debt.

### Invalid Payment Amount

**Status:** 422  
**Endpoint:** `POST /payments`  
**Scenario:** Payment amount exceeds owed amount

```json
{
  "statusCode": 422,
  "message": "Payment amount exceeds the debt owed",
  "error": "Unprocessable Entity"
}
```

### Self-Payment Not Allowed

**Status:** 422  
**Endpoint:** `POST /payments`  
**Scenario:** User tries to pay themselves

```json
{
  "statusCode": 422,
  "message": "Cannot record payment to yourself",
  "error": "Unprocessable Entity"
}
```

### Invalid Expense Split

**Status:** 422  
**Endpoint:** `POST /expenses`  
**Scenario:** Sum of participant shares doesn't equal totalAmount

```json
{
  "statusCode": 422,
  "message": "Sum of shares must equal total amount",
  "error": "Unprocessable Entity"
}
```

### Cannot Delete Purchased Need

**Status:** 422  
**Endpoint:** `DELETE /needs/:id`  
**Scenario:** Attempting to delete an already purchased item

```json
{
  "statusCode": 422,
  "message": "Cannot delete a purchased need",
  "error": "Unprocessable Entity"
}
```

## Rate Limiting Errors (429)

### Auth Endpoint Limit

**Status:** 429  
**Endpoints:** `/auth/login`, `/auth/register`  
**Limit:** 10 requests per minute (configurable via `THROTTLE_TTL_SHORT`)

```json
{
  "statusCode": 429,
  "message": "Throttled",
  "error": "Too Many Requests"
}
```

**Response Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
```

### Profile Update Limit

**Status:** 429  
**Endpoint:** `PATCH /auth/users/me`  
**Limit:** 100 requests per 15 minutes

```json
{
  "statusCode": 429,
  "message": "Throttled",
  "error": "Too Many Requests"
}
```

### General API Limit

**Status:** 429  
**Endpoints:** All other endpoints  
**Limit:** 300 requests per hour (configurable via `THROTTLE_TTL_LONG`)

```json
{
  "statusCode": 429,
  "message": "Throttled",
  "error": "Too Many Requests"
}
```

## Conflict Errors (409)

### Duplicate Resource

**Status:** 409  
**Scenario:** Attempting to create resource that would violate uniqueness

```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict"
}
```

## Internal Server Errors (500)

### Unexpected Error

**Status:** 500  
**Scenario:** Unhandled exception, database connection failure, etc.

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

**Note:** In production, detailed error messages are not exposed to clients for security. Check server logs for details.

## Error Handling Best Practices

### Frontend Error Handling Pattern

```typescript
// api/client.ts with error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          toast.error(data.message || 'Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          // Show business logic error
          toast.error(data.message);
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Something went wrong. Please try again.');
          break;
      }
    }
    return Promise.reject(error);
  }
);
```

### Form Validation Error Display

```typescript
// Display field-level errors
const handleSubmit = async (values) => {
  try {
    await api.post('/auth/register', values);
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.details) {
      // Set field errors
      error.response.data.details.forEach(({ field, message }) => {
        form.setError(field, { message });
      });
    }
  }
};
```

## Error Codes Summary Table

| Code | Category | Common Scenarios |
|------|----------|------------------|
| 400 | Validation | Invalid input, missing fields, format errors |
| 401 | Authentication | No token, invalid token, expired token |
| 403 | Authorization | Wrong household, no household, insufficient permissions |
| 404 | Not Found | Resource doesn't exist, wrong ID |
| 409 | Conflict | Duplicate data, concurrent modification |
| 422 | Business Logic | Invalid invite, unsettled balance, invalid split |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Unexpected exceptions, DB failures |

## Debugging Errors

### Enable Detailed Logging (Development Only)

```typescript
// In NestJS bootstrap
app.useGlobalInterceptors(new LoggingInterceptor());
```

### Common Debugging Steps

1. **Check Network Tab** - Verify request/response in browser DevTools
2. **Validate JWT** - Use jwt.io to inspect token contents
3. **Check Server Logs** - Look for stack traces
4. **Verify Cookies** - Ensure `access_token` is being sent
5. **Test in Incognito** - Rule out extension interference
6. **Check CORS** - Ensure `FRONTEND_URL` matches exactly

## Further Reading

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [class-validator Documentation](https://github.com/typestack/class-validator)
