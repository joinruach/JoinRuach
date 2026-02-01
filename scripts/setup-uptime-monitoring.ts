#!/usr/bin/env tsx
/**
 * UptimeRobot Monitoring Configuration Setup Script
 *
 * This script documents and sets up UptimeRobot monitors for the Ruach platform.
 * It manages health check endpoints, alert configurations, and contact settings.
 *
 * UptimeRobot monitors are created via the web dashboard, but this script:
 * - Documents all monitors that should exist
 * - Validates configured endpoints
 * - Tests health check endpoints
 * - Provides configuration for API-based setup
 *
 * Usage:
 *   npx tsx scripts/setup-uptime-monitoring.ts [--validate] [--test-endpoints]
 *
 * Environment variables:
 *   UPTIME_ROBOT_API_KEY - Your UptimeRobot API key
 *   PRODUCTION_API_URL - Production API base URL
 *   PRODUCTION_FRONTEND_URL - Production frontend base URL
 */

interface Monitor {
  name: string;
  type: 'HTTP' | 'HTTPS' | 'PING' | 'TCP';
  url: string;
  interval: number; // minutes
  timeout: number; // seconds
  expectedStatusCode?: number;
  customUserAgent?: string;
  alertContacts: string[]; // contact IDs
  tags?: string[];
  notes?: string;
}

interface AlertContact {
  type: 'email' | 'slack' | 'webhook';
  value: string;
  friendlyName: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  responseTime: number;
  checks: Record<string, boolean>;
}

class UptimeMonitoringConfig {
  private apiKey: string;
  private apiUrl = 'https://api.uptimerobot.com/v2';
  private baseProductionUrl: string;
  private baseFrontendUrl: string;

  constructor() {
    this.apiKey = process.env.UPTIME_ROBOT_API_KEY || '';
    this.baseProductionUrl = process.env.PRODUCTION_API_URL || 'https://api.ruach.app';
    this.baseFrontendUrl = process.env.PRODUCTION_FRONTEND_URL || 'https://ruach.app';
  }

  /**
   * Monitor definitions for the Ruach platform
   * These should be manually created in UptimeRobot dashboard
   */
  private getMonitors(): Monitor[] {
    return [
      // Primary API endpoint
      {
        name: 'Ruach API - Health Check',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/health`,
        interval: 5, // Every 5 minutes
        timeout: 10,
        expectedStatusCode: 200,
        customUserAgent: 'UptimeRobot/2.0',
        alertContacts: ['slack-alerts', 'email-critical'],
        tags: ['api', 'critical', 'production'],
        notes: 'Primary health check for API service',
      },

      // AI Generation endpoint
      {
        name: 'AI Generation API - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/generation/health`,
        interval: 5,
        timeout: 15,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts', 'email-critical'],
        tags: ['ai', 'generation', 'critical', 'production'],
        notes: 'AI generation service health check',
      },

      // Database endpoint
      {
        name: 'Database Connection - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/health/db`,
        interval: 10,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts', 'email-critical'],
        tags: ['database', 'critical', 'infrastructure'],
        notes: 'Database connectivity check',
      },

      // Redis cache
      {
        name: 'Cache (Redis) - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/health/cache`,
        interval: 10,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts'],
        tags: ['cache', 'infrastructure'],
        notes: 'Redis cache health check',
      },

      // Frontend application
      {
        name: 'Frontend Application',
        type: 'HTTPS',
        url: this.baseFrontendUrl,
        interval: 10,
        timeout: 15,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts'],
        tags: ['frontend', 'production', 'user-facing'],
        notes: 'Main frontend availability check',
      },

      // API Gateway
      {
        name: 'API Gateway - Status',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/status`,
        interval: 5,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts', 'email-critical'],
        tags: ['gateway', 'critical', 'infrastructure'],
        notes: 'API gateway status and routing health',
      },

      // Authentication service
      {
        name: 'Authentication Service - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/auth/health`,
        interval: 5,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts', 'email-critical'],
        tags: ['auth', 'critical', 'security'],
        notes: 'Authentication/authorization service health',
      },

      // WebSocket connection (if applicable)
      {
        name: 'WebSocket Connection - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/websocket/health`,
        interval: 10,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts'],
        tags: ['websocket', 'realtime'],
        notes: 'WebSocket service availability',
      },

      // File upload service
      {
        name: 'File Upload Service - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/upload/health`,
        interval: 10,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts'],
        tags: ['upload', 'storage'],
        notes: 'File upload service health check',
      },

      // Search service
      {
        name: 'Search Service - Health',
        type: 'HTTPS',
        url: `${this.baseProductionUrl}/api/search/health`,
        interval: 15,
        timeout: 10,
        expectedStatusCode: 200,
        alertContacts: ['slack-alerts'],
        tags: ['search', 'elasticsearch'],
        notes: 'Search service (Elasticsearch) health',
      },
    ];
  }

  /**
   * Alert contact configurations
   * These should be set up in UptimeRobot dashboard
   */
  private getAlertContacts(): AlertContact[] {
    return [
      {
        type: 'email',
        value: process.env.ALERT_EMAIL || 'alerts@ruach.app',
        friendlyName: 'email-critical',
      },
      {
        type: 'slack',
        value: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        friendlyName: 'slack-alerts',
      },
      {
        type: 'webhook',
        value: `${this.baseProductionUrl}/webhooks/uptime-robot-alerts`,
        friendlyName: 'webhook-alerts',
      },
    ];
  }

