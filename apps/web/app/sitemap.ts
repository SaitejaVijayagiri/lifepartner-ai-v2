import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blog-data';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://lifepartnerai.in';

    // Static Pages
    const routes = [
        '',
        '/about',
        '/contact',
        '/blog',
        '/login',
        '/register',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic Blog Posts
    const blogRoutes = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date), // Use post date or current date
        changeFrequency: 'weekly' as const,
        priority: 0.9, // High priority for content
    }));


    // --- Programmatic SEO Routes ---
    const CITIES = ['Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad'];
    const COMMUNITIES = ['Brahmin', 'Iyer', 'Iyengar', 'Reddy', 'Kamma', 'Kapu', 'Ezhava', 'Nair', 'Muslim-Sunni', 'Muslim-Shia', 'Christian-Roman-Catholic', 'Sikh-Jat', 'Aggarwal', 'Baniya', 'Yadav', 'Kayastha', 'Maratha', 'Rajput', 'Jain-Digambar', 'Jain-Shwetambar'];
    const PROFESSIONS = ['Software-Engineer', 'Doctor', 'Civil-Engineer', 'Chartered-Accountant', 'IAS-IPS', 'Teacher', 'Professor', 'Lawyer', 'Architect', 'Business-Owner'];

    const cityRoutes = CITIES.map(city => ({
        url: `${baseUrl}/matrimony/location/${city.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const communityRoutes = COMMUNITIES.map(comm => ({
        url: `${baseUrl}/matrimony/community/${comm.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const professionRoutes = PROFESSIONS.map(prof => ({
        url: `${baseUrl}/matrimony/profession/${prof.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...blogRoutes, ...cityRoutes, ...communityRoutes, ...professionRoutes];
}
