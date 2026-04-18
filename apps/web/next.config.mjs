/** @type {import('next').NextConfig} */
const nextConfig = {
    // ⚙️ RENDER OOM FIXES: Force sequential build and limit CPU to 1 to 
    // restrict Next.js RAM usage to ~400MB and prevent V8 memory crashes on free tier.
    experimental: {
        workerThreads: false,
        cpus: 1,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'api.dicebear.com' },
            { protocol: 'https', hostname: 'mxzflpidclfcdqrgimqn.supabase.co' },
            { protocol: 'https', hostname: '*.supabase.co' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'storage.googleapis.com' },
            { protocol: 'https', hostname: 'i.pravatar.cc' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'placehold.co' },
        ],
        unoptimized: true,
    },

    async headers() {
        return [
            {
                    source: '/(.*)',
                    headers: [
                        {
                            key: 'Access-Control-Allow-Origin',
                            value: '*',
                        },
                    ],
                },
            ];
        },
        async rewrites() {
            return [
                {
                    source: '/api/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com'}/:path*`,
                },
                {
                    source: '/socket.io/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/socket.io/:path*`,
                },
            ];
        }
};

export default nextConfig;
