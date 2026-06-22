
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Register Free | LifePartner AI",
    description: "Create your free matrimony account today. No paywalls, 100% verified profiles, and AI matchmaking. Join India's safest matchmaking platform.",
    keywords: ["register free matrimony", "create matrimony account", "sign up lifepartner", "free matrimonial registration"],
    alternates: {
        canonical: 'https://lifepartnerai.in/register',
    }
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
