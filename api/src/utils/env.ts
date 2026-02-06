import { logger } from "./logger";

const REQUIRED_VARS = ["JWT_SECRET", "DATABASE_URL"] as const;

const OPTIONAL_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PREMIUM_PRICE_ID",
  "ADMIN_EMAILS",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

const JWT_SECRET_MIN_LENGTH = 32;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error("missing required environment variables", { missing });
    process.exit(1);
  }

  // JWT_SECRET must be long enough for HS256 (256 bits minimum)
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
    logger.error(
      `JWT_SECRET is too short (${jwtSecret.length} chars). Minimum ${JWT_SECRET_MIN_LENGTH} characters required for secure signing.`
    );
    process.exit(1);
  }

  const missingOptional: string[] = [];
  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }

  if (missingOptional.length > 0) {
    logger.warn("missing optional environment variables — some features will be unavailable", {
      missing: missingOptional,
    });
  }
}

// Run validation immediately on import, before other modules load
validateEnv();
