import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import GoogleAdBanner from '../../components/GoogleAdBanner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Relationship Advice & Matchmaking Blog | LifePartner AI',
    description: 'Expert advice on dating, marriage, astrology matching, and finding a serious relationship in the modern world.',
    keywords: ['relationship advice', 'dating tips', 'astrology compatibility', 'matrimony blog', 'LifePartner AI']
};

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    created_at: string;
}

async function getBlogPosts(): Promise<{ posts: BlogPost[], error: string | null }> {
    try {
        // Fetch from the backend API. Using 127.0.0.1 bypasses Node 18+ IPv6 localhost resolution failures
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:4000';
        const fetchUrl = `${apiUrl}/blog`;

        console.log("Fetching SEO Blogs from:", fetchUrl);

        const res = await fetch(fetchUrl, {
            cache: 'no-store'
        });

        if (!res.ok) {
            const body = await res.text();
            console.error("Invalid fetch response:", res.status, body);
            return { posts: [], error: `Backend returned ${res.status}: ${body}` };
        }

        const data = await res.json();
        return { posts: data.posts || [], error: null };
    } catch (error: any) {
        console.error("Failed to fetch blog posts:", error);
        return { posts: [], error: `Network/Fetch Error: ${error.message}` };
    }
}

export default async function BlogIndexPage() {
    const { posts, error } = await getBlogPosts();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Relationship Insights & Advice
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover expert tips on matchmaking, dating safely, the science of compatibility, and finding true love.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto mb-12">
                    <GoogleAdBanner format="horizontal" />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-8 text-center">
                        <h3 className="font-bold text-lg mb-2">Debug Error: Could not load articles</h3>
                        <p className="font-mono text-sm break-all">{error}</p>
                    </div>
                )}

                {posts.length === 0 && !error ? (
                    <div className="text-center text-gray-500 py-12">
                        No articles published yet. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                href={`/blog/${post.slug}`}
                                key={post.id}
                                className="group relative bg-white flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-200"
                            >
                                <div>
                                    <div className="flex items-center gap-x-4 text-xs mb-4">
                                        <time dateTime={post.created_at} className="text-gray-500">
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                        <span className="relative z-10 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-600 hover:bg-gray-100">
                                            Advice
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold leading-6 text-gray-900 group-hover:text-rose-600 transition-colors mb-3">
                                        {post.title}
                                    </h3>
                                    <p className="line-clamp-3 text-sm leading-6 text-gray-600 mb-6">
                                        {post.excerpt || "Read more about this relationship topic on LifePartner AI."}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-x-4">
                                    <div className="text-sm leading-6">
                                        <p className="font-semibold text-gray-900">
                                            <span className="absolute inset-0" />
                                            LifePartner AI Editorial
                                        </p>
                                        <p className="text-gray-600">Matchmaking Experts</p>
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
