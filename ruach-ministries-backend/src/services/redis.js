/**
 * Redis Service
 *
 * Provides a shared Redis connection for caching and state management
 */

'use strict';

const Redis = require('ioredis');
const logger = require('../config/logger');

let redisClient = null;

module.exports = {
  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (redisClient) {
      return redisClient;
    }

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    // Add TLS if enabled
    if (process.env.REDIS_TLS === 'true') {
      redisConfig.tls = {};
    }

    try {
      redisClient = new Redis(redisConfig);

      redisClient.on('connect', () => {
        logger.info('Redis connected', {
          category: 'redis',
          host: redisConfig.host,
          port: redisConfig.port,
        });
      });

      redisClient.on('error', (error) => {
        logger.error('Redis connection error', {
          category: 'redis',
          error: error.message,
        });
      });

      redisClient.on('close', () => {
        logger.warn('Redis connection closed', {
          category: 'redis',
        });
      });

      // Wait for connection
      await redisClient.ping();

      logger.logApp('Redis service initialized successfully');

      return redisClient;
    } catch (error) {
      logger.error('Failed to initialize Redis', {
        category: 'redis',
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Get Redis client instance
   */
  getClient() {
    if (!redisClient) {
      throw new Error('Redis not initialized. Call initialize() first.');
    }
    return redisClient;
  },

  /**
   * Close Redis connection
   */
  async close() {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed', { category: 'redis' });
    }
  },
};
