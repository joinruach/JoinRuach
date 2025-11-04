"use strict";

/**
 * Redis Client Service
 *
 * Provides Redis connection with graceful fallback to in-memory storage.
 * Supports both Redis protocol and Upstash REST API.
 */

const { createClient } = require("redis");

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connecting = false;
    this.useUpstash = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.connected || this.connecting) {
      return this.connected;
    }

    this.connecting = true;

    const redisUrl = process.env.REDIS_URL;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Try Upstash REST API first (serverless-friendly)
    if (upstashUrl && upstashToken) {
      strapi.log.info("[Redis] Using Upstash REST API");
      this.useUpstash = true;
      this.connected = true;
      this.connecting = false;
      return true;
    }

    // Try standard Redis connection
    if (redisUrl) {
      try {
        strapi.log.info("[Redis] Connecting to Redis...");

        this.client = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                strapi.log.error("[Redis] Max reconnection attempts reached");
                return new Error("Max reconnection attempts");
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        this.client.on("error", (err) => {
          strapi.log.error("[Redis] Connection error:", err);
          this.connected = false;
        });

        this.client.on("connect", () => {
          strapi.log.info("[Redis] Connected successfully");
          this.connected = true;
        });

        this.client.on("reconnecting", () => {
          strapi.log.warn("[Redis] Reconnecting...");
        });

        await this.client.connect();
        this.connecting = false;
        return true;
      } catch (error) {
        strapi.log.error("[Redis] Failed to connect:", error.message);
        this.client = null;
        this.connected = false;
        this.connecting = false;
        return false;
      }
    }

    // No Redis configured
    strapi.log.warn(
      "[Redis] No Redis configuration found. Using in-memory storage. " +
        "Set REDIS_URL or UPSTASH_REDIS_REST_URL for production."
    );
    this.connecting = false;
    return false;
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.connected;
  }

  /**
   * Get a value from Redis
   */
  async get(key) {
    if (!this.connected) {
      return null;
    }

    try {
      if (this.useUpstash) {
        return await this._upstashGet(key);
      }
      return await this.client.get(key);
    } catch (error) {
      strapi.log.error(`[Redis] Error getting key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional expiry
   */
  async set(key, value, expirySeconds = null) {
    if (!this.connected) {
      return false;
    }

    try {
      if (this.useUpstash) {
        return await this._upstashSet(key, value, expirySeconds);
      }

      if (expirySeconds) {
        await this.client.setEx(key, expirySeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      strapi.log.error(`[Redis] Error setting key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key) {
    if (!this.connected) {
      return false;
    }

    try {
      if (this.useUpstash) {
        return await this._upstashDel(key);
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      strapi.log.error(`[Redis] Error deleting key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key) {
    if (!this.connected) {
      return false;
    }

    try {
      if (this.useUpstash) {
        const value = await this._upstashGet(key);
        return value !== null;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      strapi.log.error(`[Redis] Error checking key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Increment a value
   */
  async incr(key) {
    if (!this.connected) {
      return 0;
    }

    try {
      if (this.useUpstash) {
        return await this._upstashIncr(key);
      }
      return await this.client.incr(key);
    } catch (error) {
      strapi.log.error(`[Redis] Error incrementing key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Set expiry on a key
   */
  async expire(key, seconds) {
    if (!this.connected) {
      return false;
    }

    try {
      if (this.useUpstash) {
        return await this._upstashExpire(key, seconds);
      }
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      strapi.log.error(`[Redis] Error setting expiry on ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern) {
    if (!this.connected) {
      return [];
    }

    try {
      if (this.useUpstash) {
        return await this._upstashKeys(pattern);
      }
      return await this.client.keys(pattern);
    } catch (error) {
      strapi.log.error(`[Redis] Error getting keys ${pattern}:`, error.message);
      return [];
    }
  }

  /**
   * Upstash REST API: GET
   */
  async _upstashGet(key) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash GET failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * Upstash REST API: SET
   */
  async _upstashSet(key, value, expirySeconds) {
    const commands = [[
      "SET",
      key,
      value,
      ...(expirySeconds ? ["EX", expirySeconds] : [])
    ]];

    const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error(`Upstash SET failed: ${response.status}`);
    }

    return true;
  }

  /**
   * Upstash REST API: DEL
   */
  async _upstashDel(key) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash DEL failed: ${response.status}`);
    }

    return true;
  }

  /**
   * Upstash REST API: INCR
   */
  async _upstashIncr(key) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash INCR failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * Upstash REST API: EXPIRE
   */
  async _upstashExpire(key, seconds) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(key)}/${seconds}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash EXPIRE failed: ${response.status}`);
    }

    return true;
  }

  /**
   * Upstash REST API: KEYS
   */
  async _upstashKeys(pattern) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/keys/${encodeURIComponent(pattern)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash KEYS failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.connected) {
      try {
        await this.client.quit();
        strapi.log.info("[Redis] Disconnected");
      } catch (error) {
        strapi.log.error("[Redis] Error disconnecting:", error.message);
      }
    }
    this.client = null;
    this.connected = false;
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = {
  redisClient,
  RedisClient,
};
