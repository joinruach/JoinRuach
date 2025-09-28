export default (plugin) => {
  return {
    async findOne(params) {
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', params.id, {
        populate: ['user_profile'], // Auto-populate the user's profile
      });

      return user;
    },
  };
};
