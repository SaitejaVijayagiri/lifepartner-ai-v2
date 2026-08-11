'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
    const shareText = encodeURIComponent("Hey! I found this amazing free matrimony app: LifePartner AI. It has zero fake profiles and it's 100% free! Check it out: https://lifepartnerai.in?utm_source=whatsapp&utm_medium=social&utm_campaign=share_float");
    const shareUrl = `https://wa.me/?text=${shareText}`;

    return (
        <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group flex items-center gap-2 overflow-hidden hover:pr-6"
            aria-label="Share on WhatsApp"
        >
            <MessageCircle size={24} fill="white" className="group-hover:animate-bounce" />
            <span className="max-w-0 group-hover:max-w-xs transition-all duration-500 overflow-hidden text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">
                Share with friends
            </span>
        </a>
    );
}
