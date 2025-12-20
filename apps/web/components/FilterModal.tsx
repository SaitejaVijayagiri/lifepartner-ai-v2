'use client';

import { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

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
}

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'];
const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'];
const EDUCATION = ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Professional Degree'];
const MARITAL_STATUS = ['Never Married', 'Divorced', 'Widowed'];

const DEFAULT_FILTERS: FilterState = {
    ageRange: [21, 45],
    heightRange: [54, 78], // 4'6" to 6'6"
    religions: [],
    diet: null,
    smoking: null,
    drinking: null,
    education: [],
    maritalStatus: [],
};

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters || DEFAULT_FILTERS);
    const [expandedSections, setExpandedSections] = useState<string[]>(['age', 'religion']);

    if (!isOpen) return null;

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
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-800">{title}</span>
                {expandedSections.includes(id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.includes(id) && (
                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white rounded-t-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Filter size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Filter Matches</h3>
                                <p className="text-white/70 text-xs">Find your perfect match</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
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
                                    <label className="text-xs text-gray-500 mb-1 block">Min Age</label>
                                    <input
                                        type="number"
                                        min={18} max={60}
                                        value={filters.ageRange[0]}
                                        onChange={e => {
                                            const val = Math.min(parseInt(e.target.value) || 18, filters.ageRange[1] - 1);
                                            setFilters({ ...filters, ageRange: [Math.max(18, val), filters.ageRange[1]] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-center font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <span className="text-gray-400 font-medium">—</span>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">Max Age</label>
                                    <input
                                        type="number"
                                        min={18} max={60}
                                        value={filters.ageRange[1]}
                                        onChange={e => {
                                            const val = Math.max(parseInt(e.target.value) || 60, filters.ageRange[0] + 1);
                                            setFilters({ ...filters, ageRange: [filters.ageRange[0], Math.min(60, val)] });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-center font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            {/* Visual Range Bar */}
                            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    style={{
                                        left: `${((filters.ageRange[0] - 18) / 42) * 100}%`,
                                        width: `${((filters.ageRange[1] - filters.ageRange[0]) / 42) * 100}%`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>18</span>
                                <span className="font-medium text-indigo-600">{filters.ageRange[0]} - {filters.ageRange[1]} years</span>
                                <span>60</span>
                            </div>
                        </div>
                    </Section>

                    {/* Height Range */}
                    <Section id="height" title="Height Range">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{formatHeight(filters.heightRange[0])}</span>
                                <span>{formatHeight(filters.heightRange[1])}</span>
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="range"
                                    min={48} max={84}
                                    value={filters.heightRange[0]}
                                    onChange={e => setFilters({ ...filters, heightRange: [parseInt(e.target.value), filters.heightRange[1]] })}
                                    className="flex-1 accent-indigo-600"
                                />
                                <input
                                    type="range"
                                    min={48} max={84}
                                    value={filters.heightRange[1]}
                                    onChange={e => setFilters({ ...filters, heightRange: [filters.heightRange[0], parseInt(e.target.value)] })}
                                    className="flex-1 accent-indigo-600"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Religion */}
                    <Section id="religion" title="Religion">
                        <div className="flex flex-wrap gap-2">
                            {RELIGIONS.map(religion => (
                                <button
                                    key={religion}
                                    onClick={() => toggleArrayFilter('religions', religion)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.religions.includes(religion)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {religion}
                                </button>
                            ))}
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
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                <p className="text-xs text-gray-500 mb-2 font-medium">Smoking</p>
                                <div className="flex gap-2">
                                    {['No', 'Occasionally', 'Yes'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, smoking: filters.smoking === opt ? null : opt })}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.smoking === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-2 font-medium">Drinking</p>
                                <div className="flex gap-2">
                                    {['No', 'Occasionally', 'Yes'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, drinking: filters.drinking === opt ? null : opt })}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.drinking === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                    onClick={() => toggleArrayFilter('maritalStatus', status)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.maritalStatus.includes(status)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
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
            </div>
        </div>
    );
}