  /**
   * Test all configured health check endpoints
   */
  async validateEndpoints(): Promise<void> {
    console.log('Validating health check endpoints...\n');

    const monitors = this.getMonitors();
    let passed = 0;
    let failed = 0;

    for (const monitor of monitors) {
      try {
        const response = await fetch(monitor.url, {
          method: 'GET',
          headers: {
            'User-Agent': monitor.customUserAgent || 'UptimeRobot/2.0',
          },
          timeout: monitor.timeout * 1000,
        });

        const statusOk =
          monitor.expectedStatusCode === undefined ||
          response.status === monitor.expectedStatusCode;

        if (statusOk) {
          console.log(`✓ ${monitor.name} (${response.status})`);
          passed++;
        } else {
          console.log(
            `✗ ${monitor.name} (expected ${monitor.expectedStatusCode}, got ${response.status})`
          );
          failed++;
        }
      } catch (error) {
        console.log(`✗ ${monitor.name} (unreachable)`);
        console.log(`  Error: ${error}`);
        failed++;
      }
    }

    console.log(`\nValidation complete: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  }

  /**
   * Print monitor configuration for manual setup in UptimeRobot
   */
  printConfiguration(): void {
    console.log('UptimeRobot Monitor Configuration\n');
    console.log('=' .repeat(80));

    const monitors = this.getMonitors();
    const contacts = this.getAlertContacts();

    console.log('\nALERT CONTACTS (Setup First):\n');
    for (const contact of contacts) {
      console.log(`Name: ${contact.friendlyName}`);
      console.log(`Type: ${contact.type}`);
      console.log(`Value: ${contact.value}`);
      console.log('---');
    }

    console.log('\n\nMONITORS TO CREATE:\n');
    for (const monitor of monitors) {
      console.log(`Monitor: ${monitor.name}`);
      console.log(`  Type: ${monitor.type}`);
      console.log(`  URL: ${monitor.url}`);
      console.log(`  Interval: Every ${monitor.interval} minutes`);
      console.log(`  Timeout: ${monitor.timeout} seconds`);
      if (monitor.expectedStatusCode) {
        console.log(`  Expected Status: ${monitor.expectedStatusCode}`);
      }
      console.log(`  Alert Contacts: ${monitor.alertContacts.join(', ')}`);
      console.log(`  Tags: ${monitor.tags?.join(', ') || 'none'}`);
      console.log(`  Notes: ${monitor.notes || 'none'}`);
      console.log('');
    }
  }

  /**
   * Generate configuration for API-based setup (if using UptimeRobot API)
   */
  async setupViaAPI(): Promise<void> {
    if (!this.apiKey) {
      console.log(
        'UPTIME_ROBOT_API_KEY not set. Skipping API setup.'
      );
      return;
    }

    console.log('Setting up monitors via UptimeRobot API...\n');

    const monitors = this.getMonitors();
    let created = 0;
    let failed = 0;

    for (const monitor of monitors) {
      try {
        const response = await fetch(`${this.apiUrl}/monitors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: this.apiKey,
            friendly_name: monitor.name,
            url: monitor.url,
            type: this.mapMonitorType(monitor.type),
            sub_type: 'HTTP',
            keyword_type: 2,
            keyword_value: monitor.expectedStatusCode?.toString() || '200',
            http_method: 1, // GET
            interval: monitor.interval * 60, // Convert to seconds
            timeout: monitor.timeout,
            custom_user_agent: monitor.customUserAgent,
            status: 1, // Active
          }),
        });

        if (response.ok) {
          console.log(`✓ Created monitor: ${monitor.name}`);
          created++;
        } else {
          console.log(`✗ Failed to create: ${monitor.name}`);
          console.log(`  Status: ${response.status}`);
          failed++;
        }
      } catch (error) {
        console.log(`✗ Error creating monitor: ${monitor.name}`);
        console.log(`  ${error}`);
        failed++;
      }
    }

    console.log(`\nAPI Setup complete: ${created} created, ${failed} failed`);
  }

  private mapMonitorType(type: string): number {
    const typeMap: Record<string, number> = {
      'HTTP': 1,
      'HTTPS': 2,
      'PING': 3,
      'TCP': 4,
    };
    return typeMap[type] || 2;
  }

  /**
   * Main setup routine
   */
  async setup(options: { validate?: boolean; setupAPI?: boolean }): Promise<void> {
    console.log('UptimeRobot Monitoring Configuration\n');

    // Always print configuration
    this.printConfiguration();

    // Optionally validate endpoints
    if (options.validate) {
      console.log('\n' + '='.repeat(80) + '\n');
      await this.validateEndpoints();
    }

    // Optionally setup via API
    if (options.setupAPI) {
      console.log('\n' + '='.repeat(80) + '\n');
      await this.setupViaAPI();
    }

    console.log('\n✓ Configuration complete!');
    console.log('\nNext steps:');
    console.log('1. Log in to UptimeRobot dashboard');
    console.log('2. Create alert contacts using the configuration above');
    console.log('3. Create monitors for each health check endpoint');
    console.log('4. Set up status page dashboard');
    console.log('5. Configure incident response procedures');
  }
}

// Parse command line arguments
const validateEndpoints = process.argv.includes('--validate');
const setupAPI = process.argv.includes('--setup-api');

// Main execution
const config = new UptimeMonitoringConfig();

config.setup({ validate: validateEndpoints, setupAPI }).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
