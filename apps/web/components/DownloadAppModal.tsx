'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Sparkles, X, CheckCircle, ShieldCheck, Zap, QrCode, RefreshCw } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>('apk');

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

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install the web app, tap your browser menu (⋮ or share icon) and select 'Add to Home Screen'.");
    }
  };

  const handleDownloadApk = () => {
    setDownloadingApk(true);
    const link = document.createElement('a');
    link.href = '/LifePartner.apk';
    link.download = 'LifePartner.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingApk(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-pink-100">
                <Sparkles size={11} /> #1 Free Dating & Matrimony App
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Download LifePartner App</h2>
            </div>
          </div>
          <p className="text-xs text-purple-100/90 leading-relaxed">
            Get instant real-time message notifications, screenshot-proof Snaps, & continuous dynamic app updates.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tab Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1 rounded-2xl mb-5 border border-gray-200/60 dark:border-gray-700/60">
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Smartphone size={14} />
              <span>Android APK Direct</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pwa'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Zap size={14} />
              <span>Web App (PWA)</span>
            </button>
          </div>

          {activeTab === 'apk' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 flex items-start gap-3">
                <ShieldCheck size={22} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">100% Safe Direct Download</h4>
                  <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                    Official Android APK file (`LifePartner.apk`). Built with instant notification support and automated live updates.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadApk}
                disabled={downloadingApk}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-sm hover:opacity-95 active:scale-95 transition-all shadow-xl shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloadingApk ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Starting APK Download...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download Android APK (5.2 MB)</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5 pt-1">
                <div className="font-bold text-gray-700 dark:text-gray-300">How to install APK:</div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">1</span>
                  <span>Tap Download APK and accept browser prompt if requested.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">2</span>
                  <span>Open downloaded `LifePartner.apk` and tap <strong>Install</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">3</span>
                  <span>Launch app! You will automatically skip landing page and land right into Login/Dashboard.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                <Zap size={22} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Instant Progressive Web App (PWA)</h4>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                    No storage space required! Instantly installs to your home screen with zero app store delays.
                  </p>
                </div>
              </div>

              {isPwaInstalled ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl text-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300">LifePartner App is already installed!</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallPWA}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm hover:opacity-95 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone size={18} />
                  <span>Add to Home Screen / Install PWA</span>
                </button>
              )}
            </div>
          )}

          {/* Live Auto-Update Info Badge */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
              <RefreshCw size={12} className="animate-spin" /> Live Auto-Updates Active
            </span>
            <span>v2.4.0 • Zero Reinstall Required</span>
          </div>

        </div>
      </div>
    </div>
  );
}
