type EnvFn = (key: string, defaultValue?: string) => string | undefined;

export default ({
  env,
}: {
  env: EnvFn;
}) => ({
  upload: {
    config: {
      provider: "aws-s3", // Use the S3-compatible provider
      providerOptions: {
        s3Options: {
          endpoint: env("R2_ENDPOINT"), // Cloudflare R2 API
          forcePathStyle: true, // Required for R2 compatibility
          region: "auto", // Cloudflare R2 doesn't require a specific region
          credentials: {
            accessKeyId: env("R2_ACCESS_KEY_ID"),
            secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
          },
          params: {
            Bucket: env("R2_BUCKET_NAME"),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  email: {
    config: {
      provider: "resend",
      providerOptions: {
        apiKey: env("RESEND_API_KEY"),
      },
      settings: {
        defaultFrom: "Ruach <no-reply@updates.joinruach.org>",
        defaultReplyTo: "support@updates.joinruach.org",
      },
    },
  },
});
