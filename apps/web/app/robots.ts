import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/', '/api/auth/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
            },
            {
                userAgent: 'Applebot',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
            },
            {
                userAgent: 'YandexBot',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
            },
            {
                userAgent: 'DuckDuckBot',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
            },
            {
                userAgent: 'Baiduspider',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/private/'],
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
        sitemap: 'https://lifepartnerai.in/sitemap.xml',
    };
}
