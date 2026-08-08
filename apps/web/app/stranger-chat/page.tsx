import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Radio, Users, Shield, Sparkles, MessageCircle, Video, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import GlobalViewsBadge from '@/components/GlobalViewsBadge';

export const metadata: Metadata = {
    title: "Free Online Chat with Strangers & Random Video Chat - Omegle Alternative | LifePartner AI",
    description: "Talk to random strangers online for 100% Free with zero registration fees. LifePartner AI is the #1 Omegle Alternative with verified live video chat, instant 1-on-1 roulette, and global single chat rooms worldwide.",
    keywords: [
        "online chat with strangers",
        "talk to strangers free",
        "chat with random people",
        "omegle alternative free",
        "free random video chat",
        "chat with single girls online",
        "talk to international guys",
        "omeTV alternative",
        "emerald chat alternative",
        "random video call online"
    ],
    openGraph: {
        title: "Free Online Chat with Strangers & Omegle Alternative - LifePartner AI",
        description: "Instant 3-minute video dating & random stranger chat. 100% Verified profiles with zero spam. Connect with singles worldwide for free.",
        url: "https://lifepartnerai.in/stranger-chat",
        images: ["https://lifepartnerai.in/og-image.jpg"],
    },
    alternates: {
        canonical: "https://lifepartnerai.in/stranger-chat",
    }
};

export default function StrangerChatLandingPage() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is LifePartner AI stranger chat 100% free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! LifePartner AI offers 100% free stranger chat, random 1-on-1 video dates, and matrimony matchmaking with no payment required."
                }
            },
            {
                "@type": "Question",
                "name": "How is LifePartner AI safer than Omegle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unlike Omegle, LifePartner AI uses AI moderation, verified user profiles, and active safety overlays with 1-click SOS to prevent bots and fake users."
                }
            },
            {
                "@type": "Question",
                "name": "Can I chat with international guys and single girls worldwide?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, LifePartner AI connects verified singles from over 85+ countries including USA, UK, Canada, Australia, India, and UAE."
                }
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-rose-500 selection:text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* 1. HERO SECTION */}
            <section className="relative pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
                        <Radio size={14} className="animate-pulse" />
                        <span>#1 Free Omegle & OmeTV Alternative Worldwide</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Talk to Strangers & <br className="hidden sm:inline" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-300 to-indigo-400">
                            Random Live Video Chat
                        </span>
                    </h1>

                    <p className="text-gray-300 text-base sm:text-xl max-w-3xl mx-auto font-normal leading-relaxed">
                        Connect with verified singles worldwide for 100% Free. Enjoy instant 3-minute video roulette, global text lounge, and verified matrimony matchmaking with zero payment required.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-xl shadow-rose-500/30 transition-all hover:scale-105">
                                <Video className="mr-2" size={20} />
                                Start Random Video Chat Now
                            </Button>
                        </Link>

                        <Link href="/register" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/20 hover:bg-white/10 text-white font-bold text-base transition-all">
                                Create Free Verified Profile
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-400 font-semibold">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> 100% Free Chat</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> AI Bot Filtering</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> Verified Singles Only</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> 85+ Countries</span>
                    </div>
                </div>
            </section>

            {/* LIVE VIEWS BADGE */}
            <GlobalViewsBadge />

            {/* 2. FEATURES GRID */}
            <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why LifePartner AI Beats Omegle & Emerald Chat</h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">Designed for real human connections with strict safety rules, high-definition WebRTC video streaming, and smart gender filtering.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <Video size={24} />
                        </div>
                        <h3 className="text-lg font-extrabold text-white">3-Minute Video Roulette</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">Instantly match face-to-face with single men and women in HD video calls. Extend time if mutual interest is met!</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-lg font-extrabold text-white">AI Photo & Anti-Bot Protection</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">No fake profiles, bots, or malicious scripts. AI monitors image health and user authenticity 24/7.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <MessageCircle size={24} />
                        </div>
                        <h3 className="text-lg font-extrabold text-white">Global Community Lounge</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">Join open global chat channels with singles from USA, India, UK, Canada, Australia, and Singapore.</p>
                    </div>
                </div>
            </section>

            {/* 3. FAQ SECTION FOR GOOGLE SEO */}
            <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-slate-800">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-8">Frequently Asked Questions</h2>
                <div className="space-y-4 text-xs sm:text-sm">
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <h3 className="font-bold text-white text-base">Is this stranger chat app completely free?</h3>
                        <p className="text-gray-400">Yes! LifePartner AI offers free unlimited stranger chat, live video roulette, and matrimony profile browsing without mandatory subscription fees.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <h3 className="font-bold text-white text-base">How does it compare to Omegle and OmeTV?</h3>
                        <p className="text-gray-400">Unlike unmoderated video chat sites, LifePartner AI incorporates verified user profiles, AI moderation, emergency SOS overlay tools, and intention-based matchmaking.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <h3 className="font-bold text-white text-base">Can I select specific gender filters?</h3>
                        <p className="text-gray-400">Yes! Hosts and participants can choose preference filters (Female only, Male only, or Everyone) when creating or joining live video speed dating rooms.</p>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER CTA */}
            <section className="py-20 text-center px-4 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Meet Someone New Today?</h2>
                    <p className="text-gray-400 text-sm sm:text-base">Join over 10,000+ verified singles online right now. Start chatting in less than 10 seconds!</p>
                    <Link href="/dashboard">
                        <Button size="lg" className="h-14 px-10 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-2xl shadow-rose-500/25 transition-all hover:scale-105">
                            Launch Free Live Chat <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
