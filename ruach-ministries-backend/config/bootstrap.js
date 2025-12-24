const dotenv = require("dotenv");

const DEFAULT_FROM_EMAIL = "no-reply@updates.joinruach.org";
const DEFAULT_FROM_NAME = "Ruach";
const DEFAULT_REPLY_TO = "support@ruachstudio.com";
const DEFAULT_PUBLIC_URL = "https://joinruach.org";
const DEFAULT_BACKEND_URL = "http://localhost:1337";
const DEFAULT_CONFIRM_REDIRECT = `${DEFAULT_PUBLIC_URL}/confirmed?status=success`;
const DEFAULT_CONFIRM_LINK = `${DEFAULT_BACKEND_URL}/api/auth/email-confirmation`;
const DEFAULT_RESET_REDIRECT = `${DEFAULT_PUBLIC_URL}/reset-password`;

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length ? value.trim() : fallback;
};

const trimTrailingSlash = (value = "") => value.replace(/\/$/, "");

const appendQueryParam = (base, key, value) => {
  if (!base) {
    return base;
  }

  const hasQuery = base.includes("?");
  const separator = hasQuery ? (base.endsWith("?") || base.endsWith("&") ? "" : "&") : "?";
  return `${base}${separator}${key}=${value}`;
};

const joinPath = (base, path) => `${trimTrailingSlash(base)}${path}`;

