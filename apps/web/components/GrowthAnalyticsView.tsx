// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Heart,
    TrendingUp,
    ShieldCheck,
    MessageSquare,
    Globe2,
    Calendar,
    ArrowUpRight,
    Sparkles,
    Lock,
    UserCheck,
    Activity,
    Compass,
    Share2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { fetchAPI } from '@/lib/api';

interface GrowthAnalyticsViewProps {
    initialMetrics?: any;
}

const TRAFFIC_COLORS: Record<string, string> = {
    google_organic: '#10b981', // Emerald
    instagram: '#ec4899',      // Pink
    referral: '#8b5cf6',       // Purple
    direct: '#3b82f6',         // Blue
    other: '#94a3b8'           // Slate
};

export default function GrowthAnalyticsView({ initialMetrics }: GrowthAnalyticsViewProps) {
    const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [metrics, setMetrics] = useState<any>(initialMetrics || null);
    const [loading, setLoading] = useState(!initialMetrics);

    useEffect(() => {
        loadMetrics(range);
    }, [range]);

    const loadMetrics = async (selectedRange: '7d' | '30d' | '90d' | 'all') => {
        setLoading(true);
        try {
            const data = await fetchAPI(`/analytics/growth-metrics?range=${selectedRange}`);
            if (data && data.success) {
                setMetrics(data);
            }
        } catch (e) {
            console.error('Failed to load growth metrics', e);
        } finally {
            setLoading(false);
        }
    };

    const summary = metrics?.summary || {};
    const activity = metrics?.activity || {};
    const funnel = metrics?.funnel || {};
    const rates = funnel?.rates || {};
    const acquisition = metrics?.acquisition || {};
    const retention = metrics?.retention || {};
    const timeSeries = metrics?.timeSeries || [];

    // Funnel Chart Data
    const funnelChartData = [
        { stage: 'Landing Visits', count: funnel.landingVisits || 0, fill: '#3b82f6' },
        { stage: 'Reg Started', count: funnel.registrationsStarted || 0, fill: '#6366f1' },
        { stage: 'Reg Completed', count: funnel.registrationsCompleted || 0, fill: '#8b5cf6' },
        { stage: 'Profile Complete', count: funnel.profilesCompleted || 0, fill: '#d946ef' },
        { stage: 'First Chat Sent', count: funnel.firstMessagesSent || 0, fill: '#ec4899' },
        { stage: 'Chat Replied', count: funnel.firstRepliesReceived || 0, fill: '#f43f5e' }
    ];

    // Traffic Sources Pie Data
    const trafficPieData = (acquisition.trafficSources || []).map((t: any) => ({
        name: t.source,
        value: t.count || 1,
        color: TRAFFIC_COLORS[t.key] || '#64748b',
        percentage: t.percentage || 0
    }));

    return (
        <div className="space-y-8">
            {/* 1. Header with Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-indigo-900/40">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
                        <Sparkles size={13} className="text-pink-400" />
                        <span>Product Growth & Funnel Analytics</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Growth & Acquisition Engine</h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                        Comprehensive funnel, female user acquisition, conversion drop-off, and traffic attribution.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 self-start sm:self-auto">
                    {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                range === r
                                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                        >
                            {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All-Time'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Registrations */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            Total Registrations
                            <Users className="w-4 h-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {(summary.totalUsers || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="font-semibold text-rose-500">👰 {summary.femaleUsers || 0} Female</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-indigo-500">🤵 {summary.maleUsers || 0} Male</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Primary Objective: Active Female Users */}
                <Card className="rounded-3xl border-pink-200 dark:border-pink-900/50 bg-gradient-to-br from-pink-50/50 via-white to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center justify-between">
                            Female User Ratio (Core)
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-pink-600 dark:text-pink-400">
                            {summary.femalePercentage || 0}%
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <span className="font-bold text-pink-600">{activity.femaleWau || 0}</span> weekly active female users
                        </p>
                    </CardContent>
                </Card>

                {/* Engagement: WAU & MAU */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            Active Users (WAU / MAU)
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                            <span>{activity.wau || 0}</span>
                            <span className="text-sm font-semibold text-slate-400">/ {activity.mau || 0} MAU</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {summary.totalUsers > 0 ? Math.round(((activity.wau || 0) / summary.totalUsers) * 100) : 0}% 7-day platform stickiness
                        </p>
                    </CardContent>
                </Card>

                {/* Profile Completion */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            Profile Completion Rate
                            <UserCheck className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {summary.profileCompletionRate || 0}%
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {summary.completedProfilesCount || 0} fully onboarded profiles
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Conversion Funnel Efficiency Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Registration Conversion</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">{rates.registrationConversionRate || 0}%</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Visits → Signup</span>
                </div>
                <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">First-Message Conversion</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">{rates.firstMessageConversionRate || 0}%</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Profiles → 1st Chat</span>
                </div>
                <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Conversation Response Rate</span>
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{rates.conversationResponseRate || 0}%</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Replies received</span>
                </div>
                <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">7-Day User Retention</span>
                    <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{retention.day7 || 0}%</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">30-Day: {retention.day30 || 0}%</span>
                </div>
            </div>

            {/* 4. Growth & Acquisition Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Time-Series Stacked Area Chart */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>Registration Trends by Gender</span>
                            <Badge variant="outline" className="text-xs font-normal">
                                {range === '7d' ? 'Past 7 Days' : range === '30d' ? 'Past 30 Days' : 'Historical'}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Voluntarily declared gender breakdown over time to monitor female user acquisition.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="growthFemale" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="growthMale" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="femaleRegistrations" name="Female Signups" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#growthFemale)" />
                                    <Area type="monotone" dataKey="maleRegistrations" name="Male Signups" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#growthMale)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Acquisition Traffic Source Pie / Bar */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>Traffic Sources</span>
                            <Share2 className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Visitor acquisition breakdown from Google Organic, Instagram, Referral & Direct.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={trafficPieData}
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {trafficPieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any, name: any, item: any) => [`${val} visits (${item?.payload?.percentage ?? 0}%)`, name]}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-4">
                            {trafficPieData.map((t: any) => (
                                <div key={t.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{t.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">{t.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 5. Full Funnel Drop-off & International Country Reach */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Full Funnel Bar Chart */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>Full Acquisition & Activation Funnel</span>
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Volume of users progressing through each step from visit to active conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="stage" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Country Breakdown Table */}
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>International Country Breakdown</span>
                            <Globe2 className="w-4 h-4 text-indigo-500" />
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Distribution of registrations across key target countries (India, USA, UK, Canada, Australia).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(acquisition.countries || []).map((c: any) => (
                                <div key={c.code} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-base">
                                            {c.code === 'IN' ? '🇮🇳' : c.code === 'US' ? '🇺🇸' : c.code === 'GB' ? '🇬🇧' : c.code === 'CA' ? '🇨🇦' : c.code === 'AU' ? '🇦🇺' : c.code === 'AE' ? '🇦🇪' : c.code === 'SG' ? '🇸🇬' : '🌍'}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.country}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {c.femaleCount || 0} female users
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{c.count} users</p>
                                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{c.percentage}% share</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 6. Privacy & Data Governance Architecture Notice */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-start gap-3">
                <Lock size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 dark:text-indigo-200">
                    <p className="font-bold">Privacy-Preserving Growth Engine</p>
                    <p className="text-indigo-800 dark:text-indigo-300 mt-0.5">
                        Private message contents, personal contact numbers, and sensitive profile attributes are strictly excluded from analytics. All funnel metrics, gender counts, and geographic distributions are aggregated anonymously in compliance with DPDP and GDPR guidelines.
                    </p>
                </div>
            </div>
        </div>
    );
}
