import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blog-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.lifepartnerai.in';

    // Core high-trust matrimony, women-first, and regional landing pages
    const routes = [
        '',
        '/india',
        '/for-women',
        '/matrimony',
        '/dating',
        '/japan',
        '/korea',
        '/singapore',
        '/thailand',
        '/malaysia',
        '/indonesia',
        '/russia',
        '/usa',
        '/philippines',
        '/uk',
        '/canada',
        '/australia',
        '/vietnam',
        '/brazil',
        '/germany',
        '/france',
        '/uae',
        '/about',
        '/contact',
        '/blog',
        '/login',
        '/register',
        '/community',
        '/safety',
        '/child-safety',
        '/guidelines',
        '/careers',
        '/refund-policy',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0
            : ['/for-women', '/matrimony', '/india', '/usa', '/uk', '/canada', '/australia'].includes(route) ? 0.95
            : ['/about', '/contact', '/privacy', '/terms', '/safety', '/guidelines', '/refund-policy', '/child-safety'].includes(route) ? 0.65
            : 0.8,
    }));

    // Dynamic Blog Posts (merge static + backend daily SEO posts up to 500)
    const normalizeTitle = (title: string) =>
        String(title || '')
            .replace(/\s*\|\s*LifePartner AI$/i, '')
            .replace(/[^a-z0-9\u00C0-\uFFFF]+/gi, ' ')
            .trim()
            .toLowerCase();

    let posts = BLOG_POSTS.map(post => ({
        slug: post.slug,
        title: post.title,
        date: post.date
    }));

    try {
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = (envUrl && !envUrl.includes('onrender.com')) ? envUrl : 'https://lifepartner-backend-295663053086.asia-south1.run.app';
        const res = await fetch(`${apiUrl}/blog?limit=500`, {
            signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.posts && data.posts.length > 0) {
                const uniquePostsMap = new Map<string, { slug: string; title: string; date: string }>();
                const seenTitles = new Set<string>();
                // Prefer live API posts first, then fill unique static slugs/titles
                for (const p of data.posts) {
                    const slugKey = String(p.slug || '').trim().toLowerCase();
                    const titleKey = normalizeTitle(p.title || '');
                    if (!slugKey || uniquePostsMap.has(slugKey) || (titleKey && seenTitles.has(titleKey))) continue;
                    uniquePostsMap.set(slugKey, {
                        slug: p.slug,
                        title: p.title || p.slug,
                        date: p.created_at || new Date().toISOString()
                    });
                    if (titleKey) seenTitles.add(titleKey);
                }
                for (const p of posts) {
                    const slugKey = String(p.slug || '').trim().toLowerCase();
                    const titleKey = normalizeTitle(p.title || '');
                    if (!slugKey || uniquePostsMap.has(slugKey) || (titleKey && seenTitles.has(titleKey))) continue;
                    uniquePostsMap.set(slugKey, p);
                    if (titleKey) seenTitles.add(titleKey);
                }
                posts = Array.from(uniquePostsMap.values());
            }
        }
    } catch {
        console.warn("[Sitemap] Using static blog data for sitemap generation (backend unreachable during build).");
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
        'Moscow', 'Saint-Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny-Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk',
        'London', 'New-York', 'Los-Angeles', 'Chicago', 'Houston', 'Dallas', 'San-Francisco', 'San-Jose', 'Seattle', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Dubai', 'Singapore',
        'Tokyo', 'Osaka', 'Seoul', 'Beijing', 'Shanghai', 'Hong-Kong', 'Manila', 'Jakarta', 'Kuala-Lumpur', 'Ho-Chi-Minh', 'Bangkok',
        'Caracas', 'Sao-Paulo', 'Rio-de-Janeiro', 'Mexico-City', 'Buenos-Aires',
        'Lagos', 'Nairobi', 'Johannesburg', 'Cairo', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Austin', 'New-Jersey', 'Boston', 'Frankfurt', 'Dublin', 'Auckland'
    ];

    const COUNTRIES = [
        'United-States', 'United-Kingdom', 'Canada', 'Australia', 'United-Arab-Emirates',
        'Singapore', 'Germany', 'Malaysia', 'New-Zealand', 'South-Africa', 'Russia',
        'Japan', 'France', 'Italy', 'Spain', 'Brazil', 'Mexico', 'Saudi-Arabia',
        'Qatar', 'Kuwait', 'Netherlands', 'Ireland', 'Switzerland', 'Sweden', 'Norway', 'India'
    ];

    const ALL_LOCATIONS = [...CITIES, ...COUNTRIES];

    const COMMUNITIES = ['Brahmin', 'Iyer', 'Iyengar', 'Reddy', 'Kamma', 'Kapu', 'Ezhava', 'Nair', 'Muslim-Sunni', 'Muslim-Shia', 'Christian-Roman-Catholic', 'Sikh-Jat', 'Aggarwal', 'Baniya', 'Yadav', 'Kayastha', 'Maratha', 'Rajput', 'Jain-Digambar', 'Jain-Shwetambar'];
    const PROFESSIONS = ['Software-Engineer', 'Doctor', 'Civil-Engineer', 'Chartered-Accountant', 'IAS-IPS', 'Teacher', 'Professor', 'Lawyer', 'Architect', 'Business-Owner'];

    const MATRIMONY_INTENTS = [
        'safe-matrimony-for-women',
        'safe-matrimony-for-indian-women',
        'matrimony-for-working-women',
        'career-women-matrimony-india',
        'privacy-first-matrimony-india',
        'no-phone-number-leak-matrimony',
        'no-telemarketer-matrimony-app',
        'selfie-verified-matrimony-profiles',
        'women-safety-first-matrimony',
        'ai-compatibility-matrimony-for-women',
        'nri-matrimony-for-indian-women',
        'free-matrimony-chat-without-payment',
        'nri-matrimony-chat',
        'indian-matrimony-free-chat',
        'nri-indian-matrimony-usa-uk-canada',
        'telugu-matrimony-free-chat',
        'tamil-matrimony-free-chat',
        'hindi-matrimony-free-chat',
        'kerala-matrimony-free-chat',
        'kannada-matrimony-free-chat',
        'marathi-matrimony-free-chat',
        'punjabi-matrimony-free-chat',
        'bengali-matrimony-free-chat',
        'gujarati-matrimony-free-chat',
        'free-kundali-matching-online',
        'verified-nri-grooms-and-brides',
        'matrimony-app-without-subscription',
    ];

    const SERIOUS_DATING_INTENTS = [
        'safe-dating-app-for-women',
        'women-first-dating-app',
        'free-vip-dating-for-women',
        'anti-harassment-dating-app',
        'global-chat-with-verified-singles',
        'chat-with-singles-usa',
        'chat-with-singles-uk',
        'chat-with-singles-canada',
        'chat-with-singles-australia',
        'chat-with-singles-uae',
    ];

    const cityRoutes = ALL_LOCATIONS.map(city => ({
        url: `${baseUrl}/matrimony/location/${city.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
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

    const intentMatrimonyRoutes = MATRIMONY_INTENTS.map(intent => ({
        url: `${baseUrl}/matrimony/intent/${intent}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    const cityDatingRoutes = ALL_LOCATIONS.map(city => ({
        url: `${baseUrl}/dating/location/${city.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
    }));

    const communityDatingRoutes = COMMUNITIES.map(comm => ({
        url: `${baseUrl}/dating/community/${comm.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const professionDatingRoutes = PROFESSIONS.map(prof => ({
        url: `${baseUrl}/dating/profession/${prof.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
    }));

    const intentDatingRoutes = SERIOUS_DATING_INTENTS.map(intent => ({
        url: `${baseUrl}/dating/intent/${intent}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
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
