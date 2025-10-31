const dotenv = require("dotenv");

const DEFAULT_FROM_EMAIL = "no-reply@updates.joinruach.org";
const DEFAULT_FROM_NAME = "Ruach";
const DEFAULT_REPLY_TO = "support@updates.joinruach.org";
const DEFAULT_CONFIRM_REDIRECT = "https://joinruach.org/confirmed";
const DEFAULT_CONFIRM_LINK_BASE = "http://localhost:1337/api/auth/email-confirmation";
const DEFAULT_RESET_REDIRECT = "https://joinruach.org/reset-password";

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

const ensureConfirmationLinkPath = (base) => {
  const normalized = trimTrailingSlash(base || "");

  if (!normalized) {
    return DEFAULT_CONFIRM_LINK_BASE;
  }

  return normalized.includes("/api/auth/email-confirmation")
    ? normalized
    : `${normalized}/api/auth/email-confirmation`;
};

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
  const frontendBase = trimTrailingSlash(
    getEnv(
      "FRONTEND_URL",
      DEFAULT_CONFIRM_REDIRECT.replace(/\/confirmed$/, "") || "http://localhost:3000"
    )
  );
  const fallbackRedirectBase = trimTrailingSlash(
    `${frontendBase || "http://localhost:3000"}/confirmed`
  );
  const rawRedirectInput = trimTrailingSlash(
    getEnv("STRAPI_EMAIL_CONFIRM_REDIRECT", fallbackRedirectBase)
  );
  const confirmationRedirectBase = rawRedirectInput?.includes("/api/auth/email-confirmation")
    ? fallbackRedirectBase
    : rawRedirectInput || fallbackRedirectBase;
  const confirmationRedirect =
    confirmationRedirectBase.includes("?") || confirmationRedirectBase.endsWith("&")
      ? confirmationRedirectBase
      : appendQueryParam(confirmationRedirectBase, "status", "success");
  const confirmationLinkBase = trimTrailingSlash(
    ensureConfirmationLinkPath(
      getEnv("STRAPI_EMAIL_CONFIRM_LINK", getEnv("STRAPI_BACKEND_URL", DEFAULT_CONFIRM_LINK_BASE))
    )
  );
  const confirmationLinkUrl = appendQueryParam(
    confirmationLinkBase || DEFAULT_CONFIRM_LINK_BASE,
    "confirmation",
    "<%= CODE %>"
  );
  const resetRedirect = getEnv(
    "STRAPI_RESET_PASSWORD_REDIRECT",
    getEnv("FRONTEND_URL", DEFAULT_RESET_REDIRECT.replace(/\/reset-password$/, "")) + "/reset-password"
  ).replace(/\/$/, "");

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
};
