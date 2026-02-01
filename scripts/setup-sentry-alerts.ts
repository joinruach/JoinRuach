#!/usr/bin/env tsx
/**
 * Sentry Alert Configuration Setup Script
 *
 * This script configures alert rules in Sentry for production monitoring.
 * It sets up alerts for:
 * - High error rates (>5%)
 * - Slow transactions (>30 seconds)
 * - Generation failures
 * - Notification channels (Slack/Email)
 *
 * Usage:
 *   npx tsx scripts/setup-sentry-alerts.ts [--dry-run]
 *
 * Environment variables required:
 *   SENTRY_AUTH_TOKEN - Sentry API authentication token
 *   SENTRY_ORG - Sentry organization slug
 *   SENTRY_PROJECT - Sentry project slug
 *   SLACK_WEBHOOK_URL - Slack webhook URL for alerts
 *   ALERT_EMAIL - Email address for critical alerts
 */

import https from 'https';

interface AlertRule {
  name: string;
  conditions: Array<{
    id: string;
    value?: string | number;
    match?: string;
  }>;
  actions: Array<{
    service: string;
    channel?: string;
    url?: string;
  }>;
  actionMatch: 'all' | 'any';
  environment?: string;
  frequency?: number;
}

interface SentryIntegration {
  type: string;
  name: string;
  url?: string;
}

class SentryAlertsConfig {
  private authToken: string;
  private org: string;
  private project: string;
  private slackWebhook: string;
  private alertEmail: string;
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.authToken = process.env.SENTRY_AUTH_TOKEN || '';
    this.org = process.env.SENTRY_ORG || '';
    this.project = process.env.SENTRY_PROJECT || '';
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL || '';
    this.alertEmail = process.env.ALERT_EMAIL || '';
    this.dryRun = dryRun;

    this.validateEnv();
  }

  private validateEnv() {
    const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
      console.error('Please set:');
      console.error('  SENTRY_AUTH_TOKEN - Your Sentry API token');
      console.error('  SENTRY_ORG - Your organization slug');
      console.error('  SENTRY_PROJECT - Your project slug');
      console.error('  SLACK_WEBHOOK_URL (optional) - For Slack notifications');
      console.error('  ALERT_EMAIL (optional) - For email notifications');
      process.exit(1);
    }
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'sentry.io',
        port: 443,
        path,
        method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Ruach-Monitoring-Setup/1.0',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              resolve(data as any);
            }
          } else {
            reject(
              new Error(
                `Sentry API error: ${res.statusCode} ${data}`
              )
            );
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  private async setupSlackIntegration(): Promise<string | null> {
    if (!this.slackWebhook) {
      console.log('Skipping Slack integration setup (SLACK_WEBHOOK_URL not set)');
      return null;
    }

    console.log('Setting up Slack integration...');

    try {
      const integrations = await this.makeRequest<SentryIntegration[]>(
        'GET',
        `/api/0/projects/${this.org}/${this.project}/integrations/`
      );

      const slackIntegration = integrations.find(i => i.type === 'slack');

      if (slackIntegration) {
        console.log('Slack integration already exists');
        return slackIntegration.name;
      }

      if (this.dryRun) {
        console.log('[DRY RUN] Would create Slack integration');
        return 'slack-integration';
      }

      const created = await this.makeRequest<{ id: string }>(
        'POST',
        `/api/0/organizations/${this.org}/integrations/`,
        {
          provider: 'slack',
          external_id: 'slack',
        }
      );

      console.log('Slack integration created:', created.id);
      return created.id;
    } catch (error) {
      console.warn('Could not set up Slack integration:', error);
      return null;
    }
  }

  private async createAlertRule(rule: AlertRule): Promise<void> {
    console.log(`Creating alert rule: ${rule.name}`);

    if (this.dryRun) {
      console.log('[DRY RUN] Would create rule with config:');
      console.log(JSON.stringify(rule, null, 2));
      return;
    }

    try {
      await this.makeRequest(
        'POST',
        `/api/0/projects/${this.org}/${this.project}/alert-rules/`,
        rule
      );
      console.log(`✓ Alert rule created: ${rule.name}`);
    } catch (error) {
      console.error(`✗ Failed to create alert rule: ${rule.name}`, error);
      throw error;
    }
  }

  private getSlackAction(channel: string): { service: string; url: string } {
    return {
      service: 'slack',
      url: this.slackWebhook,
    };
  }

  private getEmailAction(): { service: string; channel: string } {
    return {
      service: 'mail',
      channel: this.alertEmail,
    };
  }

  async setup(): Promise<void> {
    console.log('Starting Sentry alert configuration...\n');

    if (this.dryRun) {
      console.log('[DRY RUN MODE] - No changes will be made\n');
    }

    // Setup Slack integration first
    const slackIntegrationId = await this.setupSlackIntegration();

    // Define alert rules
    const alertRules: AlertRule[] = [
      {
        name: 'High Error Rate (>5%)',
        conditions: [
          {
            id: 'sentry.rules.conditions.event_frequency.EventFrequencyPercentageCondition',
            value: 5,
            match: 'gt',
          },
        ],
        actions: this.buildActions('critical'),
        actionMatch: 'any',
        frequency: 5, // minutes
      },
      {
        name: 'Slow Transactions (>30s)',
        conditions: [
          {
            id: 'sentry.rules.conditions.performance.SlowTransactionCondition',
            value: 30000, // milliseconds
          },
        ],
        actions: this.buildActions('warning'),
        actionMatch: 'any',
        frequency: 30,
      },
      {
        name: 'Generation Failures',
        conditions: [
          {
            id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
            value: 10,
            match: 'gt',
          },
        ],
        actions: this.buildActions('critical'),
        actionMatch: 'any',
        frequency: 5,
        environment: 'production',
      },
      {
        name: 'Critical Errors in Production',
        conditions: [
          {
            id: 'sentry.rules.conditions.level.LevelCondition',
            value: 'error',
          },
        ],
        actions: this.buildActions('critical'),
        actionMatch: 'any',
        frequency: 1,
        environment: 'production',
      },
      {
        name: 'Quota Exceeded',
        conditions: [
          {
            id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
            value: 100,
            match: 'gt',
          },
        ],
        actions: this.buildActions('warning'),
        actionMatch: 'any',
        frequency: 10,
      },
    ];

    // Create all alert rules
    for (const rule of alertRules) {
      await this.createAlertRule(rule);
    }

    console.log('\n✓ Sentry alert configuration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify alerts in Sentry dashboard');
    console.log('2. Test alert delivery to Slack/Email');
    console.log('3. Configure team on-call schedule');
  }

  private buildActions(severity: 'critical' | 'warning'): AlertRule['actions'] {
    const actions: AlertRule['actions'] = [];

    if (this.slackWebhook) {
      const channel = severity === 'critical' ? '#alerts-critical' : '#alerts';
      actions.push(this.getSlackAction(channel));
    }

    if (this.alertEmail && severity === 'critical') {
      actions.push(this.getEmailAction());
    }

    return actions.length > 0
      ? actions
      : [{ service: 'noop' }]; // No-op action if no channels configured
  }
}

// Main execution
const dryRun = process.argv.includes('--dry-run');
const config = new SentryAlertsConfig(dryRun);

config.setup().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
