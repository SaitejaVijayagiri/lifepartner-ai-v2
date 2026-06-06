import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Mail, Users, Heart } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Our Mission | LifePartner AI',
    description: "Learn why we built India's first 100% Free, AI-Powered, and Transparent matchmaking platform without fake profiles or paywalls.",
    keywords: ['about lifepartner ai', 'free matrimony mission', 'saiteja founder matrimony', 'transparent matchmaking', 'no paywall matrimony']
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                            We are building India's first <b>100% Free, AI-Powered, and Transparent</b> matchmaking platform.
                        </p>
                    </div>

                    <div className="mb-20">
                        <div>
                            <h3 className="text-3xl font-bold mb-6 text-indigo-900 dark:text-indigo-400">Why I Built This</h3>
                            <div className="space-y-6 text-lg text-gray-750 dark:text-gray-300 leading-relaxed">
                                <p>
                                    Like many declared "eligible bachelors/spinsters", I was frustrated with the current state of dating and matrimony apps.
                                    They are crowded with fake profiles, swipe fatigue, scammers, and expensive subscription models that charge you just to say "Hi".
                                </p>
                                <p>
                                    <b>LifePartner AI is different.</b>
                                </p>
                                <p>
                                    I built this platform with a single goal: To use advanced technology to connect real people for meaningful dating, serious relationships, and marriage—without the corporate greed.
                                </p>
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">My Promise to You:</h4>
                                    <ul className="space-y-2 text-gray-750 dark:text-gray-300">
                                        <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-600 dark:text-green-400" /> No Fake Profiles (Verified by Humans)</li>
                                        <li className="flex items-center gap-2"><Heart size={18} className="text-pink-600 dark:text-pink-400" /> No Paywalls for Matching</li>
                                        <li className="flex items-center gap-2"><Users size={18} className="text-blue-600 dark:text-blue-400" /> Community First Approach</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-[3rem] p-10 md:p-16 text-center border border-gray-100 dark:border-gray-800">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Join Our Community</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                            Whether you have feedback, feature suggestions, or just want to say hello, we'd love to hear from you. Register today and start finding matches for free!
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link href="/register?new=true" className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200/50 hover:shadow-lg hover:scale-105 cursor-pointer w-full sm:w-auto">
                                Create Free Account
                            </Link>
                            <a href="mailto:lifepartnerai.in@gmail.com" className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-850 dark:text-gray-200 hover:shadow-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 group w-full sm:w-auto">
                                <Mail className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" /> lifepartnerai.in@gmail.com
                            </a>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">We Are Hiring</span>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Want to build this with me?</h3>
                        <p className="text-gray-650 dark:text-gray-400 max-w-xl mx-auto mb-6">
                            If you are a developer, marketer, or just a problem solver who wants to fix the broken dating and matrimony industry, I want to hear from you.
                        </p>
                        <p className="font-medium text-indigo-900 dark:text-indigo-400">
                            Send your resume or just say "Hi" to <a href="mailto:lifepartnerai.in@gmail.com" className="underline hover:text-indigo-600 dark:hover:text-indigo-300">lifepartnerai.in@gmail.com</a>
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
