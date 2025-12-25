'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/Toast";

export default function RequestVerificationButton() {
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'REJECTED' | 'APPROVED'>('IDLE');
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await api.verification.getStatus();
            if (res.isVerified) {
                setStatus('APPROVED');
            } else if (res.request) {
                setStatus(res.request.status as any);
            } else {
                setStatus('IDLE');
            }
        } catch (e) {
            console.error("Failed to check verification status", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async () => {
        const confirmed = window.confirm("Requesting verification will notify the admin to review your profile. Continue?");
        if (!confirmed) return;

        setLoading(true);
        try {
            await api.verification.request();
            setStatus('PENDING');
            toast.success("Request Sent! Admin will review shortly.");
        } catch (e: any) {
            toast.error(e.message || "Request Failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Or spinner

    if (status === 'APPROVED') return null; // Already shown in badge

    if (status === 'PENDING') {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-amber-600 border-amber-200 bg-amber-50">
                <Clock size={16} /> Pending Review
            </Button>
        );
    }

    if (status === 'REJECTED') {
        return (
            <Button onClick={handleRequest} variant="outline" size="sm" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                <AlertCircle size={16} /> Rejected (Retry?)
            </Button>
        );
    }

    return (
        <Button onClick={handleRequest} variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
            <BadgeCheck size={16} /> Get Verified
        </Button>
    );
}
