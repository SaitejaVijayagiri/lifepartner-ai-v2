import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2, X } from 'lucide-react';

interface ConnectionsModalProps {
    connections: any[];
    onClose: () => void;
    onDelete: (id: string) => void;
    onChat: (conn: any) => void;
}

const ConnectionsModal = ({ connections, onClose, onDelete, onChat }: ConnectionsModalProps) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Manage Connections</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-900 dark:text-gray-100" />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {connections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No connections yet.</div>
                    ) : (
                        connections.map((c: any) => (
                            <div key={c.interactionId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <img src={c.partner.photoUrl} className="w-12 h-12 rounded-full object-cover border border-white shadow-sm" alt="" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.partner.name || 'U')}`;
                                    }} />
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{c.partner.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.partner.role || 'Member'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 relative" onClick={() => onChat(c)}>
                                        <MessageCircle size={16} />
                                        {c.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                                {c.unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                        onClick={() => onDelete(c.interactionId)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                    <Button className="w-full" onClick={onClose}>Done</Button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionsModal;
