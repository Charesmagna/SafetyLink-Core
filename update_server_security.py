import sys

file_path = "server.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add imports
content = content.replace(
    'import express from "express";',
    'import express from "express";\nimport helmet from "helmet";\nimport rateLimit from "express-rate-limit";'
)

# Add middleware
middleware = """  const app = express();
  const PORT = 3000;

  // Security Hardening: Helmet protects from common web vulnerabilities by setting HTTP headers.
  // We disable the contentSecurityPolicy in dev so Vite HMR works.
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false }));

  // Security Hardening: Rate Limiting to prevent brute-force attacks on our APIs.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
  });
  app.use("/api/", apiLimiter);

  app.use(express.json({ limit: "50mb" }));"""

content = content.replace(
    '  const app = express();\n  const PORT = 3000;\n\n  app.use(express.json({ limit: "50mb" }));',
    middleware
)

with open(file_path, "w") as f:
    f.write(content)

