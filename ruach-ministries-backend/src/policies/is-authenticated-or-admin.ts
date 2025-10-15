type PolicyContext = {
  state?: {
    user?: unknown;
    admin?: unknown;
  };
  unauthorized(message?: string): never;
};

const isAuthenticatedOrAdmin = async (ctx: PolicyContext) => {
  if (ctx.state?.user || ctx.state?.admin) {
    return true;
  }

  return ctx.unauthorized('Authentication required');
};

export default isAuthenticatedOrAdmin;
