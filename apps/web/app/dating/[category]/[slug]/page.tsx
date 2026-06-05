import { Metadata } from 'next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';

// Force Dynamic Rendering for fresh data
export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        category: string;
        slug: string;
    };
}

// Helper for Title Case
const titleCase = (str: string) => str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// 1. GENERATE METADATA (Server Side)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category, slug } = params;
    const displayValue = titleCase(slug);

    const title = category === 'location'
        ? `Dating in ${displayValue} - Free Dating App & Chat in ${displayValue} | LifePartner AI`
        : `Dating for ${displayValue} Singles - 100% Free Dating App | LifePartner AI`;

    const description = `Find and chat with verified singles in ${displayValue}. 100% Free Dating App. No Subscription or Payment Required. Safe, secure local matchmaking and dating.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ['/og-image.jpg'],
        },
        alternates: {
            canonical: `https://lifepartnerai.in/dating/${category}/${slug}`,
        }
    };
}

// 2. SERVER COMPONENT (Async Page)
export default async function SEODatingPage({ params }: PageProps) {
    const { category, slug } = params;
    const displayValue = titleCase(slug);
    const displayCategory = titleCase(category);

    // Fetch Data on Server
    let matches = [];
    try {
        const res = await api.matches.getPublicPreviews(category, slug);
        matches = res.matches || [];
    } catch (e) {
        console.error("SEO Dating Page Fetch Error", e);
    }

    // 3. JSON-LD SCHEMA (Structured Data)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "DatingService",
        "name": `Dating and Matchmaking in ${displayValue}`,
        "description": `Browse verified singles in ${displayValue} and start dating for free.`,
        "url": `https://lifepartnerai.in/dating/${category}/${slug}`,
        "areaServed": displayCategory === 'Location' ? displayValue : 'IN',
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR",
            "name": "Free Dating Account"
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Inject Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* 1. Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white pt-24 pb-16 px-6 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 shadow-sm">
                        {displayCategory === 'Location' ? (
                            <>Dating in <span className="text-yellow-300">{displayValue}</span></>
                        ) : (
                            <>{displayValue} <span className="text-yellow-300">Dating & Chat</span></>
                        )}
                    </h1>
                    <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8 font-light">
                        The smarter, safer way to find, chat, and meet verified singles in {displayValue}.<br />
                        <span className="font-semibold">0% Subscription. 100% Free Chatting.</span>
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Link href="/register">
                            <Button className="h-14 px-8 text-lg bg-white text-indigo-600 hover:bg-gray-100 font-bold rounded-full shadow-lg transition-transform hover:scale-105">
                                Start Dating for Free
                            </Button>
                        </Link>

                        {/* Viral Share Button */}
                        <ShareButton
                            title={`Meet verified singles in ${displayValue}`}
                            text={`Check out verified dating profiles in ${displayValue} on LifePartner AI!`}
                            url={`https://lifepartnerai.in/dating/${category}/${slug}`}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Stats / Trust Bar */}
            <div className="bg-white shadow-sm py-8 px-6 border-b border-gray-100">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-gray-700">
                    <div className="p-4 rounded-xl hover:bg-indigo-50 transition-colors">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">100%</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Verified Singles</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-indigo-50 transition-colors">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">Free Chat</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">No Subscription</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-indigo-50 transition-colors">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">Privacy</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Safety First</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-indigo-50 transition-colors">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">AI Wingman</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Icebreakers</div>
                    </div>
                </div>
            </div>

            {/* 3. Preview Profiles Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-gray-900 text-center md:text-left">
                        Latest Singles from {displayValue}
                    </h2>
                    <Link href="/register" className="text-indigo-600 font-bold hover:underline">
                        View All Nearby Matches &rarr;
                    </Link>
                </div>

                {matches.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {matches.map((m: any) => (
                            <div key={m.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all group relative border border-gray-100">
                                <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                                    {/* Blurred Image Effect */}
                                    <img
                                        src={m.photoUrl}
                                        alt={`${m.role || 'Single'} in ${displayValue}`}
                                        className="w-full h-full object-cover blur-[2px] opacity-90 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Register Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                                        <p className="text-white font-bold mb-2 text-sm">Login to view photo</p>
                                        <Link href="/register" className="w-full">
                                            <span className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors">
                                                View Profile
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                        NEW
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">{m.name.split(' ')[0]}</h3>
                                        <div className="w-2 h-2 rounded-full bg-green-500" title="Active recently"></div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{m.age} Yrs • {m.role || "Single"}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded-md mb-2">
                                        📍 {m.location || displayValue}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">❤️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Be the first to join from {displayValue}!</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Our dating community is expanding here. Create your profile now to stand out at the top.</p>
                        <Link href="/register">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">Create Profile Now</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* 4. SEO Content (Dynamic Text) */}
            <div className="bg-white py-16 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-6 text-gray-600 space-y-8 leading-relaxed">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Why LifePartner AI is the best dating app choice for {displayValue}?</h3>
                        <p>
                            Dating in <strong>{displayValue}</strong> is now simpler and safer than ever.
                            Unlike other dating apps that restrict chats behind paid subscriptions, LifePartner AI is <strong>100% Free</strong>.
                            We use advanced AI identity verification to ensure a community free of fake profiles, helping you connect genuinely with local singles in {displayValue}.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">💬 Free Unlimited Chatting</h4>
                            <p className="text-sm">Stop paying to unlock messages. Chat with matches naturally without any coin systems, paywalls, or premium subscriptions.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">🛡️ Verifiable Anti-Catfish Filters</h4>
                            <p className="text-sm">We take security seriously. All profiles undergo biometric verification checks to keep our local dating community clean and trustworthy.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Footer CTA */}
            <div className="bg-gray-900 text-white py-20 text-center px-6">
                <h3 className="text-3xl md:text-4xl font-bold mb-6">Find Love in {displayValue}</h3>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                    Join thousands of local singles. 100% Free. Safe & Verified.
                </p>
                <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-750 h-16 px-12 rounded-full text-xl shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105">
                        Join for Free
                    </Button>
                </Link>
                <p className="mt-6 text-xs text-gray-500">
                    Trusted by 10,000+ Verified Users
                </p>
            </div>
        </div>
    );
}
