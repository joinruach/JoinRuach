import dotenv from "dotenv";

export default ({ strapi }) => {
  dotenv.config();
  console.log("✅ Environment variables loaded");

  strapi.server.use((ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*"); // ✅ Allow all domains (for testing, restrict in production)
    ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    console.log("✅ CORS middleware applied");
    return next();
  });
};