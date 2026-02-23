import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community Lounge | LifePartner AI',
    description: 'Join the exclusive LifePartner AI Community Lounge. Connect, share stories, and find matches in a safe, verified environment.',
    keywords: ['matrimony community', 'verified singles chat', 'lifepartner ai lounge', 'safe dating community']
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
