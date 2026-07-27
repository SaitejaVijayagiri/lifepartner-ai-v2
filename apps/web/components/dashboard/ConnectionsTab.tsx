'use client';

import { MessageCircle, Trash2, Bell, BellOff, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface ConnectionsTabProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    connections: any[];
    setConnections: React.Dispatch<React.SetStateAction<any[]>>;
    onlineUsers: string[];
    openChat: (conn: any) => void;
    setGameTarget: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
    setUnreadMessageCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function ConnectionsTab({
    currentUser,
    setCurrentUser,
    connections,
    setConnections,
    onlineUsers,
    openChat,
    setGameTarget,
    setUnreadMessageCount
}: ConnectionsTabProps) {
    const toast = useToast();

    // Sort connections so online users appear at the top, preserving the recent-message order within groups
    const onlineConns = connections.filter(c => c.partner && onlineUsers.includes(c.partner.id));
    const offlineConns = connections.filter(c => c.partner && !onlineUsers.includes(c.partner.id));
    const sortedConnections = [...onlineConns, ...offlineConns];

    const handleDeleteConnection = async (e: React.MouseEvent, conn: any) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to remove this connection?")) return;
        try {
            await api.interactions.deleteConnection(conn.interactionId);
            setConnections(prev => {
                const updated = prev.filter((c: any) => c.interactionId !== conn.interactionId);
                // Update global unread message count
                const totalUnread = updated.reduce((acc: number, curr: any) => acc + (curr.unreadCount || 0), 0);
                setUnreadMessageCount(totalUnread);
                return updated;
            });
            toast.success("Connection removed");
        } catch (err) {
            toast.error("Failed to remove");
        }
    };

    const handleToggleMute = async (e: React.MouseEvent, conn: any) => {
        e.stopPropagation();
        try {
            const res = await api.profile.toggleMute(conn.partner.id);
            if (res.isMuted !== undefined) {
                const currentMuted: string[] = currentUser?.muted_users || [];
                const newMuted = res.isMuted
                    ? [...currentMuted, conn.partner.id]
                    : currentMuted.filter((id: string) => id !== conn.partner.id);
                setCurrentUser((prev: any) => ({ ...prev, muted_users: newMuted }));
                toast.success(res.isMuted ? `${conn.partner.name} muted` : `${conn.partner.name} unmuted`);
            }
        } catch (err) {
            toast.error("Failed to update mute");
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-2 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1 text-gray-900 dark:text-white">Your Connections</h2>
            {sortedConnections.length === 0 && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">No connections yet</div>
            )}
            {sortedConnections.map((conn: any) => (
                <div
                    key={conn.interactionId}
                    className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all hover:shadow-md group"
                >
                    <div
                        className="flex items-center gap-4 flex-1 cursor-pointer w-full sm:w-auto"
                        onClick={() => openChat(conn)}
                    >
                        <div className="relative">
                            <img 
                                src={conn.partner.photoUrl || '/avatar-fallback.svg'} 
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shrink-0" 
                                alt={conn.partner.name || 'User'}
                                onError={(e) => { 
                                    const t = e.target as HTMLImageElement; 
                                    t.onerror = null; 
                                    t.src = '/avatar-fallback.svg'; 
                                }} 
                            />
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${onlineUsers.includes(conn.partner.id) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                    {conn.partner.name}
                                </h4>
                                {conn.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center shadow-sm animate-pulse">
                                        {conn.unreadCount}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                {onlineUsers.includes(conn.partner.id) ? 'Online' : 'Offline'} • Click to chat
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            title="Remove Connection"
                            onClick={(e) => handleDeleteConnection(e, conn)}
                        >
                            <Trash2 size={20} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title={currentUser?.muted_users?.includes(conn.partner.id) ? "Unmute Notifications" : "Mute Notifications"}
                            className={currentUser?.muted_users?.includes(conn.partner.id)
                                ? "text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full"
                                : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full"}
                            onClick={(e) => handleToggleMute(e, conn)}
                        >
                            {currentUser?.muted_users?.includes(conn.partner.id)
                                ? <BellOff size={18} />
                                : <Bell size={18} />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Snakes & Ladders Arena + Voice Chat"
                            className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setGameTarget({ id: conn.partner.id, name: conn.partner.name });
                            }}
                        >
                            <Gamepad2 size={18} className="text-purple-600 dark:text-purple-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full"
                            onClick={() => openChat(conn)}
                        >
                            <MessageCircle size={20} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
