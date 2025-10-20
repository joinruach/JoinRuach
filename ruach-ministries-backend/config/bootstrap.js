import dotenv from "dotenv";

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return value && value.trim().length ? value : fallback;
};

export default async ({ strapi }) => {
  dotenv.config();

  const pluginStore = strapi.store({ type: "plugin", name: "users-permissions" });

  const emailTemplates = (await pluginStore.get({ key: "email" })) ?? {};
  const confirmationTemplate = emailTemplates.email_confirmation ?? { options: {} };

  const defaultFromEmail = getEnv("EMAIL_DEFAULT_FROM", "no-reply@updates.joinruach.org");
  const defaultFromName = getEnv("EMAIL_DEFAULT_FROM_NAME", "Ruach");
  const defaultReplyTo = getEnv("EMAIL_DEFAULT_REPLY_TO", "support@updates.joinruach.org");
  const confirmationRedirect = getEnv(
    "STRAPI_EMAIL_CONFIRM_REDIRECT",
    getEnv("FRONTEND_URL", "https://joinruach.org") + "/confirmed"
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
      message:
        `<p>Thank you for registering!</p>\n\n` +
        `<p>You have to confirm your email address. Please click on the button below.</p>\n\n` +
        `<p><a href="${confirmationRedirect}?confirmation=<%= CODE %>">Confirm my email address</a></p>\n\n` +
        `<p>If the button does not work, copy and paste this link into your browser:</p>\n` +
        `<p>${confirmationRedirect}?confirmation=<%= CODE %></p>\n\n` +
        `<p>Thanks.</p>`,
    },
  };

  await pluginStore.set({ key: "email", value: emailTemplates });

  const advancedSettings = (await pluginStore.get({ key: "advanced" })) ?? {};
  advancedSettings.email_confirmation = true;
  advancedSettings.email_confirmation_redirection = confirmationRedirect;

  await pluginStore.set({ key: "advanced", value: advancedSettings });
};
