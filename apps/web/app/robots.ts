
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/dashboard/'], // Don't index private areas
        },
        sitemap: 'https://lifepartnerai.in/sitemap.xml',
    };
}
