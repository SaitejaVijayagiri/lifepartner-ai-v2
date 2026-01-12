import { CheckCircle, BadgeCheck } from 'lucide-react';

interface VerificationBadgeProps {
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function VerificationBadge({ size = 16, className = "", showTooltip = true }: VerificationBadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center text-blue-500 ${className}`}
            title={showTooltip ? "Identity Verified" : undefined}
        >
            <BadgeCheck size={size} fill="currentColor" className="text-white" />
        </span>
    );
}
