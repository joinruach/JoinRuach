#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(__dirname, '../../.env') });

async function verifyPolicies() {
  const { default: knex } = await import('knex');
  const db = knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME || 'strapi_db',
      user: process.env.LOCAL_DATABASE_USERNAME || 'postgres',
      password: process.env.LOCAL_DATABASE_PASSWORD || 'postgres',
    }
  });

  const policies = await db('library_license_policies').select('id', 'policy_id', 'policy_name');
  console.log('\n📋 License policies in database:');
  policies.forEach(p => console.log(`  ✅ ${p.policy_id}: ${p.policy_name} (DB id: ${p.id})`));
  console.log('');
  await db.destroy();
}

verifyPolicies();
