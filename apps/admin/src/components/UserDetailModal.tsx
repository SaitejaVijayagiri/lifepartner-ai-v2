import { Modal } from '@/components/ui/modal'; // Assuming standard modal
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast'; // Assuming useToast hook
import { useState } from 'react';

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any; // Full user object with profile
    onBanToggle?: (id: string, currentStatus: boolean) => void;
}

export default function UserDetailModal({ isOpen, onClose, user, onBanToggle }: UserDetailModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleBan = async () => {
        if (!onBanToggle) return;
        setLoading(true);
        await onBanToggle(user.id, user.is_banned);
        setLoading(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Verify User: ${user.name || 'Unknown'}`}
            description={`Joined: ${new Date(user.created_at).toLocaleDateString()}`}
            footer={
                <div className="flex justify-between w-full">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {onBanToggle && (
                        <Button
                            variant={user.is_banned ? "primary" : "destructive"}
                            onClick={handleBan}
                            disabled={loading}
                        >
                            {user.is_banned ? "Restore Access (Unban)" : "Ban User"}
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* 1. Photos */}
                {user.profile?.photos && user.profile.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {user.profile.photos.map((photo: string, idx: number) => (
                            <img key={idx} src={photo} alt="Profile" className="w-full h-32 object-cover rounded-lg border" />
                        ))}
                    </div>
                ) : (
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No Photos Uploaded
                    </div>
                )}

                {/* 2. Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Email</span>
                        <span className="font-medium text-gray-800 break-all">{user.email}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Phone</span>
                        <span className="font-medium text-gray-800">{user.phone || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Location</span>
                        <span className="font-medium text-gray-800">{user.location_name || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Age / Gender</span>
                        <span className="font-medium text-gray-800">{user.age || 'N/A'} / {user.gender || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Status</span>
                        <span className={`font-bold ${user.is_banned ? 'text-red-600' : 'text-green-600'}`}>
                            {user.is_banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Verified</span>
                        <span className={`font-bold ${user.is_verified ? 'text-blue-600' : 'text-gray-400'}`}>
                            {user.is_verified ? 'YES' : 'NO'}
                        </span>
                    </div>
                </div>

                {/* 3. Bio */}
                <div>
                    <span className="block text-gray-500 text-xs uppercase mb-1">Bio / Prompt</span>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm italic">
                        {user.profile?.raw_prompt || "No bio available."}
                    </p>
                </div>

                {/* 4. Stats */}
                <div className="flex gap-4 pt-2 border-t mt-4">
                    <div className="text-center">
                        <div className="text-xl font-bold text-gray-800">{user.likes_received || 0}</div>
                        <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{user.reports?.length || 0}</div>
                        <div className="text-xs text-gray-500">Reports</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
