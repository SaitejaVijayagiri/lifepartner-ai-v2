'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DownloadAppModal from '@/components/DownloadAppModal';
import { Smartphone, Download, ShieldCheck, Zap, Sparkles, RefreshCw, CheckCircle, BellRing, Heart, Lock, Star, ArrowRight } from 'lucide-react';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDownloadApk = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/LifePartner.apk';
    link.download = 'LifePartner.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install the web app, open your browser menu (⋮ or share icon) and select 'Add to Home Screen'.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 rounded-3xl p-8 md:p-14 text-white shadow-2xl relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 text-pink-100">
                <Sparkles size={14} /> Official Android & Web App
              </div>
              <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight mb-4 leading-tight">
                Get LifePartner AI <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-yellow-200">
                  On Your Mobile
                </span>
              </h1>
              <p className="text-base text-purple-100/90 mb-8 leading-relaxed font-light">
                Enjoy real-time instant message notifications, screenshot-protected photo Snaps, live speed dating, & zero forced subscription paywalls.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadApk}
                  disabled={downloading}
                  className="px-6 py-4 rounded-2xl bg-white text-purple-900 font-black text-sm hover:bg-purple-50 active:scale-95 transition-all shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-900/30 border-t-purple-900 rounded-full animate-spin" />
                      <span>Downloading APK...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} className="text-purple-700" />
                      <span>Download Android App (.apk)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleInstallPWA}
                  className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold text-sm hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap size={18} className="text-yellow-300" />
                  <span>{isPwaInstalled ? 'App Installed' : 'Add Shortcut to Home Screen'}</span>
                </button>
              </div>
            </div>

            {/* App Preview Frame */}
            <div className="flex justify-center">
              <div className="relative w-64 h-[420px] bg-gray-950 border-4 border-white/30 rounded-[3rem] p-3 shadow-2xl flex flex-col justify-between items-center ring-1 ring-black/40">
                {/* Notch */}
                <div className="w-24 h-4 bg-gray-900 rounded-full mx-auto mb-2 border border-gray-800"></div>

                {/* Inner Screen */}
                <div className="w-full flex-1 bg-gradient-to-b from-purple-900 via-indigo-950 to-gray-950 rounded-[2.2rem] p-4 text-center text-white flex flex-col justify-center items-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg mb-3">
                    <Heart size={32} fill="white" className="text-white animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">LifePartner AI</h3>
                  <p className="text-[11px] text-purple-200 mb-4">Realtime Match Notifications</p>

                  <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-left mb-2 flex items-center gap-2">
                    <BellRing size={16} className="text-pink-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-white">Ananya sent a message</div>
                      <div className="text-[9px] text-purple-200 truncate">"Hey! Checked your profile..."</div>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-green-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Live Auto-Updates Active
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-20 h-1 bg-white/40 rounded-full mt-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <BellRing size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Real-time Notifications</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Get instant push notification alerts and sound chimes on your phone as soon as someone messages or likes your profile.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <RefreshCw size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Automatic Dynamic Updates</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Any feature updates released on the website automatically sync to your app in real-time. No manual APK re-installations required!
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Landing Page Delay</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Once downloaded, launching the app takes you straight to your Dashboard or Login screen—skipping marketing pages completely.
            </p>
          </div>
        </div>

        {/* APK Installation Guide */}
        <div className="bg-white dark:bg-gray-950 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Smartphone size={22} className="text-purple-600" />
            Easy 3-Step Android Installation
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Download APK</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tap the 'Download Android APK' button to get `LifePartner.apk` directly onto your device.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Allow & Install</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Open the downloaded file and tap 'Install'. If prompted, enable 'Allow from this source'.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Launch & Enjoy</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Open LifePartner! You'll be taken straight to Login or Dashboard with real-time push alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <DownloadAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
