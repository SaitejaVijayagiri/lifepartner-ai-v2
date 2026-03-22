/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
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
    output: isCapacitor ? 'export' : 'standalone',

    ...(isCapacitor ? {} : {
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
    })
};

export default nextConfig;
