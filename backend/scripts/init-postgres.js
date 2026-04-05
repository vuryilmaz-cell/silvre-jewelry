const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://silvre_user:DymTNp22aYZrl4tZTKo5qduEka4ppjzU@dpg-d78ps73uibrs73bsuls0-a.frankfurt-postgres.render.com/silvre_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL:', testResult.rows[0].now);
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📊 Loading schema...');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Schema loaded successfully!');
    
    // Check categories
    const categoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`✅ Categories count: ${categoriesResult.rows[0].count}`);
    
    // List categories
    const catList = await pool.query('SELECT id, name, slug FROM categories ORDER BY display_order');
    console.log('\n📦 Categories:');
    catList.rows.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name} (${cat.slug})`);
    });
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`\n✅ Total tables created: ${tablesResult.rows.length}`);
    
    pool.end();
    console.log('\n🎉 Database initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

initDatabase();