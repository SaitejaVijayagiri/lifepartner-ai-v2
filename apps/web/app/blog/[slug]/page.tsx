import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import GoogleAdBanner from '../../../components/GoogleAdBanner';
import { BLOG_POSTS } from '../../../lib/blog-data';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    keywords: string[];
    created_at: string;
}

interface Props {
    params: { slug: string }
}

async function getPost(slug: string): Promise<BlogPost | null> {
    try {
        const rawApi = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = (rawApi && !rawApi.includes('onrender.com')) ? rawApi.replace('localhost', '127.0.0.1') : 'https://lifepartner-backend-295663053086.asia-south1.run.app';
        const fetchUrl = `${apiUrl}/blog/${slug}`;

        const res = await fetch(fetchUrl, {
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            const data = await res.json();
            if (data && data.title) return data;
        }
    } catch {
        // Fallback to static articles below
    }

    const staticPost = BLOG_POSTS.find(p => p.slug === slug);
    if (staticPost) {
        return {
            id: staticPost.slug,
            slug: staticPost.slug,
            title: staticPost.title,
            content: staticPost.content,
            excerpt: staticPost.excerpt,
            meta_title: staticPost.title,
            meta_description: staticPost.excerpt,
            keywords: [staticPost.category || 'Matrimony', 'LifePartner AI', 'Dating', 'Matchmaking'],
            created_at: staticPost.date || '2026-10-25'
        };
    }

    return null;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const post = await getPost(params.slug);

    if (!post) {
        return { title: 'Post Not Found | LifePartner AI' };
    }

    return {
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        keywords: post.keywords,
        openGraph: {
            title: post.meta_title || post.title,
            description: post.meta_description || post.excerpt,
            type: 'article',
            publishedTime: post.created_at,
        },
        alternates: {
            canonical: `https://www.lifepartnerai.in/blog/${params.slug}`,
        }
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || post.meta_description,
        "image": (post as any).image || "https://www.lifepartnerai.in/og-image.jpg",
        "datePublished": post.created_at,
        "dateModified": post.created_at,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.lifepartnerai.in/blog/${params.slug}`
        },
        "author": {
            "@type": "Organization",
            "name": "LifePartner AI Editorial",
            "url": "https://www.lifepartnerai.in"
        },
        "publisher": {
            "@type": "Organization",
            "name": "LifePartner AI",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.lifepartnerai.in/icon-512x512.png"
            }
        }
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.lifepartnerai.in"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog & Guides",
                "item": "https://www.lifepartnerai.in/blog"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://www.lifepartnerai.in/blog/${params.slug}`
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <Navbar />

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 w-full">
                <article className="bg-white dark:bg-gray-950 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <a href="/" className="hover:text-rose-600 transition-colors">Home</a>
                            <span>/</span>
                            <a href="/blog" className="hover:text-rose-600 transition-colors">Blog</a>
                            <span>/</span>
                            <span className="text-gray-800 dark:text-gray-200 truncate max-w-xs">{post.title}</span>
                        </nav>
                        <header className="mb-10 text-center border-b border-gray-100 dark:border-gray-800 pb-10">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-6">
                                {post.title}
                            </h1>
                            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 gap-4">
                                <time dateTime={post.created_at}>
                                    Published on {new Date(post.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </time>
                                <span>•</span>
                                <span>LifePartner AI Editorial</span>
                            </div>
                        </header>

                        <div className="my-10">
                            <GoogleAdBanner format="horizontal" />
                        </div>

                        <div
                            className="prose prose-lg prose-rose mx-auto text-gray-700 dark:text-gray-300 
                            prose-headings:font-bold prose-headings:text-gray-900 dark:text-gray-100 
                            prose-a:text-rose-600 hover:prose-a:text-rose-500
                            prose-img:rounded-xl prose-img:shadow-sm"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-indigo-50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-indigo-950/30 border border-pink-200 dark:border-pink-900/50 text-center">
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                                Safe, Privacy-First Matchmaking Built for Women
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-5">
                                Masked phone numbers, blur-until-accept photos, AI Anti-Creep Shield, and 100% free lifetime messaging for verified women.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <a
                                    href="/register?gender=Female"
                                    className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold shadow-sm transition-colors"
                                >
                                    Join Free as Female →
                                </a>
                                <a
                                    href="/for-women"
                                    className="px-6 py-2.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold hover:border-pink-300 transition-colors"
                                >
                                    How We Protect Women
                                </a>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                            <GoogleAdBanner format="rectangle" />
                        </div>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