module.exports = async ({ strapi } = {}) => {
  dotenv.config();

  if (!strapi || typeof strapi.store !== "function") {
    return;
  }

  const pluginStore = strapi.store({ type: "plugin", name: "users-permissions" });

  const emailTemplates = (await pluginStore.get({ key: "email" })) ?? {};
  const confirmationTemplate = emailTemplates.email_confirmation ?? { options: {} };
  const resetTemplate = emailTemplates.reset_password ?? { options: {} };

  const defaultFromEmail = getEnv("EMAIL_DEFAULT_FROM", DEFAULT_FROM_EMAIL);
  const defaultFromName = getEnv("EMAIL_DEFAULT_FROM_NAME", DEFAULT_FROM_NAME);
  const defaultReplyTo = getEnv("EMAIL_DEFAULT_REPLY_TO", DEFAULT_REPLY_TO);
  const publicBase = trimTrailingSlash(
    getEnv("STRAPI_PUBLIC_URL", getEnv("FRONTEND_URL", DEFAULT_PUBLIC_URL))
  );
  const backendBase = trimTrailingSlash(getEnv("STRAPI_BACKEND_URL", DEFAULT_BACKEND_URL));
  const confirmationRedirect = getEnv(
    "STRAPI_EMAIL_CONFIRM_REDIRECT",
    `${publicBase || DEFAULT_PUBLIC_URL}/confirmed?status=success`
  );
  const confirmationLinkBase = getEnv(
    "STRAPI_EMAIL_CONFIRM_LINK",
    joinPath(backendBase || DEFAULT_BACKEND_URL, "/api/auth/email-confirmation")
  );
  const confirmationLinkUrl = appendQueryParam(
    confirmationLinkBase || DEFAULT_CONFIRM_LINK,
    "confirmation",
    "<%= CODE %>"
  );
  const resetRedirect = getEnv(
    "STRAPI_RESET_PASSWORD_REDIRECT",
    `${publicBase || DEFAULT_PUBLIC_URL}/reset-password`
  );

  emailTemplates.email_confirmation = {
    ...confirmationTemplate,
    options: {
      ...(confirmationTemplate.options ?? {}),
      from: {
        name: defaultFromName,
        email: defaultFromEmail,
      },
      response_email: defaultReplyTo,
      object: confirmationTemplate.options?.object ?? "Account confirmation",
      message: [
        "<p>Thank you for registering!</p>",
        "<p>You have to confirm your email address. Please click on the button below.</p>",
        `<p><a href="${confirmationLinkUrl}">Confirm my email address</a></p>`,
        "<p>If the button does not work, copy and paste this link into your browser:</p>",
        `<p>${confirmationLinkUrl}</p>`,
        "<p>Thanks.</p>",
      ].join("\n\n"),
    },
  };

  emailTemplates.reset_password = {
    ...resetTemplate,
    options: {
      ...(resetTemplate.options ?? {}),
      from: {
        name: defaultFromName,
        email: defaultFromEmail,
      },
      response_email: defaultReplyTo,
      object: resetTemplate.options?.object ?? "Reset your password",
      message: [
        "<p>We received a request to reset your password.</p>",
        "<p>Click the button below to choose a new password.</p>",
        `<p><a href="${resetRedirect}?code=<%= TOKEN %>">Reset my password</a></p>`,
        "<p>If the button does not work, copy and paste this link into your browser:</p>",
        `<p>${resetRedirect}?code=<%= TOKEN %></p>`,
        "<p>If you didn&apos;t request this, you can safely ignore this email.</p>",
      ].join("\n\n"),
    },
  };

  await pluginStore.set({ key: "email", value: emailTemplates });

  const advancedSettings = (await pluginStore.get({ key: "advanced" })) ?? {};
  advancedSettings.email_confirmation = true;
  advancedSettings.email_confirmation_redirection = confirmationRedirect;
  advancedSettings.email_reset_password = resetRedirect;

  await pluginStore.set({ key: "advanced", value: advancedSettings });

  // ============================================================================
  // Configure Webhooks for Cache Revalidation
  // ============================================================================
  const frontendUrl = getEnv("FRONTEND_URL", "https://www.joinruach.org");
  const revalidateSecret = getEnv("STRAPI_REVALIDATE_SECRET", "");

  if (!frontendUrl || !revalidateSecret) {
    strapi.log.warn(
      "⚠️  Skipping webhook configuration: FRONTEND_URL or STRAPI_REVALIDATE_SECRET not set"
    );
    return;
  }

  const webhookStore = strapi.store({ type: "core", name: "webhook" });
  const existingWebhooks = (await webhookStore.get({ key: "webhooks" })) || [];

  const revalidateWebhookUrl = `${trimTrailingSlash(frontendUrl)}/api/strapi-revalidate`;

  // Check if webhook already exists
  const webhookExists = existingWebhooks.some(
    (webhook) => webhook.url === revalidateWebhookUrl
  );

  if (webhookExists) {
    strapi.log.info("✅ Cache revalidation webhook already configured");
    return;
  }

  // Content types that should trigger revalidation
  const contentTypesToWatch = [
    "api::media-item.media-item",
    "api::course.course",
    "api::blog-post.blog-post",
    "api::event.event",
    "api::article.article",
    "api::series.series",
    "api::outreach-story.outreach-story",
  ];

  const newWebhook = {
    name: "Frontend Cache Revalidation",
    url: revalidateWebhookUrl,
    headers: {
      "Content-Type": "application/json",
      "x-ruach-signature": revalidateSecret,
    },
    events: [
      "entry.publish",
      "entry.unpublish",
      "entry.update",
      "entry.delete",
    ],
    enabled: true,
  };

  // Add webhook to store
  const updatedWebhooks = [...existingWebhooks, newWebhook];
  await webhookStore.set({ key: "webhooks", value: updatedWebhooks });

  strapi.log.info("✅ Cache revalidation webhook configured successfully");
  strapi.log.info(`   → URL: ${revalidateWebhookUrl}`);
  strapi.log.info(`   → Watching: ${contentTypesToWatch.length} content types`);

  // ============================================================================
  // Initialize Redis for Global State Management
  // ============================================================================
  try {
    const redisService = require('../src/services/redis');
    const redisClient = await redisService.initialize();

    // Make Redis available globally on strapi instance
    strapi.redis = redisClient;

    strapi.log.info('✅ Redis service initialized for state management');
  } catch (error) {
    strapi.log.error('⚠️ Failed to initialize Redis service', {
      error: error.message,
    });
    strapi.log.warn('Direct upload functionality will be unavailable');
  }
};
