import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, Users, Heart } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Our Mission | LifePartner AI',
    description: "Learn why we built India's first 100% Free, AI-Powered, and Transparent matchmaking platform without fake profiles or paywalls.",
    keywords: ['about lifepartner ai', 'free matrimony mission', 'saiteja founder matrimony', 'transparent matchmaking', 'no paywall matrimony']
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">Our Mission</h1>
                        <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
                            We are building India's first <b>100% Free, AI-Powered, and Transparent</b> matchmaking platform.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-start mb-20">
                        <div className="relative">
                            <img src="/images/founder.jpg" alt="Saiteja Vijayagiri" className="rounded-3xl shadow-2xl w-full border-4 border-gray-50" />
                            <div className="mt-6 text-center">
                                <h3 className="text-2xl font-bold">Saiteja Vijayagiri</h3>
                                <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">Founder & Developer</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold mb-6 text-indigo-900">Why I Built This</h3>
                            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                                <p>
                                    Like many declared "eligible bachelors/spinsters", I was frustrated with the current state of matrimony apps.
                                    They are crowded with fake profiles, scammers, and expensive subscription models that charge you just to say "Hi".
                                </p>
                                <p>
                                    <b>LifePartner AI is different.</b>
                                </p>
                                <p>
                                    I built this platform with a single goal: To use advanced technology to connect real people specifically for marriage, without the corporate greed.
                                </p>
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 mb-2">My Promise to You:</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-600" /> No Fake Profiles (Verified by Humans)</li>
                                        <li className="flex items-center gap-2"><Heart size={18} className="text-pink-600" /> No Paywalls for Matching</li>
                                        <li className="flex items-center gap-2"><Users size={18} className="text-blue-600" /> Community First Approach</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-[3rem] p-10 md:p-16 text-center border border-gray-100">
                        <h2 className="text-3xl font-bold mb-8">Join the "Founder's Circle"</h2>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                            We are currently in a <b>Concierge Phase</b>. This means I am personally vetting and listing profiles to ensure quality.
                        </p>
                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <a href="mailto:lifepartnerai.in@gmail.com" className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 hover:shadow-lg transition-all hover:bg-gray-50 group">
                                <Mail className="group-hover:text-indigo-600 transition-colors" /> lifepartnerai.in@gmail.com
                            </a>
                            <a href="tel:+919014836399" className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 border border-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                                <Phone size={20} /> +91 90148 36399
                            </a>
                        </div>
                        <p className="mt-6 text-sm text-gray-400">Call or WhatsApp anytime.</p>
                    </div>

                    <div className="mt-16 text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider mb-4">We Are Hiring</span>
                        <h3 className="text-2xl font-bold mb-4">Want to build this with me?</h3>
                        <p className="text-gray-600 max-w-xl mx-auto mb-6">
                            If you are a developer, marketer, or just a problem solver who wants to fix the broken matrimony industry, I want to hear from you.
                        </p>
                        <p className="font-medium text-indigo-900">
                            Send your resume or just say "Hi" to <a href="mailto:lifepartnerai.in@gmail.com" className="underline hover:text-indigo-600">lifepartnerai.in@gmail.com</a>
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
