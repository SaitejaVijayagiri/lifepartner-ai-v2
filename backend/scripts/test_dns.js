const dns = require('dns');
const https = require('https');

// Force Node's asynchronous resolver to use Google and Cloudflare DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Custom lookup function that bypasses OS getaddrinfo
function customLookup(hostname, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    
    // Use dns.resolve4 to perform DNS resolution asynchronously using the configured servers
    dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
            // Fallback to standard lookup if resolve4 fails or is not IPv4
            return dns.lookup(hostname, options, callback);
        }
        // Return the first resolved IPv4 address
        callback(null, addresses[0], 4);
    });
}

// Create an HTTPS Agent that uses our custom lookup
const agent = new https.Agent({ lookup: customLookup });

// Use standard node-fetch with our agent
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
    console.log('Testing custom lookup agent for Supabase host...');
    try {
        const res = await fetch('https://mxzflpidclfcdqrgimqn.supabase.co/rest/v1/', { agent });
        console.log('✅ Fetch worked! Status:', res.status, res.statusText);
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
    }
}

main();
