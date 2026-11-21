import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const privateRoutes = [
        '/admin/',
        '/dashboard/',
        '/private/',
        '/api/auth/',
        '/chat/',
        '/onboarding/',
        '/profile/'
    ];

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: privateRoutes,
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: privateRoutes,
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: privateRoutes,
            },
            {
                userAgent: 'Applebot',
                allow: '/',
                disallow: privateRoutes,
            },
            {
                userAgent: 'DuckDuckBot',
                allow: '/',
                disallow: privateRoutes,
            },
            {
                userAgent: 'Twitterbot',
                allow: '/',
            },
            {
                userAgent: 'facebookexternalhit',
                allow: '/',
            }
        ],
        sitemap: 'https://www.lifepartnerai.in/sitemap.xml',
    };
}
