import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import GoogleAdBanner from '../../components/GoogleAdBanner';
import { BLOG_POSTS } from '../../lib/blog-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Women-First Matchmaking, Safety & Relationship Guides | LifePartner AI',
    description: 'Practical guides on safe matrimony for women, spotting red flags, privacy protection, compatibility, and values-first matchmaking.',
    keywords: ['safe matrimony for women', 'relationship advice', 'privacy in matrimony', 'kundali compatibility', 'matrimony blog', 'LifePartner AI'],
    alternates: {
        canonical: 'https://www.lifepartnerai.in/blog',
    }
};

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    created_at: string;
}

const staticPosts: BlogPost[] = BLOG_POSTS.map((p, i) => ({
    id: String(i),
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    created_at: p.date,
}));

async function getBlogPosts(): Promise<{ posts: BlogPost[] }> {
    try {
        const rawApi = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = (rawApi && !rawApi.includes('onrender.com')) ? rawApi : 'https://lifepartner-backend-295663053086.asia-south1.run.app';
        const fetchUrl = `${apiUrl}/blog?limit=100`;

        const res = await fetch(fetchUrl, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            console.error("Blog API error:", res.status, "- Using static fallback");
            return { posts: staticPosts };
        }

        const data = await res.json();
        let fetchedPosts: BlogPost[] = data.posts?.length ? data.posts : staticPosts;
        // Deduplicate by slug — API posts take priority, then fill gaps with static
        if (data.posts?.length) {
            const apiSlugs = new Set(fetchedPosts.map((p: BlogPost) => p.slug));
            const extraStatic = staticPosts.filter(sp => !apiSlugs.has(sp.slug));
            fetchedPosts = [...fetchedPosts, ...extraStatic];
        }
        return { posts: fetchedPosts };
    } catch (error: any) {
        console.error("Failed to fetch blog posts:", error.message, "- Using static fallback");
        return { posts: staticPosts };
    }
}

export default async function BlogIndexPage() {
    const { posts } = await getBlogPosts();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl">
                        Safe Matchmaking &amp; Relationship Guides
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Practical advice on safe matrimony for women, spotting red flags, privacy protection, and finding a values-aligned life partner.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/for-women"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold shadow-sm transition-colors"
                        >
                            Women-First Safety &amp; Free VIP →
                        </Link>
                        <Link
                            href="/safety"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-pink-300 text-gray-800 dark:text-gray-200 text-sm font-bold transition-colors"
                        >
                            Read Our Safety Standards
                        </Link>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mb-12">
                    <GoogleAdBanner format="horizontal" />
                </div>

                {posts.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        No articles published yet. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                href={`/blog/${post.slug}`}
                                key={post.id}
                                className="group relative bg-white dark:bg-gray-950 flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-200"
                            >
                                <div>
                                    <div className="flex items-center gap-x-4 text-xs mb-4">
                                        <time dateTime={post.created_at} className="text-gray-500 dark:text-gray-400">
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                        <span className="relative z-10 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-600">
                                            Guide
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 group-hover:text-rose-600 transition-colors mb-3">
                                        {post.title}
                                    </h3>
                                    <p className="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300 mb-6">
                                        {post.excerpt || "Read more about this relationship topic on LifePartner AI."}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-x-4">
                                    <div className="text-sm leading-6">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            <span className="absolute inset-0" />
                                            LifePartner AI Editorial
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300">Matchmaking &amp; Safety Team</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
