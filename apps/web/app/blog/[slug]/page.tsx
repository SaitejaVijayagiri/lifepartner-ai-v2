import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import GoogleAdBanner from '../../../components/GoogleAdBanner';

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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:4000';
        const fetchUrl = `${apiUrl}/blog/${slug}`;

        const res = await fetch(fetchUrl, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
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
        }
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getPost(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar />

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 w-full">
                <article className="bg-white dark:bg-gray-950 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-8 md:p-12">
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

                        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
                            <GoogleAdBanner format="rectangle" />
                        </div>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
