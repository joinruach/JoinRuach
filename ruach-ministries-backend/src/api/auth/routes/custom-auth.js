module.exports = {
  routes: [
    {
      method: "POST",
      path: "/auth/login",
      handler: "custom-auth.login",
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/auth/refresh-token",
      handler: "custom-auth.refreshToken",
      config: {
        policies: [],
        auth: false, // No auth required since it's using the refresh token
      },
    },
  ],
};

