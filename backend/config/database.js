const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let db;
let dbType;

// Production ortamında PostgreSQL, Development'ta SQLite
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  
  // ========== POSTGRESQL (RENDER) ==========
  console.log('🔄 Connecting to PostgreSQL...');
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  dbType = 'postgresql';
  
  // Bağlantı testi
  db.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
    } else {
      console.log('✅ PostgreSQL connected:', res.rows[0].now);
    }
  });
  
} else {
  
  // ========== SQLITE (LOCAL) ==========
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/silvre.db');
  const dbDir = path.dirname(dbPath);

  // Database klasörünü oluştur
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // SQLite bağlantısı
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ SQLite connection error:', err.message);
      process.exit(1);
    }
    console.log('✅ SQLite connected (Local Development)');
  });

  dbType = 'sqlite';
  
  // Foreign key desteği
  db.run('PRAGMA foreign_keys = ON');
}

// ========== UNIFIED ASYNC API ==========
// Hem PostgreSQL hem SQLite için çalışan async fonksiyonlar

const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgresql') {
        // PostgreSQL
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve({ 
            lastID: result.rows && result.rows[0] ? result.rows[0].id : null,
            changes: result.rowCount 
          });
        });
      } else {
        // SQLite
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgresql') {
        // PostgreSQL
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows ? result.rows[0] : null);
        });
      } else {
        // SQLite
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (dbType === 'postgresql') {
        // PostgreSQL
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows || []);
        });
      } else {
        // SQLite
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      }
    });
  },
  
  // PostgreSQL için direkt query desteği
  query: (sql, params = []) => {
    if (dbType === 'postgresql') {
      return db.query(sql, params);
    } else {
      // SQLite için Promise wrapper
      return dbAsync.all(sql, params);
    }
  }
};

// ========== DATABASE INITIALIZATION ==========
const initializeDatabase = async () => {
  
  if (dbType === 'postgresql') {
    // PostgreSQL schema'sı Render dashboard'dan çalıştırılır
    console.log('ℹ️  PostgreSQL - Schema should be initialized via Render dashboard');
    return Promise.resolve();
  }
  
  // SQLite için schema yükle
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          console.error('❌ Schema execution error:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite schema initialized');
          resolve();
        }
      });
    });
  } else {
    console.log('⚠️  Schema file not found');
    return Promise.resolve();
  }
};

module.exports = { 
  db, 
  dbAsync, 
  dbType,
  initializeDatabase 
};