import type { Policy } from '@strapi/strapi';

const isAuthenticatedOrAdmin: Policy = async (ctx) => {
  if (ctx.state?.user || ctx.state?.admin) {
    return true;
  }

  return ctx.unauthorized('Authentication required');
};

export default isAuthenticatedOrAdmin;
