"use strict";

const { Resend } = require("resend");

module.exports = {
  provider: "resend",
  name: "Resend",

  init(providerOptions = {}, settings = {}) {
    const apiKey = providerOptions.apiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Resend provider: RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(apiKey);

    return {
      /**
       * Send an email via Resend.
       * Ensures we throw when Resend returns an error object so Strapi can surface it.
       */
      async send(options = {}) {
        const {
          from,
          to,
          cc,
          bcc,
          replyTo,
          subject,
          text,
          html,
          ...rest
        } = options;

        const payload = {
          from: from || settings.defaultFrom,
          to,
          cc,
          bcc,
          reply_to: replyTo || settings.defaultReplyTo,
          subject,
          text,
          html,
          ...rest,
        };

        if (!payload.from || !payload.to) {
          throw new Error("Resend provider: 'from' and 'to' fields are required.");
        }

        // Resend's API expects a string or array for `to`.
        if (Array.isArray(payload.to) && payload.to.length === 0) {
          throw new Error("Resend provider: 'to' field must not be empty.");
        }

        // Convert reply_to back to replyTo if necessary (Resend supports both forms).
        if (payload.reply_to && !payload.replyTo) {
          payload.replyTo = payload.reply_to;
          delete payload.reply_to;
        }

        const response = await resend.emails.send(payload);
        if (response?.error) {
          const message = response.error.message || "Resend email send failed.";
          throw new Error(message);
        }

        return response;
      },
    };
  },
};
