type PolicyContext = {
  state?: {
    user?: { role?: { type?: string } };
    admin?: unknown;
  };
  unauthorized(message?: string): never;
};

const requireStudioOperator = async (ctx: PolicyContext) => {
  if (ctx.state?.admin) {
    return true;
  }

  const roleType = ctx.state?.user?.role?.type;
  if (roleType === 'curator' || roleType === 'admin' || roleType === 'operator') {
    return true;
  }

  return ctx.unauthorized('Studio operator access required');
};

export default requireStudioOperator;
