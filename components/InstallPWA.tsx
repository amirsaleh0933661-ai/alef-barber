'use client';

import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Sparkles, Smartphone, MoreVertical } from 'lucide-react';

export default function InstallPWA() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    setMounted(true);

    // ۱. بررسی اینکه آیا برنامه از قبل نصب شده است یا خیر
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isApp) {
      setIsStandalone(true);
      return;
    }

    // ۲. بررسی آیفون
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // ۳. گرفتن رویداد نصب در صورت ارسال توسط مرورگر
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // ۴. نمایش قطعی و بدون قید و شرط پنجره بعد از ۱.۲ ثانیه
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // تا زمانی که در مرورگر رندر نشده، چیزی نشان نده (جلوگیری از خطای هیدریشن)
  if (!mounted || isStandalone || !isOpen) return null;

  const handleInstallClick = async () => {
    // اگر در محیط HTTPS بود و رویداد آماده بود، پنجره خودکار مرورگر باز شود
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsOpen(false);
        setDeferredPrompt(null);
      }
    } else {
      // اگر روی IP محلی بود و مرورگر دکمه مستقیم را مسدود کرده بود، راهنمای ۳ ثانیه‌ای باز شود
      setShowManualGuide(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div 
        className="max-w-md w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl space-y-5 relative"
        dir="rtl"
      >
        {/* دکمه بستن */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* هدر پنجره با لوگوی الف */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/30 shrink-0">
            الف
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 mb-1">
              <Sparkles className="w-3 h-3" /> اپلیکیشن سالن پیرایش الف
            </div>
            <h3 className="text-sm font-black text-white">نصب برنامه روی گوشی</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">بدون نیاز به دانلود از بازار، پرسرعت و تمام‌صفحه</p>
          </div>
        </div>

        {/* ویژگی‌ها */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>اجرای تمام‌صفحه و سریع از روی صفحه اصلی گوشی</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400 shrink-0" />
            <span>دریافت زنگ و اعلان‌های اختصاصی نوبت‌ها</span>
          </div>
        </div>

        {/* راهنمای آیفون */}
        {isIOS ? (
          <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-2xl space-y-2.5 text-xs text-blue-100">
            <p className="font-bold text-white text-xs">مراحل نصب روی آیفون (سافاری):</p>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p className="flex items-center gap-2">
                ۱. دکمه <Share className="w-4 h-4 text-blue-400" /> (Share در پایین مرورگر) را لمس کنید.
              </p>
              <p className="flex items-center gap-2">
                ۲. به پایین اسکرول کرده و <PlusSquare className="w-4 h-4 text-emerald-400" /> <strong>Add to Home Screen</strong> را بزنید.
              </p>
            </div>
          </div>
        ) : showManualGuide ? (
          /* راهنمای سریع اندروید در صورت مسدود بودن دکمه خودکار توسط شبکه محلی */
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl space-y-2.5 text-xs text-emerald-100 animate-fadeIn">
            <p className="font-bold text-white text-xs">۲ مرحله ساده برای نصب روی گوشی:</p>
            <div className="space-y-2 text-[11px] text-slate-200">
              <p className="flex items-center gap-2">
                ۱. روی آیکون <strong>۳ نقطه (⋮)</strong> در بالای مرورگر کروم بزنید.
              </p>
              <p className="flex items-center gap-2">
                ۲. گزینه <strong>«افزودن به صفحه اصلی»</strong> یا <strong>«نصب برنامه» (Install app)</strong> را لمس کنید.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              متوجه شدم ✓
            </button>
          </div>
        ) : (
          /* دکمه نصب مستقیم */
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" />
              نصب برنامه روی گوشی
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-slate-400 hover:text-slate-300 text-[11px] font-bold"
            >
              فعلاً نه، بعداً نصب می‌کنم
            </button>
          </div>
        )}
      </div>
    </div>
  );
}