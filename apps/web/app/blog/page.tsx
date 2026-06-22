import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import GoogleAdBanner from '../../components/GoogleAdBanner';
import { BLOG_POSTS } from '../../lib/blog-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Relationship Advice & Matchmaking Blog | LifePartner AI',
    description: 'Expert advice on dating, marriage, astrology matching, and finding a serious relationship in the modern world.',
    keywords: ['relationship advice', 'dating tips', 'astrology compatibility', 'matrimony blog', 'LifePartner AI'],
    alternates: {
        canonical: 'https://lifepartnerai.in/blog',
    }
};

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    created_at: string;
}

// Adapt static posts to the same shape as the API response
const staticPosts: BlogPost[] = BLOG_POSTS.map((p, i) => ({
    id: String(i),
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    created_at: p.date,
}));

async function getBlogPosts(): Promise<{ posts: BlogPost[] }> {
    try {
        // In Next.js standalone on Render, NEXT_PUBLIC_API_URL is the public backend URL.
        // No need to rewrite localhost → 127.0.0.1 since production doesn't use localhost.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || 'http://localhost:4000';
        const fetchUrl = `${apiUrl}/blog`;
        console.log("Fetching SEO Blogs from:", fetchUrl);

        const res = await fetch(fetchUrl, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000) // 5 second timeout to avoid hanging
        });

        if (!res.ok) {
            console.error("Blog API error:", res.status, "- Using static fallback");
            return { posts: staticPosts };
        }

        const data = await res.json();
        // Fall back to static posts if DB is empty so the page is never blank
        const posts: BlogPost[] = data.posts?.length ? data.posts : staticPosts;
        return { posts };
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
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl">
                        Relationship Insights & Advice
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Discover expert tips on matchmaking, dating safely, the science of compatibility, and finding true love.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto mb-12">
                    <GoogleAdBanner format="horizontal" />
                </div>

                {posts.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 py-12">
                        No articles published yet. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                href={`/blog/${post.slug}`}
                                key={post.id}
                                className="group relative bg-white dark:bg-gray-950 flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-200 dark:border-gray-800"
                            >
                                <div>
                                    <div className="flex items-center gap-x-4 text-xs mb-4">
                                        <time dateTime={post.created_at} className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                        <span className="relative z-10 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-600 hover:bg-gray-100 dark:bg-gray-800">
                                            Advice
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
                                        <p className="text-gray-600 dark:text-gray-300">Matchmaking Experts</p>
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
