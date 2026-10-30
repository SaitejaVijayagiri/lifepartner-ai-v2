/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    poweredByHeader: false,
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
            { protocol: 'https', hostname: '*.r2.dev' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'lifepartner-ai.onrender.com' },
        ],
        unoptimized: true,
    },

    async headers() {
        return [
            {
                source: '/app-ads.txt',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/plain; charset=utf-8',
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600',
                    },
                ],
            },
            {
                source: '/ads.txt',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/plain; charset=utf-8',
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600',
                    },
                ],
            },
            {
                source: '/.well-known/assetlinks.json',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/json',
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/icons/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/LifePartner.apk',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/vnd.android.package-archive',
                    },
                    {
                        key: 'Content-Disposition',
                        value: 'attachment; filename="LifePartner.apk"',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600',
                    },
                ],
            },
            {
                source: '/LifePartner.aab',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/octet-stream',
                    },
                    {
                        key: 'Content-Disposition',
                        value: 'attachment; filename="LifePartner.aab"',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return {
            beforeFiles: [],
            afterFiles: [],
            fallback: [
                {
                    source: '/api/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com'}/:path*`,
                },
                {
                    source: '/photo/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com'}/photo/:path*`,
                },
                {
                    source: '/socket.io/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com'}/socket.io/:path*`,
                },
            ]
        };
    }
};

export default nextConfig;
