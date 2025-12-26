'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Check, X, BadgeCheck, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/Toast';

interface VerificationRequest {
    id: string;
    user_id: string;
    name: string;
    email: string;
    photo_url?: string;
    document_url?: string;
    created_at: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function VerificationPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
    const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await api.verification.getPending();
            setRequests(data);
        } catch (e) {
            console.error("Failed to fetch requests", e);
            toast.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (req: VerificationRequest, type: 'APPROVED' | 'REJECTED') => {
        setSelectedReq(req);
        setActionType(type);
        setNotes('');
        setModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedReq) return;

        try {
            await api.verification.resolve(selectedReq.id, actionType, notes);
            setRequests(prev => prev.filter(r => r.id !== selectedReq.id));
            toast.success(`Verification ${actionType.toLowerCase()}`);
            setModalOpen(false);
        } catch (e) {
            console.error("Failed to resolve", e);
            toast.error("Failed to update status.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading requests...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Verification Requests</h1>
                    <p className="text-sm text-gray-500">Review pending profile verifications</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium">
                    {requests.length} Pending
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <BadgeCheck className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900">All Caught Up</h3>
                    <p className="text-gray-500">No pending verification requests.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            {/* User Info */}
                            <div className="flex items-center gap-4 min-w-[250px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={req.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user_id}`}
                                    alt="User"
                                    className="w-16 h-16 rounded-full object-cover bg-gray-100"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">{req.name || "Unknown User"}</h3>
                                    <p className="text-sm text-gray-500">{req.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Applied: {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Document Proof */}
                            <div className="flex-1 bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                                <FileText className="text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Submitted Document</p>
                                    <a href={req.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                        View Document (External Link)
                                    </a>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 self-start md:self-center">
                                <Button
                                    onClick={() => openActionModal(req, 'APPROVED')}
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    <Check size={16} /> Approve
                                </Button>
                                <Button
                                    onClick={() => openActionModal(req, 'REJECTED')}
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                >
                                    <X size={16} /> Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={actionType === 'APPROVED' ? 'Approve Verification' : 'Reject Verification'}
                description={`Are you sure you want to ${actionType.toLowerCase()} ${selectedReq?.name}'s request?`}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmAction}
                            className={actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        {actionType === 'APPROVED' ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}
                    </label>
                    <textarea
                        className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={actionType === 'APPROVED' ? "Verified ID matches profile..." : "Document is blurry / invalid..."}
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}
