import { BadgeCheck } from 'lucide-react';

interface VerificationBadgeProps {
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function VerificationBadge({ size = 16, className = "", showTooltip = true }: VerificationBadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center ${className}`}
            title={showTooltip ? "Selfie Verified" : undefined}
        >
            <BadgeCheck size={size} fill="#2563EB" className="text-white" />
        </span>
    );
}
