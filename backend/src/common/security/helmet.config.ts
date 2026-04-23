import helmet from 'helmet';

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://avatar.iran.liara.run", "data:"],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || 'http://localhost:5173',
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' as const },
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' as const },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  xssFilter: true,
};

export const helmetMiddleware = helmet(helmetConfig);
