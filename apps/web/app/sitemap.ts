import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blog-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://lifepartnerai.in';

    // Static Pages
    const routes = [
        '',
        '/stranger-chat',
        '/omegle-alternative',
        '/about',
        '/contact',
        '/blog',
        '/login',
        '/register',
        '/community',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' || route === '/stranger-chat' || route === '/omegle-alternative' ? 1 : 0.8,
    }));

    // Dynamic Blog Posts (fallback to static data, try to fetch from API)
    let posts = BLOG_POSTS.map(post => ({
        slug: post.slug,
        date: post.date
    }));

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        const res = await fetch(`${apiUrl}/blog?limit=100`, {
            signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.posts && data.posts.length > 0) {
                // Merge static posts and API posts by slug to avoid duplicates
                const uniquePostsMap = new Map();
                // Add static posts first
                posts.forEach(p => uniquePostsMap.set(p.slug, p));
                // Add or overwrite with database posts
                data.posts.forEach((p: any) => {
                    uniquePostsMap.set(p.slug, {
                        slug: p.slug,
                        date: p.created_at || new Date().toISOString()
                    });
                });
                posts = Array.from(uniquePostsMap.values());
            }
        }
    } catch (e) {
        console.error("Failed to fetch dynamic blog posts for sitemap, using fallback", e);
    }

    const blogRoutes = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));


    // --- Programmatic SEO Routes ---
    const CITIES = [
        'Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
        // Worldwide / International Cities & Country Hubs
        'London', 'New-York', 'Los-Angeles', 'Chicago', 'Houston', 'Dallas', 'San-Francisco', 'San-Jose', 'Seattle', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Dubai', 'Singapore',
        'Tokyo', 'Osaka', 'Seoul', 'Beijing', 'Shanghai', 'Hong-Kong', 'Manila', 'Jakarta', 'Kuala-Lumpur', 'Ho-Chi-Minh', 'Bangkok',
        'Caracas', 'Sao-Paulo', 'Rio-de-Janeiro', 'Mexico-City', 'Buenos-Aires',
        'Lagos', 'Nairobi', 'Johannesburg', 'Cairo', 'Paris', 'Berlin', 'Madrid', 'Rome'
    ];
    const COMMUNITIES = ['Brahmin', 'Iyer', 'Iyengar', 'Reddy', 'Kamma', 'Kapu', 'Ezhava', 'Nair', 'Muslim-Sunni', 'Muslim-Shia', 'Christian-Roman-Catholic', 'Sikh-Jat', 'Aggarwal', 'Baniya', 'Yadav', 'Kayastha', 'Maratha', 'Rajput', 'Jain-Digambar', 'Jain-Shwetambar'];
    const PROFESSIONS = ['Software-Engineer', 'Doctor', 'Civil-Engineer', 'Chartered-Accountant', 'IAS-IPS', 'Teacher', 'Professor', 'Lawyer', 'Architect', 'Business-Owner'];
    const INTENTS = [
        'online-chat-with-strangers',
        'chat-with-random-people',
        'chat-with-international-guys',
        'talk-to-random-people-online',
        'free-random-video-chat',
        'chat-with-single-girls-online',
        'talk-to-single-indian-girls',
        'free-matrimony-chat-without-payment',
        'nri-matrimony-chat',
        'global-chat-with-verified-singles',
        'chat-with-singles-japan',
        'chat-with-singles-korea',
        'chat-with-singles-philippines',
        'chat-with-singles-indonesia',
        'chat-with-singles-vietnam',
        'chat-with-singles-venezuela',
        'chat-with-singles-africa',
        'safe-dating-app-for-women'
    ];

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

    const intentMatrimonyRoutes = INTENTS.map(intent => ({
        url: `${baseUrl}/matrimony/intent/${intent}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // Dating Programmatic SEO Routes
    const cityDatingRoutes = CITIES.map(city => ({
        url: `${baseUrl}/dating/location/${city.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const communityDatingRoutes = COMMUNITIES.map(comm => ({
        url: `${baseUrl}/dating/community/${comm.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const professionDatingRoutes = PROFESSIONS.map(prof => ({
        url: `${baseUrl}/dating/profession/${prof.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const intentDatingRoutes = INTENTS.map(intent => ({
        url: `${baseUrl}/dating/intent/${intent}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [
        ...routes,
        ...blogRoutes,
        ...cityRoutes,
        ...communityRoutes,
        ...professionRoutes,
        ...intentMatrimonyRoutes,
        ...cityDatingRoutes,
        ...communityDatingRoutes,
        ...professionDatingRoutes,
        ...intentDatingRoutes
    ];
}
