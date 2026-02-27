const net = require('net');

function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('connect', () => {
            console.log(`✅ Reachable: ${host}:${port}`);
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`❌ Timeout: ${host}:${port}`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`❌ Error: ${host}:${port} - ${err.message}`);
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function main() {
    await checkPort('aws-1-ap-south-1.pooler.supabase.com', 5432);
    await checkPort('aws-1-ap-south-1.pooler.supabase.com', 6543);
    await checkPort('aws-0-ap-south-1.pooler.supabase.com', 5432);
    await checkPort('aws-0-ap-south-1.pooler.supabase.com', 6543);
    await checkPort('db.mxzflpidclfcdqrgimqn.supabase.co', 5432);
    await checkPort('db.mxzflpidclfcdqrgimqn.supabase.co', 6543);
}

main();
