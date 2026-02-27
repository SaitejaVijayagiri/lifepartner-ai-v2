const { Client } = require('pg');

const directUrl = "postgresql://postgres:Saitejauday%400102@db.mxzflpidclfcdqrgimqn.supabase.co:5432/postgres";
const poolerUrl = "postgresql://postgres.mxzflpidclfcdqrgimqn:Saitejauday%400102@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const pooler6543Url = "postgresql://postgres.mxzflpidclfcdqrgimqn:Saitejauday%400102@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function test(url, name) {
    try {
        const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log(`✅ ${name} connected:`, res.rows[0]);
        await client.end();
    } catch (err) {
        console.log(`❌ ${name} error:`, err.message);
    }
}

async function main() {
    await test(directUrl, "Direct String");
    await test(poolerUrl, "Pooler 5432 (Current config)");
    await test(pooler6543Url, "Pooler 6543");
}

main();
