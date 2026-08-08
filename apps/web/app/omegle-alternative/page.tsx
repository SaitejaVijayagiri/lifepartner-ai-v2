import { Metadata } from 'next';
import StrangerChatLandingPage from '../stranger-chat/page';

export const metadata: Metadata = {
    title: "Best Free Omegle Alternative 2026 - Random Video Chat with Strangers | LifePartner AI",
    description: "Looking for a safe Omegle alternative? LifePartner AI offers free random video chat with verified singles worldwide, zero subscription fees, and active AI safety filters.",
    keywords: [
        "omegle alternative",
        "best omegle alternative free",
        "talk to strangers video chat",
        "omeTV alternative online",
        "emerald chat alternative",
        "random video call website",
        "free online chat without login"
    ],
    openGraph: {
        title: "Best Free Omegle Alternative - LifePartner AI",
        description: "Talk to strangers & meet verified singles in instant live video roulette.",
        url: "https://lifepartnerai.in/omegle-alternative",
        images: ["https://lifepartnerai.in/og-image.jpg"],
    },
    alternates: {
        canonical: "https://lifepartnerai.in/omegle-alternative",
    }
};

export default function OmegleAlternativePage() {
    return <StrangerChatLandingPage />;
}
