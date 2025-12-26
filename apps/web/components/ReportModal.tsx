import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/modal'; // Assuming this exists and wraps Dialog/Portal
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Assuming exists, else standard textarea
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn select

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName?: string;
}

const REPORT_REASONS = [
    "Inappropriate Content",
    "Harassment / Bullying",
    "Scam / Fake Profile",
    "Spam",
    "Underage User",
    "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetUserId, targetUserName }) => {
    const toast = useToast();
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);

    // We don't need distinct success state in modal content if we close + toast
    // But keeping it simple for now.

    const handleSubmit = async () => {
        if (!reason) return;
        setLoading(true);
        try {
            await api.interactions.reportUser(targetUserId, reason, details);
            toast.success("Report submitted. Thank you.");
            onClose();
            // Reset form
            setDetails("");
            setReason(REPORT_REASONS[0]);
        } catch (err: any) {
            console.error("Failed to report user", err);
            toast.error(err.message || "Failed to report user. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Report ${targetUserName || 'User'}`}
            description="This report is anonymous and confidential."
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Reason
                    </label>
                    <div className="relative">
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {REPORT_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Additional Details
                    </label>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Please provide specific details..."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ReportModal;
