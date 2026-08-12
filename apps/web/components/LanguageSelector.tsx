'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '@/context/LanguageContext';

export default function LanguageSelector({ isMobile = false }: { isMobile?: boolean }) {
  const { language, setLanguage, currentLangObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="w-full">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe size={14} className="text-indigo-600" />
          <span>Language / 语言 / भाषा</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                language === lang.code
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300 ring-2 ring-indigo-200'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="truncate">{lang.nativeName}</span>
              {language === lang.code && <Check size={12} className="ml-auto text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all border border-gray-200/80 dark:border-gray-700 shadow-sm"
        aria-label="Select Language"
      >
        <Globe size={14} className="text-indigo-600 dark:text-indigo-400" />
        <span className="mr-0.5">{currentLangObj.flag}</span>
        <span>{currentLangObj.nativeName}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 mb-1 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-[10px] text-indigo-500 font-mono">11 Languages</span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  language === lang.code
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-gray-400">({lang.name})</span>
                </div>
                {language === lang.code && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
