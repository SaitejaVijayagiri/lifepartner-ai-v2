import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community Lounge & Meet Spots | LifePartner AI',
    description: 'Join the exclusive LifePartner AI Community Lounge. Connect, RSVP to local Meet Spots, and find matches in a safe, verified environment.',
    keywords: ['matrimony community', 'verified singles chat', 'lifepartner ai lounge', 'safe dating community', 'singles meetups', 'local offline events']
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
