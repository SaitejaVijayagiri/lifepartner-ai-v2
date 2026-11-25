'use client';

import { useState, useEffect } from 'react';
import { isNativePlatform } from '@/lib/notifications';
import { Download, Smartphone, Sparkles, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;
  if (isNativePlatform()) return null;

  const handleInstallShortcut = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To add LifePartner to your Home Screen: Tap your browser menu (⋮ or Share icon) and select 'Add to Home Screen'.");
    }
  };

  const handleDownloadApk = () => {
    setDownloadingApk(true);
    try {
      const link = document.createElement('a');
      link.href = '/LifePartner.apk';
      link.download = 'LifePartner.apk';
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Link download failed, falling back to direct navigation", e);
    }
    setTimeout(() => {
      window.location.href = '/LifePartner.apk';
    }, 100);
    setTimeout(() => setDownloadingApk(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-full max-w-md my-auto bg-white dark:bg-gray-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md shrink-0">
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-pink-100">
                <Sparkles size={10} /> Mobile Web &amp; Android App
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Use LifePartner Anywhere</h2>
            </div>
          </div>
          <p className="text-xs text-purple-100/90 leading-relaxed mt-1">
            Add instantly to your iOS/Android Home Screen, or install our signed Android APK.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Installable Web App Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">Instant Mobile Web App (PWA)</h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Works on iPhone Safari &amp; Android Chrome immediately without sideloading.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 shrink-0">
                {isPwaInstalled ? 'Installed' : 'Recommended'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleInstallShortcut}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-black text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone size={16} />
              <span>{isPwaInstalled ? 'Added to Home Screen ✓' : 'Add Web App to Home Screen'}</span>
            </button>
          </div>

          {/* Direct APK Download Card */}
          <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={20} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">Android Direct Installer (.apk)</h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Signed direct installation for Android 8.0+ phones with automatic live sync.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 shrink-0">
                v1.0.9
              </span>
            </div>

            <a
              href="/LifePartner.apk"
              download="LifePartner.apk"
              onClick={() => handleDownloadApk()}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${downloadingApk ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {downloadingApk ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Downloading LifePartner.apk...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Android APK (6.9 MB)</span>
                </>
              )}
            </a>
          </div>

          {/* Easy Step-by-Step Installation Guide */}
          <div className="bg-slate-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Quick APK Steps (Android):</div>
            <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Tap <strong>Download Android APK</strong> above.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Open <strong className="text-gray-800 dark:text-gray-200">LifePartner.apk</strong> &amp; confirm Install.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Log in directly with full automatic web updates.</span>
              </div>
            </div>
          </div>

          {/* Footer Sync Badge */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
              <RefreshCw size={11} className="animate-spin" /> Automatic Live Updates
            </span>
            <span>Version 1.0.9</span>
          </div>

        </div>
      </div>
    </div>
  );
}
