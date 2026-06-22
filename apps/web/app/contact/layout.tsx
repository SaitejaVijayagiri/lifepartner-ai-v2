import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us | LifePartner AI',
    description: 'Get in touch with the LifePartner AI team. We are here to help you with your matrimony journey.',
    keywords: ['contact lifepartner ai', 'matrimony support', 'customer care lifepartner ai'],
    alternates: {
        canonical: 'https://lifepartnerai.in/contact',
    }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
