// Configuration for rate limiting
// - Short window (1 min): 10 requests for auth endpoints (brute-force protection)
// - Medium window (15 min): 100 requests for general API
// - Long window (1 hour): 300 requests per IP

export const throttlerConfig = {
  ttl: {
    short: parseInt(process.env.THROTTLE_TTL_SHORT || '60000'), // 1 minute
    medium: parseInt(process.env.THROTTLE_TTL_MEDIUM || '900000'), // 15 minutes
    long: parseInt(process.env.THROTTLE_TTL_LONG || '3600000'), // 1 hour
  },
  limit: {
    short: parseInt(process.env.THROTTLE_LIMIT_SHORT || '10'), // 10 requests
    medium: parseInt(process.env.THROTTLE_LIMIT_MEDIUM || '100'), // 100 requests
    long: parseInt(process.env.THROTTLE_LIMIT_LONG || '300'), // 300 requests
  },
};
