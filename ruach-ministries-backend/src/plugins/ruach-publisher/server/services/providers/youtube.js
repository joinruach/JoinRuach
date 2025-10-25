/**
 * YouTube Provider
 *
 * Publishes videos to YouTube using the YouTube Data API v3
 * Requires OAuth2 authentication
 */

'use strict';

const BaseProvider = require('./base-provider');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class YouTubeProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'YouTube');

    this.validateCredentials([
      'YOUTUBE_CLIENT_ID',
      'YOUTUBE_CLIENT_SECRET',
      'YOUTUBE_REFRESH_TOKEN',
    ]);

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:1337/api/youtube/callback'
    );

    // Set credentials with refresh token
    this.oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  /**
   * Publish video to YouTube
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - YouTube video details
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Starting YouTube upload');

    try {
      // If the media item already has a YouTube URL (external video), create a post/announcement instead
      if (mediaItem.videoUrl && this.isYouTubeUrl(mediaItem.videoUrl)) {
        return await this.shareExistingVideo(mediaItem);
      }

      // For direct uploads, we would need the actual video file
      // For now, we'll create a community post with a link
      return await this.createCommunityPost(mediaItem);
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  /**
   * Check if URL is a YouTube URL
   */
  isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  /**
   * Share existing YouTube video (if already uploaded elsewhere)
   */
  async shareExistingVideo(mediaItem) {
    this.logPublish(mediaItem, 'Video already on YouTube, creating community post');

    const publicUrl = this.getPublicUrl(mediaItem.slug);
    const caption = this.formatCaption(
      mediaItem.shortDescription,
      mediaItem.hashtags,
      publicUrl
    );

    // Note: Community posts require YouTube Data API v3 with special permissions
    // For now, we'll return a success with instructions
    return {
      type: 'community_post',
      message: 'Video already on YouTube. Manual community post recommended.',
      videoUrl: mediaItem.videoUrl,
      caption,
      publicUrl,
    };
  }

  /**
   * Create a community post on YouTube channel
   *
   * Note: YouTube Community Posts API is limited and requires channel membership
   * This is a placeholder implementation
   */
  async createCommunityPost(mediaItem) {
    const publicUrl = this.getPublicUrl(mediaItem.slug);
    const caption = this.formatCaption(
      mediaItem.shortDescription,
      mediaItem.hashtags,
      publicUrl
    );

    this.logPublish(mediaItem, 'Creating YouTube community post', {
      caption: caption.substring(0, 100),
    });

    // Community posts are created differently
    // For now, return success with manual instructions
    return {
      type: 'community_post_required',
      message: 'Manual community post required on YouTube',
      caption,
      publicUrl,
      instructions: [
        '1. Go to YouTube Studio',
        '2. Click "Create" -> "Create post"',
        '3. Paste the caption and link',
        '4. Add thumbnail if desired',
        '5. Click "Post"',
      ],
    };
  }

  /**
   * Upload video file to YouTube
   * (For future implementation when video files are available)
   */
  async uploadVideo(mediaItem, videoFilePath) {
    this.logPublish(mediaItem, 'Uploading video file to YouTube');

    const publicUrl = this.getPublicUrl(mediaItem.slug);
    const description = this.formatCaption(
      mediaItem.description || mediaItem.shortDescription,
      mediaItem.hashtags,
      publicUrl
    );

    const res = await this.youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: mediaItem.title,
          description,
          tags: this.parseHashtags(mediaItem.hashtags),
          categoryId: '22', // People & Blogs
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en',
        },
        status: {
          privacyStatus: process.env.YOUTUBE_DEFAULT_PRIVACY || 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    this.logPublish(mediaItem, 'Video uploaded successfully', {
      videoId: res.data.id,
      videoUrl: `https://youtube.com/watch?v=${res.data.id}`,
    });

    return {
      type: 'video_upload',
      videoId: res.data.id,
      videoUrl: `https://youtube.com/watch?v=${res.data.id}`,
      title: res.data.snippet.title,
      publishedAt: res.data.snippet.publishedAt,
    };
  }

  /**
   * Parse hashtags into array
   */
  parseHashtags(hashtags) {
    if (!hashtags) return [];

    return hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.replace('#', '').trim())
      .filter(Boolean);
  }

  /**
   * Get YouTube channel info
   */
  async getChannelInfo() {
    const res = await this.youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!res.data.items || res.data.items.length === 0) {
      throw new Error('No YouTube channel found for authenticated user');
    }

    const channel = res.data.items[0];

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscribers: channel.statistics.subscriberCount,
      videos: channel.statistics.videoCount,
      views: channel.statistics.viewCount,
    };
  }
}

module.exports = YouTubeProvider;
