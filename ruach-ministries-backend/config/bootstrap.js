import dotenv from "dotenv";

const DEFAULT_FROM_EMAIL = "no-reply@updates.joinruach.org";
const DEFAULT_FROM_NAME = "Ruach";
const DEFAULT_REPLY_TO = "support@updates.joinruach.org";
const DEFAULT_CONFIRM_REDIRECT = "https://joinruach.org/confirmed";

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length ? value.trim() : fallback;
};

export default async ({ strapi } = {}) => {
  dotenv.config();

  if (!strapi || typeof strapi.store !== "function") {
    return;
  }

  const pluginStore = strapi.store({ type: "plugin", name: "users-permissions" });

  const emailTemplates = (await pluginStore.get({ key: "email" })) ?? {};
  const confirmationTemplate = emailTemplates.email_confirmation ?? { options: {} };

  const defaultFromEmail = getEnv("EMAIL_DEFAULT_FROM", DEFAULT_FROM_EMAIL);
  const defaultFromName = getEnv("EMAIL_DEFAULT_FROM_NAME", DEFAULT_FROM_NAME);
  const defaultReplyTo = getEnv("EMAIL_DEFAULT_REPLY_TO", DEFAULT_REPLY_TO);
  const confirmationRedirect = getEnv(
    "STRAPI_EMAIL_CONFIRM_REDIRECT",
    getEnv("FRONTEND_URL", DEFAULT_CONFIRM_REDIRECT.replace(/\/confirmed$/, "")) + "/confirmed"
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
        `<p><a href="${confirmationRedirect}?confirmation=<%= CODE %>">Confirm my email address</a></p>`,
        "<p>If the button does not work, copy and paste this link into your browser:</p>",
        `<p>${confirmationRedirect}?confirmation=<%= CODE %></p>`,
        "<p>Thanks.</p>",
      ].join("\n\n"),
    },
  };

  await pluginStore.set({ key: "email", value: emailTemplates });

  const advancedSettings = (await pluginStore.get({ key: "advanced" })) ?? {};
  advancedSettings.email_confirmation = true;
  advancedSettings.email_confirmation_redirection = confirmationRedirect;

  await pluginStore.set({ key: "advanced", value: advancedSettings });
};
