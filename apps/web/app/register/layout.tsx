
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Create Account | LifePartner AI",
    description: "Join the future of matchmaking. Create your free account to find compatible partners using AI.",
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
