/**
 * Library Transcription Lifecycles
 * Hooks for transcription content type
 */

export default {
  /**
   * Lifecycle hook before creating a transcription
   */
  async beforeCreate(event: any) {
    const { data } = event;

    // Ensure status defaults to pending if not set
    if (!data.status) {
      data.status = 'pending';
    }

    // Ensure language defaults to en if not set
    if (!data.language) {
      data.language = 'en';
    }

    // Ensure confidence defaults to 0.95 if not set
    if (!data.confidence) {
      data.confidence = 0.95;
    }

    // Ensure keyMoments is an array if not set
    if (!data.keyMoments) {
      data.keyMoments = [];
    }
  },

  /**
   * Lifecycle hook after creating a transcription
   */
  async afterCreate(event: any) {
    const { result } = event;
    // Could add logging or trigger other actions here
  },

  /**
   * Lifecycle hook before updating a transcription
   */
  async beforeUpdate(event: any) {
    const { data } = event;

    // Validate that status is a valid enum value
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }
  },

  /**
   * Lifecycle hook after updating a transcription
   */
  async afterUpdate(event: any) {
    const { result } = event;
    // Could add logging or trigger other actions here
  },

  /**
   * Lifecycle hook before deleting a transcription
   */
  async beforeDelete(event: any) {
    // Could add cleanup logic here
  },

  /**
   * Lifecycle hook after deleting a transcription
   */
  async afterDelete(event: any) {
    // Could add cleanup logic here
  },
};
