import Link from 'next/link';
import { Twitter, Instagram, Linkedin, Facebook, Youtube, Heart } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                {/* Brand Column */}
                <div className="md:col-span-1">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                        LifePartner AI
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Revolutionizing matchmaking with AI that understands your values, not just your bio data.
                    </p>
                </div>

                {/* Company Column */}
                <div>
                    <h4 className="font-bold text-lg mb-4 text-gray-100">Company</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                        <li><Link href="/careers" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
                        <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                        <li><Link href="/blog" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                    </ul>
                </div>

                {/* Legal Column */}
                <div>
                    <h4 className="font-bold text-lg mb-4 text-gray-100">Legal</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-indigo-400 transition-colors">Refund & Cancellation Policy</Link></li>
                        <li><Link href="/safety" className="hover:text-indigo-400 transition-colors">Safety Tips</Link></li>
                        <li><Link href="/guidelines" className="hover:text-indigo-400 transition-colors">Community Guidelines</Link></li>
                    </ul>
                </div>

                {/* Social Column */}
                <div>
                    <h4 className="font-bold text-lg mb-4 text-gray-100">Connect</h4>
                    <div className="flex gap-4 mb-6">
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition-colors group">
                            <Twitter size={20} className="text-gray-300 group-hover:text-white" />
                        </a>
                        <a href="https://www.instagram.com/lifepartnerai.in?utm_source=qr&igsh=MXVrdGhpeWd0ZHNkMw==" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-pink-600 transition-colors group">
                            <Instagram size={20} className="text-gray-300 group-hover:text-white" />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors group">
                            <Linkedin size={20} className="text-gray-300 group-hover:text-white" />
                        </a>
                        <a href="https://www.youtube.com/@lifepartnerai" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-red-600 transition-colors group">
                            <Youtube size={20} className="text-gray-300 group-hover:text-white" />
                        </a>
                    </div>
                    <p className="text-gray-500 text-xs">
                        Follow us for success stories and dating tips.
                    </p>
                </div>
            </div>

            {/* Programmatic SEO Links Section */}
            <div className="border-t border-gray-800 pt-8 mt-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-xs text-gray-400 max-w-6xl mx-auto">
                <div>
                    <h5 className="font-bold text-gray-200 mb-3 uppercase tracking-wider">Matrimony by City</h5>
                    <ul className="space-y-1.5">
                        <li><Link href="/matrimony/location/bangalore" className="hover:text-indigo-400 transition-colors">Bangalore Matrimony</Link></li>
                        <li><Link href="/matrimony/location/mumbai" className="hover:text-indigo-400 transition-colors">Mumbai Matrimony</Link></li>
                        <li><Link href="/matrimony/location/delhi" className="hover:text-indigo-400 transition-colors">Delhi Matrimony</Link></li>
                        <li><Link href="/matrimony/location/hyderabad" className="hover:text-indigo-400 transition-colors">Hyderabad Matrimony</Link></li>
                        <li><Link href="/matrimony/location/chennai" className="hover:text-indigo-400 transition-colors">Chennai Matrimony</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-gray-200 mb-3 uppercase tracking-wider">Dating by City</h5>
                    <ul className="space-y-1.5">
                        <li><Link href="/dating/location/bangalore" className="hover:text-indigo-400 transition-colors">Dating in Bangalore</Link></li>
                        <li><Link href="/dating/location/mumbai" className="hover:text-indigo-400 transition-colors">Dating in Mumbai</Link></li>
                        <li><Link href="/dating/location/delhi" className="hover:text-indigo-400 transition-colors">Dating in Delhi</Link></li>
                        <li><Link href="/dating/location/hyderabad" className="hover:text-indigo-400 transition-colors">Dating in Hyderabad</Link></li>
                        <li><Link href="/dating/location/chennai" className="hover:text-indigo-400 transition-colors">Dating in Chennai</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-gray-200 mb-3 uppercase tracking-wider">Top Communities</h5>
                    <ul className="space-y-1.5">
                        <li><Link href="/matrimony/community/reddy" className="hover:text-indigo-400 transition-colors">Reddy Matrimony</Link></li>
                        <li><Link href="/dating/community/kamma" className="hover:text-indigo-400 transition-colors">Kamma Dating</Link></li>
                        <li><Link href="/matrimony/community/brahmin" className="hover:text-indigo-400 transition-colors">Brahmin Matrimony</Link></li>
                        <li><Link href="/dating/community/nair" className="hover:text-indigo-400 transition-colors">Nair Dating & Chat</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-gray-200 mb-3 uppercase tracking-wider">By Profession</h5>
                    <ul className="space-y-1.5">
                        <li><Link href="/dating/profession/software-engineer" className="hover:text-indigo-400 transition-colors">Software Engineer Dating</Link></li>
                        <li><Link href="/matrimony/profession/doctor" className="hover:text-indigo-400 transition-colors">Doctor Matrimony</Link></li>
                        <li><Link href="/dating/profession/ias-ips" className="hover:text-indigo-400 transition-colors">IAS/IPS Matches</Link></li>
                        <li><Link href="/matrimony/profession/teacher" className="hover:text-indigo-400 transition-colors">Teacher Matrimony</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-gray-200 mb-3 uppercase tracking-wider">Trending Dating</h5>
                    <ul className="space-y-1.5">
                        <li><Link href="/dating/location/pune" className="hover:text-indigo-400 transition-colors">Dating in Pune</Link></li>
                        <li><Link href="/dating/location/kolkata" className="hover:text-indigo-400 transition-colors">Dating in Kolkata</Link></li>
                        <li><Link href="/dating/location/jaipur" className="hover:text-indigo-400 transition-colors">Dating in Jaipur</Link></li>
                        <li><Link href="/dating/location/lucknow" className="hover:text-indigo-400 transition-colors">Dating in Lucknow</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-8 mt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto">
                <p className="text-gray-500 text-sm">
                    © {currentYear} LifePartner AI. All rights reserved.
                </p>
                <p className="text-gray-600 text-xs flex items-center gap-1 mt-2 md:mt-0">
                    Made with <Heart size={12} className="text-red-500 fill-red-500" /> globally
                </p>
            </div>
        </footer>
    );
}
