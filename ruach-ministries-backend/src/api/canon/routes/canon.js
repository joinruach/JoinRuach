module.exports = {
  routes: [
    {
      method: "POST",
      path: "/canon/resolve",
      handler: "canon.resolve",
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};

