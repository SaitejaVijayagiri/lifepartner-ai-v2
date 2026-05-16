'use client';

import { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { RELIGION_SYMBOLS } from '@/lib/religionUtils';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters?: FilterState;
}

export interface FilterState {
    ageRange: [number, number];
    heightRange: [number, number]; // inches
    religions: string[];
    diet: string | null;
    smoking: string | null;
    drinking: string | null;
    education: string[];
    maritalStatus: string[];
    motherTongue: string[];
    location: string;
    minIncome: number | null;
    caste: string;
}

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'];
const MOTHER_TONGUES = ['Assamese', 'Bengali', 'Bhojpuri', 'Bodo', 'Chhattisgarhi', 'Dogri', 'English', 'Gujarati', 'Haryanvi', 'Hindi', 'Kannada', 'Kashmiri', 'Khasi', 'Konkani', 'Kumaoni', 'Ladakhi', 'Maithili', 'Malayalam', 'Manipuri (Meitei)', 'Marathi', 'Mizo', 'Nagamese', 'Nepali', 'Odia', 'Punjabi', 'Rajasthani', 'Sanskrit', 'Santali', 'Sindhi', 'Tamil', 'Telugu', 'Tulu', 'Urdu', 'Other'];
const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'];
const EDUCATION = ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Professional Degree'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];

