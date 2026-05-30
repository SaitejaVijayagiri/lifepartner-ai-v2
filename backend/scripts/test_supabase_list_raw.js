const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const customFetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: {
        fetch: customFetch
    }
});

async function main() {
    console.log('🔍 Querying raw Supabase list at root...\n');
    const { data, error } = await supabase.storage.from('profiles').list('', {
        limit: 100,
        offset: 0
    });

    if (error) {
        console.error('❌ SDK error:', error.message);
        return;
    }

    console.log(`Raw list length: ${data ? data.length : 0}`);
    console.log('JSON Output:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
