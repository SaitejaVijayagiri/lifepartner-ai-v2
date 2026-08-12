import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Mail, Users, Heart, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'About Our Mission | Founder Saiteja Vijayagiri | LifePartner AI',
    description: "Learn why Founder Saiteja Vijayagiri built India's first 100% Free, AI-Powered, Screenshot-Protected and Transparent matchmaking platform without fake profiles or paywalls.",
    keywords: ['about lifepartner ai', 'free matrimony mission', 'saiteja founder matrimony', 'saiteja vijayagiri', 'transparent matchmaking', 'no paywall matrimony', 'screenshot protected snaps dating'],
    alternates: {
        canonical: 'https://lifepartnerai.in/about',
    }
};

export default function AboutPage() {
    const jsonLdFounder = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Saiteja Vijayagiri",
        "jobTitle": "Founder & Lead Developer",
        "worksFor": {
            "@type": "Organization",
            "name": "LifePartner AI",
            "url": "https://lifepartnerai.in"
        },
        "url": "https://lifepartnerai.in/about",
        "sameAs": [
            "https://lifepartnerai.in"
        ],
        "description": "Founder & CEO of LifePartner AI, building India's first 100% free AI-driven matrimony and matchmaking platform."
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
            <Script
                id="founder-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFounder) }}
            />
            <Navbar />

            <main className="pt-28 md:pt-36 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Mission Header */}
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-900/50">
                            <Sparkles size={14} /> Our Mission & Vision
                        </div>
                        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-gray-900 dark:text-white tracking-tight">
                            Our Mission
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                            We are building India's first <b>100% Free, AI-Powered, Screenshot-Protected, and Transparent</b> matchmaking platform.
                        </p>
                    </div>

                    {/* Founder Card Showcase */}
                    <div className="mb-16 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40 p-8 md:p-12 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-xl">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                            <div className="relative group shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl bg-indigo-100 dark:bg-gray-800 flex items-center justify-center">
                                    <img
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Saiteja&eyebrows=default&style=circle&hair=shortCombover"
                                        alt="Saiteja Vijayagiri - Founder of LifePartner AI"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-900 shadow-md">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-2">
                                    Message From The Founder
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    Saiteja Vijayagiri
                                </h2>
                                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                                    Founder & Lead Architect, LifePartner AI
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                                    "I created LifePartner AI to empower verified singles worldwide to find meaningful relationships without financial barriers or privacy risks."
                                </p>
                            </div>
                        </div>

                        {/* Founder Story Paragraphs */}
                        <div className="space-y-6 text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-200/60 dark:border-gray-800 pt-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Why I Built LifePartner AI</h3>
                            <p>
                                Like many individuals seeking a life partner, I was deeply frustrated with traditional matrimony sites and dating apps.
                                They are crowded with fake profiles, paywalls charging thousands of rupees just to unlock contact details, and endless swiping without genuine intent.
                            </p>
                            <p>
                                <b>LifePartner AI was created to solve these exact pain points.</b>
                            </p>
                            <p>
                                I engineered this platform to leverage state-of-the-art AI technology and human verification so real people can connect for serious matrimony and marriage—100% free, transparent, and completely protected.
                            </p>
                            
                            {/* Founder Promises Grid */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-md mt-6">
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg mb-4 flex items-center gap-2">
                                    <CheckCircle className="text-indigo-600 dark:text-indigo-400" size={20} /> My Direct Promises to You:
                                </h4>
                                <ul className="grid sm:grid-cols-2 gap-4 text-sm md:text-base text-gray-750 dark:text-gray-300">
                                    <li className="flex items-center gap-3 p-2 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                                        <ShieldCheck size={20} className="text-green-600 dark:text-green-400 shrink-0" />
                                        <span><b>Zero Fake Profiles:</b> Verified by human moderation & AI.</span>
                                    </li>
                                    <li className="flex items-center gap-3 p-2 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                                        <Heart size={20} className="text-pink-600 dark:text-pink-400 shrink-0" />
                                        <span><b>100% Free Chat:</b> Zero paywalls to unlock messaging.</span>
                                    </li>
                                    <li className="flex items-center gap-3 p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                                        <Lock size={20} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                        <span><b>Protected Snaps:</b> Screenshot protection active for photos.</span>
                                    </li>
                                    <li className="flex items-center gap-3 p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                        <Users size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span><b>Community First:</b> Focused on long-term compatibility.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Join Community CTA */}
                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-8 md:p-14 text-center border border-gray-100 dark:border-gray-800 shadow-sm mb-16">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Join Our Growing Community</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
                            Whether you have feedback, feature suggestions, or just want to say hello, we'd love to hear from you. Register today and start finding matches for free!
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link href="/register?new=true" className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200/50 hover:shadow-lg hover:scale-105 cursor-pointer w-full sm:w-auto text-center">
                                Create Free Account
                            </Link>
                            <a href="mailto:lifepartnerai.in@gmail.com" className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-800 dark:text-gray-200 hover:shadow-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 group w-full sm:w-auto text-center">
                                <Mail className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" /> lifepartnerai.in@gmail.com
                            </a>
                        </div>
                    </div>

                    {/* We Are Hiring / Contact Section */}
                    <div className="text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">We Are Hiring</span>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Want to build this with me?</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6 text-sm md:text-base">
                            If you are a developer, marketer, or problem solver who wants to transform the dating and matrimony industry, reach out directly.
                        </p>
                        <p className="font-semibold text-indigo-700 dark:text-indigo-400 text-base">
                            Send your resume or say "Hi" to <a href="mailto:lifepartnerai.in@gmail.com" className="underline hover:text-indigo-600 dark:hover:text-indigo-300">lifepartnerai.in@gmail.com</a>
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
