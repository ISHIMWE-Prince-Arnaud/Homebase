# Security Documentation

This document outlines the security measures implemented in the HomeBase backend application.

## Rate Limiting Policies

### Auth Endpoints (Strict)
- **Endpoints**: `POST /auth/register`, `POST /auth/login`
- **Limit**: 10 requests per minute per IP
- **Purpose**: Prevent brute-force attacks on authentication

### Profile Updates (Medium)
- **Endpoints**: `PATCH /auth/users/me`
- **Limit**: 20 requests per minute per IP
- **Purpose**: Prevent abuse of profile update functionality

### General API (Standard)
- **Endpoints**: All other endpoints
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Standard API usage protection

### Global Fallback
- **Limit**: 300 requests per hour per IP
- **Purpose**: Global ceiling for all requests

## Security Headers

The application uses Helmet middleware to set the following security headers:

- **Content-Security-Policy**: Controls resources the browser can load
- **Cross-Origin-Embedder-Policy**: Controls cross-origin embedding
- **Cross-Origin-Opener-Policy**: Controls cross-origin window opening
- **Cross-Origin-Resource-Policy**: Controls cross-origin resource access
- **DNS-Prefetch-Control**: Disables DNS prefetching
- **Frameguard**: Prevents clickjacking (X-Frame-Options: DENY)
- **Hide-Powered-By**: Removes X-Powered-By header
- **HSTS**: Enforces HTTPS in production (max-age: 31536000, includeSubDomains, preload)
- **IE-No-Open**: Prevents IE from opening downloads directly
- **No-Sniff**: Prevents MIME type sniffing (X-Content-Type-Options: nosniff)
- **Origin-Agent-Cluster**: Isolates origins
- **Permitted-Cross-Domain-Policies**: Restricts cross-domain policies
- **Referrer-Policy**: Controls referrer information
- **XSS-Filter**: Enables legacy XSS filter

## CORS Configuration

- **Allowed Origins**: Configured via `FRONTEND_URL` environment variable
- **Allowed Methods**: GET, HEAD, PUT, PATCH, POST, DELETE
- **Credentials**: Enabled (allows cookies)
- **Preflight Cache**: 24 hours (86400 seconds)

## Cookie Security Attributes

- **httpOnly**: Enabled (prevents XSS access)
- **secure**: Enabled in production (HTTPS only)
- **sameSite**: 'none' in production, 'lax' in development
- **domain**: Set to 'localhost' in development, undefined in production
- **path**: '/'
- **maxAge**: 7 days (604800000 milliseconds)

## Request Size Limiting

- **JSON payloads**: Limited to 10kb
- **URL-encoded payloads**: Limited to 10kb
- **Purpose**: Prevent DoS attacks via large payloads

## JWT Configuration

- **Secret**: Configured via `JWT_SECRET` environment variable
- **Expiration**: 7 days (configurable via `JWT_EXPIRATION`)
- **Storage**: httpOnly cookies

## Environment Variables

See `.env.example` for all security-related environment variables.

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not disclose it publicly
2. Send a detailed report to the maintainers
3. Include steps to reproduce the issue
4. Allow time for the issue to be fixed before disclosure

## Security Testing

Run security tests with:
```bash
npm run test:e2e test/security.e2e-spec.ts
npm test src/common/guards/throttler.guards.spec.ts
```

## Additional Recommendations

### Future Enhancements
- Implement refresh token rotation for JWT
- Consider shorter access token expiration (15-60 minutes)
- Add IP-based token binding
- Implement Redis for distributed rate limiting
- Add request signing for sensitive operations

### Production Checklist
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure production FRONTEND_URL
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Review and adjust rate limiting limits
- [ ] Configure CORS origins appropriately
- [ ] Set up security monitoring and alerting
