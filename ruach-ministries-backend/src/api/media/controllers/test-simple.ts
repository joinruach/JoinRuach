export default {
  async test(ctx: any) {
    ctx.body = {
      message: "Test endpoint working",
      timestamp: new Date().toISOString(),
      deploymentVersion: "af4cd7d"
    };
  },
};
