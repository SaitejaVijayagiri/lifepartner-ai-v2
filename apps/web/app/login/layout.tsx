
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Login | LifePartner AI",
    description: "Access your account to view matches, messages, and your AI compatibility reports.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
