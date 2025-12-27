const { createConnection } = require('pg');

async function checkTables() {
  const conn = await createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'postgres',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD,
  });
  
  const result = await conn.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'formation_%'
    ORDER BY tablename;
  `);
  
  console.log('Formation tables:', result.rows);
  await conn.end();
}

checkTables().catch(console.error);
