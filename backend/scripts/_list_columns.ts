import * as dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
p.query("SELECT column_name FROM information_schema.columns WHERE table_name='profiles' ORDER BY ordinal_position")
  .then(r => { r.rows.forEach((x: any) => console.log(x.column_name)); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
