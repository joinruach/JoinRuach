type PolicyContext = {
  state?: {
    user?: { role?: { type?: string } };
    admin?: unknown;
  };
  unauthorized(message?: string): never;
};

const isCuratorOrAdmin = async (ctx: PolicyContext) => {
  if (ctx.state?.admin) {
    return true;
  }

  const roleType = ctx.state?.user?.role?.type;
  if (roleType === 'curator' || roleType === 'admin') {
    return true;
  }

  return ctx.unauthorized('Curator or admin access required');
};

export default isCuratorOrAdmin;
