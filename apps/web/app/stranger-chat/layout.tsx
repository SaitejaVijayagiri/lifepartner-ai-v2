import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Live Chat | LifePartner AI',
    robots: {
        index: false,
        follow: false,
    },
};

export default function StrangerChatLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
