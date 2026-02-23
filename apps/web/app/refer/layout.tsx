import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refer a Friend | LifePartner AI',
    description: 'Invite friends to LifePartner AI and earn free coins. Give 20 coins, get 50 coins instantly when they join.',
    keywords: ['referral program', 'free matrimony coins', 'lifepartner ai refer']
};

export default function ReferLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
