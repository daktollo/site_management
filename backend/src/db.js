import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool(config.db);

export const query = (text, params) => pool.query(text, params);

// Resolve once the database is reachable; retries to tolerate container startup.
export async function waitForDb(retries = 20, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`DB not ready (attempt ${attempt}/${retries}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
