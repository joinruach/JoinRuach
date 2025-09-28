const customAuthRoutes = require("./custom-auth");

module.exports = {
  routes: [...customAuthRoutes.routes],
};