const DEFAULT_FILTERS: FilterState = {
    ageRange: [21, 45],
    heightRange: [54, 78], // 4'6" to 6'6"
    religions: [],
    diet: null,
    smoking: null,
    drinking: null,
    education: [],
    maritalStatus: [],
    motherTongue: [],
    location: '',
    minIncome: null,
    caste: '',
};

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters || DEFAULT_FILTERS);
    const [expandedSections, setExpandedSections] = useState<string[]>(['age', 'religion']);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const formatHeight = (inches: number) => {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}'${remainingInches}"`;
    };

    const toggleArrayFilter = (key: keyof FilterState, value: string) => {
        const current = filters[key] as string[];
        if (current.includes(value)) {
            setFilters({ ...filters, [key]: current.filter(v => v !== value) });
        } else {
            setFilters({ ...filters, [key]: [...current, value] });
        }
    };

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
            >
                <span className="font-semibold text-gray-800 dark:text-gray-200">{title}</span>
                {expandedSections.includes(id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.includes(id) && (
                <div className="px-4 pb-4 pt-0">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div
            className={`fixed inset-0 z-[1100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose} 
            />

            <div
                className={`bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 z-10 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white rounded-t-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                                <Filter size={22} className="text-white" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h3 className="font-bold text-lg leading-tight">Filter Matches</h3>
                                <p className="text-white/80 text-xs font-medium">Find your perfect match</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors active:scale-95">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter Sections */}
                <div className="flex-1 overflow-y-auto">
                    {/* Age Range */}
                    <Section id="age" title="Age Range">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block font-medium">Min Age</label>
                                    <select
                                        value={filters.ageRange[0]}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFilters({ ...filters, ageRange: [val, Math.max(val, filters.ageRange[1])] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-900 text-sm"
                                    >
                                        {Array.from({ length: 43 }, (_, i) => 18 + i).map(age => (
                                            <option key={age} value={age}>{age}</option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-gray-400 dark:text-gray-500 font-medium pt-4">—</span>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block font-medium">Max Age</label>
                                    <select
                                        value={filters.ageRange[1]}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFilters({ ...filters, ageRange: [Math.min(filters.ageRange[0], val), val] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-900 text-sm"
                                    >
                                        {Array.from({ length: 43 }, (_, i) => 18 + i).map(age => (
                                            <option key={age} value={age}>{age}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Visual Range Bar */}
                            <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm"
                                    style={{
                                        left: `${((filters.ageRange[0] - 18) / 42) * 100}%`,
                                        width: `${((filters.ageRange[1] - filters.ageRange[0]) / 42) * 100}%`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
                                <span>18 y/o</span>
                                <span className="text-indigo-600 font-semibold">{filters.ageRange[0]} - {filters.ageRange[1]} years</span>
                                <span>60 y/o</span>
                            </div>
                        </div>
                    </Section>

                    {/* Height Range */}
                    <Section id="height" title="Height Range">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">Min Height</label>
                                    <select
                                        value={filters.heightRange[0]}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFilters({ ...filters, heightRange: [val, Math.max(val + 1, filters.heightRange[1])] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-900"
                                    >
                                        {Array.from({ length: 37 }, (_, i) => 48 + i).map(inches => (
                                            <option key={inches} value={inches}>{formatHeight(inches)}</option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-gray-400 dark:text-gray-500 font-medium">—</span>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">Max Height</label>
                                    <select
                                        value={filters.heightRange[1]}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFilters({ ...filters, heightRange: [Math.min(filters.heightRange[0], val - 1), val] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-900"
                                    >
                                        {Array.from({ length: 37 }, (_, i) => 48 + i).map(inches => (
                                            <option key={inches} value={inches}>{formatHeight(inches)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Visual Range Bar */}
                            <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm"
                                    style={{
                                        left: `${((filters.heightRange[0] - 48) / 36) * 100}%`,
                                        width: `${((filters.heightRange[1] - filters.heightRange[0]) / 36) * 100}%`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
                                <span>4'0"</span>
                                <span className="text-indigo-600 font-semibold">{formatHeight(filters.heightRange[0])} - {formatHeight(filters.heightRange[1])}</span>
                                <span>7'0"</span>
                            </div>
                        </div>
                    </Section>

                    {/* Expanded Filters */}

                    {/* Location */}
                    <Section id="location" title="Location & Income">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">Preferred City / State</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mumbai or Maharashtra"
                                    value={filters.location || ''}
                                    onChange={e => setFilters({ ...filters, location: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">Min Annual Income (LPA)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 10 (Lakhs)"
                                    value={filters.minIncome || ''}
                                    onChange={e => setFilters({ ...filters, minIncome: e.target.value ? parseFloat(e.target.value) : null })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Mother Tongue */}
                    <Section id="language" title="Mother Tongue">
                        <div className="flex flex-wrap gap-2">
                            {MOTHER_TONGUES.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => toggleArrayFilter('motherTongue', lang)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.motherTongue.includes(lang)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Religion & Caste */}
                    <Section id="religion" title="Religion & Caste">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {RELIGIONS.map(religion => (
                                    <button
                                        key={religion}
                                        onClick={() => toggleArrayFilter('religions', religion)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.religions.includes(religion)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                            }`}
                                    >
                                        {RELIGION_SYMBOLS[religion] || ''} {religion}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">Caste Preference (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Brahmin"
                                    value={filters.caste || ''}
                                    onChange={e => setFilters({ ...filters, caste: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Diet */}
                    <Section id="diet" title="Diet Preference">
                        <div className="flex flex-wrap gap-2">
                            {DIETS.map(diet => (
                                <button
                                    key={diet}
                                    onClick={() => setFilters({ ...filters, diet: filters.diet === diet ? null : diet })}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.diet === diet
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                        }`}
                                >
                                    {diet}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Lifestyle */}
                    <Section id="lifestyle" title="Lifestyle">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2 font-medium">Smoking</p>
                                <div className="flex gap-2">
                                    {['No', 'Occasionally', 'Yes'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, smoking: filters.smoking === opt ? null : opt })}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.smoking === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2 font-medium">Drinking</p>
                                <div className="flex gap-2">
                                    {['No', 'Occasionally', 'Yes'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, drinking: filters.drinking === opt ? null : opt })}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.drinking === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Education */}
                    <Section id="education" title="Education">
                        <div className="flex flex-wrap gap-2">
                            {EDUCATION.map(edu => (
                                <button
                                    key={edu}
                                    onClick={() => toggleArrayFilter('education', edu)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.education.includes(edu)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                        }`}
                                >
                                    {edu}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Marital Status */}
                    <Section id="marital" title="Marital Status">
                        <div className="flex flex-wrap gap-2">
                            {MARITAL_STATUS.map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        // Toggle logic: If treating 'Never Married' and 'Single' as same, handle it?
                                        // UI just selects string. Logic handles mapping.
                                        toggleArrayFilter('maritalStatus', status);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.maritalStatus.includes(status)
                                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} />
                        Apply Filters
                    </button>
                </div>
            </div >
        </div >
    );
}
