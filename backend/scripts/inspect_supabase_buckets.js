const dns = require('dns');
// Override DNS servers to Google and Cloudflare to bypass local India ISP DNS blocks
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

async function listAllFiles(bucketName, folderPath = '') {
    const filesList = [];
    
    async function recurse(dir) {
        console.log(`📁 Scanning directory: '${bucketName}/${dir}'...`);
        const { data, error } = await supabase.storage.from(bucketName).list(dir, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
            console.error(`Error listing folder ${dir}:`, error.message);
            return;
        }

        if (!data || data.length === 0) return;

        for (const item of data) {
            const fullPath = dir ? `${dir}/${item.name}` : item.name;
            // Folders have metadata as null, or item.id undefined
            if (!item.id || item.metadata === null || Object.keys(item.metadata).length === 0) {
                await recurse(fullPath);
            } else {
                filesList.push({
                    name: item.name,
                    fullPath,
                    size: item.metadata?.size || 0,
                    mimetype: item.metadata?.mimetype || '',
                    updated_at: item.updated_at
                });
            }
        }
    }

    await recurse(folderPath);
    return filesList;
}

async function main() {
    const bucketName = 'profiles';
    console.log(`🔍 Direct-listing files in bucket: '${bucketName}'...\n`);

    try {
        const files = await listAllFiles(bucketName);
        console.log(`\n✨ Found ${files.length} file(s) in bucket '${bucketName}':`);
        for (const file of files) {
            console.log(`  📄 Path: '${file.fullPath}' | Size: ${file.size} bytes | Mime: ${file.mimetype}`);
        }
    } catch (e) {
        console.error(`❌ Failed to list files for bucket '${bucketName}':`, e.message);
    }
}

main().catch(console.error);
