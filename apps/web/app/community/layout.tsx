import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community Lounge & Meetups | LifePartner AI',
    description: 'Join the exclusive LifePartner AI Community Lounge. Connect, RSVP to local Meetups, and find matches in a safe, verified environment.',
    keywords: ['matrimony community', 'verified singles chat', 'lifepartner ai lounge', 'safe dating community', 'singles meetups', 'local offline events'],
    alternates: {
        canonical: 'https://lifepartnerai.in/community',
    }
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
