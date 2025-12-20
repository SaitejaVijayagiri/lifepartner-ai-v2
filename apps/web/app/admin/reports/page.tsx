'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // We'll use a direct fetch here or add api.reports.getAll()
                // Assuming api.reports.getAll doesn't exist, we'll fetch manually or through a new helper.
                // Let's use direct authorized fetch for this isolated admin page.
                const token = localStorage.getItem('token');
                if (!token) return router.push('/login');

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/reports`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setReports(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">🛡️ Trust & Safety Dashboard</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Reported User</th>
                                    <th className="px-6 py-3">Reporter</th>
                                    <th className="px-6 py-3">Reason</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                                ) : reports.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8">No reports found</td></tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {report.target_name}
                                                <div className="text-xs text-gray-400">{report.target_id}</div>
                                            </td>
                                            <td className="px-6 py-4">{report.reporter_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                    {report.reason}
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500">{report.details}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => alert(`Review User: ${report.target_id}`)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    Review
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
        </div>
    );
}
