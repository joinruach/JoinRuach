/**
 * Environment Variable Validation
 *
 * Validates critical environment variables to ensure security standards are met.
 * This runs at build time and startup to catch configuration issues early.
 */

const MINIMUM_SECRET_LENGTH = 32;
const INSECURE_PATTERNS = [
  /change_me/i,
  /tobemodified/i,
  /^example/i, // Only flag if starts with "example"
  /^test/i, // Only flag if starts with "test"
  /^password/i, // Only flag if starts with "password"
  /^secret$/i, // Only flag if exactly "secret"
  /^(12345|abcdef|qwerty)/i,
  /REPLACE_WITH/i, // Flag placeholder format
  /^[a-z]{8,}$/i // Flag all lowercase simple words
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check if a secret value is secure
 */
function isSecureSecret(value: string | undefined, name: string): { valid: boolean; message?: string } {
  if (!value) {
    return { valid: false, message: `${name} is not set` };
  }

  // Check minimum length
  if (value.length < MINIMUM_SECRET_LENGTH) {
    return {
      valid: false,
      message: `${name} must be at least ${MINIMUM_SECRET_LENGTH} characters (current: ${value.length})`
    };
  }

  // Check for insecure patterns
  for (const pattern of INSECURE_PATTERNS) {
    if (pattern.test(value)) {
      return {
        valid: false,
        message: `${name} contains insecure pattern. Generate a secure random string using: openssl rand -base64 32`
      };
    }
  }

  // Check for low entropy (too repetitive)
  const uniqueChars = new Set(value).size;
  if (uniqueChars < 10) {
    return {
      valid: false,
      message: `${name} has low entropy (only ${uniqueChars} unique characters). Use a cryptographically random string.`
    };
  }

  return { valid: true };
}

/**
 * Validate all critical environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only enforce strict validation in production
  const isProduction = process.env.NODE_ENV === "production";

  // Validate NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const secretCheck = isSecureSecret(nextAuthSecret, "NEXTAUTH_SECRET");

  if (!secretCheck.valid) {
    if (isProduction) {
      errors.push(secretCheck.message!);
    } else {
      warnings.push(`[Development] ${secretCheck.message!}`);
    }
  }

  // Validate NEXTAUTH_URL
  if (!process.env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is not set");
  }

  // Validate Strapi URL
  if (!process.env.NEXT_PUBLIC_STRAPI_URL) {
    errors.push("NEXT_PUBLIC_STRAPI_URL is not set");
  }

  // Validate Redis credentials (warning only, as it's optional)
  const hasRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedisUrl && !hasRedisToken) {
    warnings.push("UPSTASH_REDIS_REST_URL is set but UPSTASH_REDIS_REST_TOKEN is missing");
  } else if (!hasRedisUrl && hasRedisToken) {
    warnings.push("UPSTASH_REDIS_REST_TOKEN is set but UPSTASH_REDIS_REST_URL is missing");
  }

  if (!hasRedisUrl && !hasRedisToken) {
    warnings.push(
      "Redis credentials not configured. Rate limiting and token blacklist will use in-memory storage (not recommended for production)."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment and throw if critical errors exist
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Environment Warnings:");
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn("");
  }

  // Throw on errors
  if (!result.valid) {
    console.error("\n❌ Environment Validation Failed:");
    result.errors.forEach(error => console.error(`  - ${error}`));
    console.error("\nPlease check your .env file and update the required variables.\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error("Environment validation failed. Cannot start application.");
    } else {
      console.warn("⚠️  Continuing in development mode with invalid configuration.\n");
    }
  } else if (result.warnings.length === 0) {
    console.log("✅ Environment validation passed\n");
  }
}

// Run validation on import in production
if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
  requireValidEnvironment();
}
