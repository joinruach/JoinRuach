'use strict';

/**
 * Hotfix: Manually Confirm support@ruachstudio.com
 *
 * Purpose: Ensure the support account exists and is confirmed
 * This migration follows Strapi v5 Umzug format
 */

module.exports = {
  /**
   * Run the migration — ensures the support@ruachstudio.com user exists and is confirmed.
   */
  async up(knex) {
    const targetEmail = 'support@ruachstudio.com';

    // Check if user exists
    const [existing] = await knex('up_users')
      .where({ email: targetEmail })
      .limit(1);

    if (!existing) {
      // Create the user if it doesn't exist
      await knex('up_users').insert({
        username: 'support',
        email: targetEmail,
        confirmed: true,
        blocked: false,
        confirmation_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`✅ Created and confirmed user: ${targetEmail}`);
    } else {
      // Update existing user to ensure it's confirmed
      await knex('up_users')
        .where({ email: targetEmail })
        .update({
          confirmed: true,
          confirmation_token: null,
          updated_at: new Date(),
        });
      console.log(`✅ Updated and confirmed existing user: ${targetEmail}`);
    }
  },

  /**
   * Revert the migration — removes the support account.
   * Note: Only use in development; avoid running this in production.
   */
  async down(knex) {
    const targetEmail = 'support@ruachstudio.com';

    await knex('up_users')
      .where({ email: targetEmail })
      .del();

    console.log(`🔄 Removed user: ${targetEmail}`);
  },
};
