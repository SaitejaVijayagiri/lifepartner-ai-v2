
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Member Login | LifePartner AI",
    description: "Access your LifePartner AI account to view curated matches, reply to messages, and manage your profile securely.",
    keywords: ["matrimony login", "sign in lifepartner", "access matchmaking account"],
    alternates: {
        canonical: 'https://lifepartnerai.in/login',
    }
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
