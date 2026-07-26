import { Metadata } from 'next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';

// Incremental Static Regeneration for blazing fast Googlebot crawl speeds (revalidate daily)
export const revalidate = 86400;

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
        ? `${displayValue} Matrimony & Dating - Free Matchmaking in ${displayValue} | LifePartner AI`
        : `${displayValue} Matrimony & Dating Profiles - 100% Free | LifePartner AI`;

    const description = `Find Verified ${displayValue} Brides, Grooms & Singles. 100% Free Matrimony & Dating App. No Payment Required. Safe, Secure, and AI-Powered Matchmaking in ${displayValue}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ['https://lifepartnerai.in/og-image.jpg'],
        },
        alternates: {
            canonical: `https://lifepartnerai.in/matrimony/${category.toLowerCase()}/${slug.toLowerCase()}`,
        }
    };
}

// 2. SERVER COMPONENT (Async Page)
export default async function SEOPage({ params }: PageProps) {
    const { category, slug } = params;
    const displayValue = titleCase(slug);
    const displayCategory = titleCase(category);

    // Fetch Data on Server
    let matches = [];
    try {
        const res = await api.matches.getPublicPreviews(category, slug);
        matches = res.matches || [];
    } catch (e) {
        console.error("SEO Page Fetch Error", e);
    }

    // 3. JSON-LD SCHEMAS (CollectionPage + BreadcrumbList)
    const collectionLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${displayValue} Matrimony Profiles`,
        "description": `Browse verified matrimonial profiles in ${displayValue}.`,
        "url": `https://lifepartnerai.in/matrimony/${category.toLowerCase()}/${slug.toLowerCase()}`,
        "numberOfItems": matches.length,
        "itemListElement": matches.map((m: any, index: number) => ({
            "@type": "Person",
            "position": index + 1,
            "name": m.name,
            "url": `https://lifepartnerai.in/register`
        }))
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://lifepartnerai.in"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Matrimony",
                "item": "https://lifepartnerai.in/matrimony"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": displayCategory,
                "item": `https://lifepartnerai.in/matrimony/${category.toLowerCase()}`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": displayValue,
                "item": `https://lifepartnerai.in/matrimony/${category.toLowerCase()}/${slug.toLowerCase()}`
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Inject Structured Data Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />

            {/* 1. Hero Section */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white pt-24 pb-16 px-6 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 shadow-sm">
                        {displayCategory === 'Location' ? (
                            <>Matrimony in <span className="text-yellow-300">{displayValue}</span></>
                        ) : (
                            <>{displayValue} <span className="text-yellow-300">Matrimony</span></>
                        )}
                    </h1>
                    <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8 font-light">
                        The most trusted way to find your life partner in {displayValue}.<br />
                        <span className="font-semibold">0% Commission. 100% Free.</span>
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Link href="/register">
                            <Button className="h-14 px-8 text-lg bg-white text-rose-600 hover:bg-gray-100 font-bold rounded-full shadow-lg transition-transform hover:scale-105">
                                Create Free Profile
                            </Button>
                        </Link>

                        {/* Viral Share Button */}
                        <ShareButton
                            title={`Find matches in ${displayValue}`}
                            text={`Check out verified matches in ${displayValue} on LifePartner AI!`}
                            url={`https://lifepartnerai.in/matrimony/${category}/${slug}?utm_source=share&utm_medium=social&utm_campaign=matrimony_seo`}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Stats / Trust Bar */}
            <div className="bg-white shadow-sm py-8 px-6 border-b border-gray-100">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-gray-700">
                    <div className="p-4 rounded-xl hover:bg-rose-50 transition-colors">
                        <div className="text-3xl font-bold text-rose-600 mb-1">100%</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Verified</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-rose-50 transition-colors">
                        <div className="text-3xl font-bold text-rose-600 mb-1">Free</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Forever</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-rose-50 transition-colors">
                        <div className="text-3xl font-bold text-rose-600 mb-1">Privacy</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Protected</div>
                    </div>
                    <div className="p-4 rounded-xl hover:bg-rose-50 transition-colors">
                        <div className="text-3xl font-bold text-rose-600 mb-1">AI</div>
                        <div className="text-sm uppercase tracking-wide font-semibold">Matchmaking</div>
                    </div>
                </div>
            </div>

            {/* 3. Preview Profiles Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-gray-900 text-center md:text-left">
                        Latest Profiles from {displayValue}
                    </h2>
                    <Link href="/register" className="text-rose-600 font-bold hover:underline">
                        View All Matches &rarr;
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
                                        alt={`${m.role} in ${displayValue}`}
                                        className="w-full h-full object-cover blur-[2px] opacity-90 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Register Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                                        <p className="text-white font-bold mb-2 text-sm">Login to view photo</p>
                                        <Link href="/register" className="w-full">
                                            <span className="block w-full bg-rose-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md hover:bg-rose-700 transition-colors">
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
                                    <p className="text-sm text-gray-500 mb-2">{m.age} Yrs • {m.role || "Member"}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded-md mb-2">
                                        📍 {m.location || displayValue}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🚀</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Be the first from {displayValue}!</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">This community is just starting. Create your profile now and get featured at the top.</p>
                        <Link href="/register">
                            <Button size="lg" className="bg-rose-600 hover:bg-rose-700">Create Profile Now</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* 4. SEO Content (Dynamic Text) */}
            <div className="bg-white py-16 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-6 text-gray-600 space-y-8 leading-relaxed">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Why LifePartner AI is the best choice for {displayValue}?</h3>
                        <p>
                            Finding a life partner in <strong>{displayValue}</strong> has traditionally been difficult.
                            Brokers charge high fees, and other apps are full of fake profiles.
                            LifePartner AI changes this by offering a <strong>100% Free</strong>, Verification-first platform tailored for {displayCategory === 'Community' ? `the ${displayValue} community` : `people in ${displayValue}`}.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">✨ AI-Powered Matching</h4>
                            <p className="text-sm">Our algorithm understands that a "Doctor in {displayValue}" might prefer another medical professional, or a "Software Engineer" might want someone who understands tech hours.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">🔒 Secure & Private</h4>
                            <p className="text-sm">Your photos and data are safe. We use enterprise-grade encryption and allow you to control who sees your full profile.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Footer CTA */}
            <div className="bg-gray-900 text-white py-20 text-center px-6">
                <h3 className="text-3xl md:text-4xl font-bold mb-6">Start Your {displayValue} Love Story</h3>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                    Join thousands of happy individuals. No credit card required. No hidden fees.
                </p>
                <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 h-16 px-12 rounded-full text-xl shadow-2xl shadow-rose-500/20 transition-all hover:scale-105">
                        Join for Free
                    </Button>
                </Link>
                <p className="mt-6 text-xs text-gray-500">
                    Trusted by 10,000+ Indians
                </p>
            </div>
        </div>
    );
}
