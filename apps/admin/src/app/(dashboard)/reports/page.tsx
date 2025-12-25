'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle, XCircle } from 'lucide-react';

interface Report {
    id: string;
    target_id: string;
    reporter_id: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reporter_name?: string;
    reported_name?: string;
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getReports();
            setReports(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string, status: string) => {
        try {
            await api.admin.resolveReport(id, status);
            toast.success(`Report marked as ${status}`);
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
        } catch (e) {
            toast.error("Action Failed");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Reported User</th>
                                <th className="p-4 font-semibold text-gray-600">Reason</th>
                                <th className="p-4 font-semibold text-gray-600">Reporter</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && reports.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No reports found.</td></tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">
                                            {report.reported_name || 'Unknown'}
                                            <div className="text-xs text-gray-400 font-normal">{report.target_id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-xs">{report.reason}</td>
                                        <td className="p-4 text-gray-500">{report.reporter_name || 'Anonymous'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                report.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {report.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleResolve(report.id, 'resolved')}
                                                className="text-green-600 hover:text-green-700" title="Resolve (Take Action)"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleResolve(report.id, 'dismissed')}
                                                className="text-gray-400 hover:text-gray-600" title="Dismiss"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
