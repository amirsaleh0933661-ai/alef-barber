'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, ShieldCheck, User, Sparkles, Tag, Check, 
  AlertCircle, CheckCircle2, Scissors, Timer, Info, Share2, Copy, 
  X, Sun, Moon, Phone, MapPin, CreditCard, Lock, Image as ImageIcon, Ban,
  Download, ArrowLeft, Smartphone, Share, PlusSquare, Search, AlertTriangle, Trash2
} from 'lucide-react';

function InstagramSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
  if (h > 0) return `${h} ساعت`;
  return `${m} دقیقه`;
}

function getShamsiNext7Days() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);

    let year = '', month = '', day = '';
    for (const p of parts) {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
    }

    const weekdayFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(d);
    const monthFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(d);
    const fullDate = `${year}/${month}/${day}`;

    days.push({
      date: fullDate,
      dayNum: day,
      weekday: i === 0 ? 'امروز' : i === 1 ? 'فردا' : weekdayFa,
      label: `${weekdayFa} ${day} ${monthFa}`,
      isToday: i === 0
    });
  }
  return days;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function getFirstName(fullName: string) {
  if (!fullName) return 'مشتری';
  const clean = fullName.trim();
  return clean.split(' ')[0] || clean;
}

// کامپوننت تایمر خطی ۵ دقیقه‌ای خفن
function PaymentTimer({ expiresAt, onExpire }: { expiresAt?: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(300);

  useEffect(() => {
    let initialSeconds = 300;
    if (expiresAt) {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff > 0) initialSeconds = diff;
    }
    setTimeLeft(initialSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progressPercent = (timeLeft / 300) * 100;

  return (
    <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-amber-400 flex items-center gap-1.5">
          <Timer className="w-4 h-4 animate-spin" /> مهلت باقی‌مانده واریز:
        </span>
        <span className="font-mono text-white text-sm">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
        <div 
          className="bg-gradient-to-l from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [shamsiDays, setShamsiDays] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentTotalMins, setCurrentTotalMins] = useState<number>(0);

  const [db, setDb] = useState<any>({ 
    operators: [
      { id: 1, name: 'فرزاد', username: 'farzad', role: 'barber', phone: '09121111111' },
      { id: 2, name: 'فرهاد', username: 'farhad', role: 'barber', phone: '09122222222' }
    ], 
    services: [], 
    portfolios: [],
    intervals: [], 
    bookings: [], 
    discounts: [], 
    off_days: [],
    salon_info: { 
      name: 'سالن پیرایش الف', 
      phone: '', 
      address: '', 
      instagram: '', 
      map_url: '',
      welcome_title: 'به سالن پیرایش الف خوش آمدید',
      welcome_text: '',
      install_prompt_text: '',
      arrival_rule: '',
      cancellation_rule: ''
    },
    current_theme: 'dark' 
  });

  const [operatorId, setOperatorId] = useState<number>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null);
  const [discountMsg, setDiscountMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customInvoice, setCustomInvoice] = useState<any | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [welcomeStep, setWelcomeStep] = useState<1 | 2 | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRefInput, setCancelRefInput] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelSuccessData, setCancelSuccessData] = useState<{
    operator_name: string;
    operator_phone: string;
    date: string;
    time: string;
  } | null>(null);

  const [clientTheme, setClientTheme] = useState<'dark' | 'light'>('dark');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/booking');
      const data = await res.json();
      setDb(data);

      if (data.current_theme === 'light' || data.current_theme === 'dark') {
        const saved = localStorage.getItem('client_theme');
        setClientTheme(saved ? (saved as any) : data.current_theme);
      }

      const barbers = (data.operators || []).filter((o: any) => o.role !== 'developer');
      if (barbers.length > 0 && !barbers.some((b: any) => b.id === operatorId)) {
        setOperatorId(barbers[0].id);
      }

      const opServices = (data.services || []).filter((s: any) => s.operator_id === operatorId);
      if (opServices.length > 0 && selectedServices.length === 0) {
        setSelectedServices([opServices[0].id]);
      }
    } catch {
      console.error('خطا در بارگذاری اطلاعات');
    }
  };

  useEffect(() => {
    const days = getShamsiNext7Days();
    setShamsiDays(days);
    if (days.length > 0) {
      setSelectedDate(days[0].date);
    }
    const n = new Date();
    setCurrentTotalMins(n.getHours() * 60 + n.getMinutes());

    loadData();

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const seen = sessionStorage.getItem('seen_welcome_glass');
    if (!seen && !isApp) {
      const timer = setTimeout(() => {
        setWelcomeStep(1);
      }, 700);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    const opServices = (db.services || []).filter((s: any) => s.operator_id === operatorId);
    if (opServices.length > 0) {
      setSelectedServices([opServices[0].id]);
    } else {
      setSelectedServices([]);
    }
    setSelectedStartTime(null);
  }, [operatorId, db.services]);

  const toggleClientTheme = () => {
    const next = clientTheme === 'dark' ? 'light' : 'dark';
    setClientTheme(next);
    localStorage.setItem('client_theme', next);
  };

  const isDark = clientTheme === 'dark';

  const c = {
    bg: isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]',
    text: isDark ? 'text-slate-100' : 'text-slate-800',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    innerCard: isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200',
    input: isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900',
    muted: isDark ? 'text-slate-400' : 'text-slate-500',
    buttonSelected: 'bg-blue-600 border-blue-500 text-white shadow-lg ring-2 ring-blue-400/40',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white'
  };

  const availableBarbers = (db.operators || []).filter((o: any) => o.role !== 'developer');
  const currentOp = availableBarbers.find((o: any) => o.id === operatorId) || availableBarbers[0] || { name: 'فرزاد' };
  const activePhoneNumber = currentOp?.phone || db.salon_info?.phone || '';

  const currentOpServices = (db.services || []).filter((s: any) => s.operator_id === operatorId);
  const activeServiceObjects = currentOpServices.filter((s: any) => selectedServices.includes(s.id));

  const totalDuration = activeServiceObjects.reduce((sum: number, s: any) => sum + Number(s.duration || 30), 0);
  const subtotalPrice = activeServiceObjects.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'fixed') {
      discountAmount = Math.min(subtotalPrice, appliedDiscount.value);
    } else {
      discountAmount = Math.round((subtotalPrice * appliedDiscount.value) / 100);
    }
  }

  const finalPrice = Math.max(0, subtotalPrice - discountAmount);
  const estimatedEndTime = selectedStartTime ? minsToTime(timeToMins(selectedStartTime) + totalDuration) : '';
  const currentOpPortfolios = (db.portfolios || []).filter((p: any) => p.operator_id === operatorId);

  const isSelectedDateOff = (db.off_days || []).some(
    (o: any) => o.operator_id === operatorId && o.date === selectedDate
  );

  const opIntervalsForDay = (db.intervals || []).filter(
    (it: any) => it.operator_id === operatorId && it.date === selectedDate
  );

  const dayBookings = (db.bookings || []).filter(
    (b: any) => b.operator_id === operatorId && b.date === selectedDate
  );

  const isSelectedDateToday = shamsiDays.length > 0 && selectedDate === shamsiDays[0]?.date;
  const availableStartSlots: { time: string; available: boolean }[] = [];

  if (!isSelectedDateOff) {
    opIntervalsForDay.forEach((interval: any) => {
      const startM = timeToMins(interval.start_time);
      const endM = timeToMins(interval.end_time);

      for (let t = startM; t < endM; t += 30) {
        const candidateStart = t;
        const timeStr = minsToTime(candidateStart);

        if (isSelectedDateToday && currentTotalMins > 0 && candidateStart <= currentTotalMins) continue;
        if (availableStartSlots.some(s => s.time === timeStr)) continue;

        let hasConflict = false;
        for (const b of dayBookings) {
          const bStart = timeToMins(b.start_time);
          const bEnd = timeToMins(b.end_time);
          if (candidateStart < bEnd && bStart < (candidateStart + totalDuration)) {
            hasConflict = true;
            break;
          }
        }

        availableStartSlots.push({
          time: timeStr,
          available: !hasConflict
        });
      }
    });

    availableStartSlots.sort((a, b) => a.time.localeCompare(b.time));
  }

  const toggleService = (srvId: string) => {
    if (selectedServices.includes(srvId)) {
      if (selectedServices.length === 1) return;
      setSelectedServices(selectedServices.filter(id => id !== srvId));
    } else {
      setSelectedServices([...selectedServices, srvId]);
    }
    setSelectedStartTime(null);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = discountInput.trim().toUpperCase();
    if (!clean) return;

    const found = (db.discounts || []).find((d: any) => d.code === clean && d.active);
    if (found) {
      const dType = found.type || 'percent';
      const dVal = Number(found.value ?? found.percent);
      setAppliedDiscount({ code: found.code, type: dType, value: dVal });
      const desc = dType === 'fixed'
        ? `تخفیف ${dVal.toLocaleString('fa-IR')} تومانی اعمال شد.`
        : `تخفیف ${dVal}٪ اعمال شد.`;
      setDiscountMsg({ type: 'ok', text: desc });
    } else {
      setAppliedDiscount(null);
      setDiscountMsg({ type: 'err', text: 'کد تخفیف معتبر نیست.' });
    }
  };

  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelectedDateOff) {
      showToast(`${currentOp?.name} در این روز نوبت‌دهی ندارد.`);
      return;
    }
    if (!name.trim()) {
      showToast('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    const mobileRegex = /^09[0-9]{9}$/;
    if (!mobileRegex.test(phone.trim())) {
      showToast('شماره تماس نامعتبر است! لطفاً شماره موبایل ۱۱ رقمی وارد کنید.');
      return;
    }

    if (!selectedStartTime) {
      showToast('لطفاً ساعت نوبت را انتخاب کنید.');
      return;
    }
    if (selectedServices.length === 0) {
      showToast('حداقل یک خدمت باید انتخاب شود.');
      return;
    }

    setIsSubmitting(true);
    const chosenServiceTitles = activeServiceObjects.map((s: any) => s.title);
    const bookingId = 'bk_' + Date.now();

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_card_payment',
          operator_id: operatorId,
          date: selectedDate,
          start_time: selectedStartTime,
          total_duration: totalDuration,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          services: chosenServiceTitles,
          discount_code: appliedDiscount?.code || null,
          amount: finalPrice,
          booking_id: bookingId
        })
      });

      const result = await res.json();
      setIsSubmitting(false);

      if (result.success && result.card_number) {
        setCustomInvoice(result);
        showToast('فاکتور کارت‌به‌کارت با موفقیت ایجاد شد.');
      } else {
        showToast(result.error || 'خطا در صدور فاکتور تیکارت');
      }
    } catch {
      setIsSubmitting(false);
      showToast('خطای ارتباط با سرور');
    }
  };
  
  const handleCustomerCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = cancelRefInput.trim().toUpperCase();
    if (!cleanCode) {
      showToast('لطفاً کد رهگیری سفارش را وارد کنید.');
      return;
    }

    setIsCanceling(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_booking_by_customer',
          code: cleanCode
        })
      });

      const result = await res.json();
      setIsCanceling(false);

      if (result.success) {
        setCancelSuccessData({
          operator_name: result.operator_name,
          operator_phone: result.operator_phone,
          date: result.date,
          time: result.time
        });
        loadData();
      } else {
        showToast(result.error || 'کد رهگیری یافت نشد.');
      }
    } catch {
      setIsCanceling(false);
      showToast('خطا در برقراری ارتباط با سرور');
    }
  };

  const copyAppointmentText = () => {
    if (!receipt) return;
    const text = `نوبت سالن پیرایش الف\n${getFirstName(receipt.customer_name)} عزیز، نوبت شما با موفقیت ثبت شد:\nآرایشگر: ${receipt.operator_name}\nتاریخ: ${receipt.date}\nساعت: ${receipt.start_time}\nکد پیگیری: ${receipt.ref_id}`;
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const closeWelcomeModal = () => {
    sessionStorage.setItem('seen_welcome_glass', 'true');
    setWelcomeStep(null);
  };

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        closeWelcomeModal();
      });
    } else {
      alert('برای نصب برنامه: از منوی سه‌نقطه بالای مرورگر، گزینه «افزودن به صفحه اصلی» را بزنید.');
      closeWelcomeModal();
    }
  };

  return (
    <main className={`min-h-screen ${c.bg} ${c.text} py-10 px-4 font-sans relative overflow-hidden flex flex-col items-center justify-start transition-colors duration-300`} dir="rtl">
      
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold border border-slate-700">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ۱. رسید ثبت نوبت موفقیت‌آمیز */}
      {receipt && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 shadow-2xl space-y-4 relative text-center">
            
            <button
              onClick={() => { setReceipt(null); setSelectedStartTime(null); }}
              className="absolute top-4 left-4 p-2 text-slate-300 hover:text-white rounded-xl bg-white/10 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            
            <div>
              <h3 className="text-base font-black text-white">
                {getFirstName(receipt.customer_name)} عزیز، نوبت شما با موفقیت ثبت شد! 🎉
              </h3>
              <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                مشخصات رزرو در سالن پیرایش الف:
              </p>
            </div>
            
            <div className={`text-xs space-y-2.5 ${c.innerCard} border border-white/10 p-4 rounded-2xl text-right`}>
              <div className="flex justify-between">
                <span className={c.muted}>نام مراجع:</span>
                <span className="font-bold text-white">{receipt.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>آرایشگر:</span>
                <span className="font-bold text-blue-400">{receipt.operator_name}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>تاریخ نوبت:</span>
                <span className="font-mono font-bold">{receipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>ساعت حضور:</span>
                <span className="font-mono text-emerald-400 font-black text-sm">از {receipt.start_time} تا حدود {receipt.end_time}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>کد پیگیری تراکنش:</span>
                <span className="font-mono text-amber-400 font-bold tracking-wider">{receipt.ref_id}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={copyAppointmentText}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                {copiedNote ? 'کپی شد ✓' : 'کپی مشخصات'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`نوبت سالن پیرایش الف\n${getFirstName(receipt.customer_name)} عزیز، نوبت شما ثبت شد:\nآرایشگر: ${receipt.operator_name}\nتاریخ: ${receipt.date}\nساعت: ${receipt.start_time}\nکد پیگیری: ${receipt.ref_id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> واتساپ
              </a>
            </div>

            <button
              onClick={() => { setReceipt(null); setSelectedStartTime(null); }}
              className="text-xs text-blue-400 hover:underline font-bold block mx-auto pt-1"
            >
              بستن و رزرو نوبت جدید
            </button>
          </div>
        </div>
      )}

      {/* ۲. پنجره لغو نوبت توسط مشتری با کد سفارش */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 text-white rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => { setShowCancelModal(false); setCancelSuccessData(null); setCancelRefInput(''); }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {!cancelSuccessData ? (
              <form onSubmit={handleCustomerCancelBooking} className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">لغو نوبت رزرو شده</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">آزادسازی فوری تایم برای دیگران</p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    کد پیگیری یا شماره سفارش نوبت:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: TCO-1234"
                    value={cancelRefInput}
                    onChange={(e) => setCancelRefInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs p-3 rounded-xl font-mono text-center uppercase tracking-widest focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isCanceling}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isCanceling ? 'در حال لغو...' : 'تأیید و لغو نوبت'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2 animate-fadeIn">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
                <div>
                  <h3 className="text-base font-black text-white">نوبت شما با موفقیت لغو شد</h3>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono">
                    تاریخ {cancelSuccessData.date} ساعت {cancelSuccessData.time} آزاد گردید.
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 text-right space-y-2 leading-relaxed">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" /> هماهنگی عودت وجه:
                  </p>
                  <p>
                    برای هماهنگی عودت وجه، لطفاً با آرایشگر خود (<strong>{cancelSuccessData.operator_name}</strong>) تماس بگیرید:
                  </p>
                  <div className="pt-1 text-center">
                    <a
                      href={`tel:${cancelSuccessData.operator_phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-mono font-black rounded-xl text-xs shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{cancelSuccessData.operator_phone}</span>
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setCancelSuccessData(null); setCancelRefInput(''); }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  بستن پنجره
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ۳. صفحه پرداخت اختصاصی خفن با تایمر خطی، ریال/تومان و دکمه بررسی */}
      {customInvoice && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 text-white rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-5 relative">
            
            <button
              onClick={() => setCustomInvoice(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 border-b border-slate-800 pb-4">
              <span className="text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full font-black inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> درگاه پرداخت امن کارت‌به‌کارت
              </span>
              <h3 className="text-xs font-bold text-slate-300 mt-2">کد پیگیری فاکتور: <span className="font-mono text-white font-black tracking-wider">{customInvoice.tracking_code}</span></h3>
            </div>

            {/* تایمر خطی ۵ دقیقه‌ای */}
            <PaymentTimer 
              expiresAt={customInvoice.expires_at} 
              onExpire={() => {
                showToast('مهلت پرداخت ۵ دقیقه‌ای به پایان رسید.');
                setCustomInvoice(null);
              }} 
            />

            {/* باکس نمایش مبالغ (تومان و ریال با قابلیت کپی) */}
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-center space-y-3 shadow-inner">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">مبلغ دقیق قابل پرداخت (حتماً با رقم‌های اعشار/یکتا واریز شود):</span>
                <div className="text-2xl font-black text-amber-400 font-mono tracking-wider">
                  {customInvoice.unique_amount_toman?.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
                </div>
                {/* نمایش مبلغ به ریال */}
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  معادل {(customInvoice.unique_amount_toman * 10)?.toLocaleString('fa-IR')} ریال
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(customInvoice.unique_amount_toman));
                    showToast('مبلغ تومانی کپی شد ✓');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" /> کپی تومان
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(customInvoice.unique_amount_toman * 10));
                    showToast('مبلغ ریالی کپی شد ✓');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" /> کپی ریال
                </button>
              </div>
            </div>

            {/* مشخصات کارت مقصد */}
            <div className="bg-gradient-to-br from-blue-950/80 to-slate-900 p-4.5 rounded-2xl border border-blue-800/50 space-y-3">
              <div className="flex justify-between items-center text-xs text-blue-300">
                <span>شماره کارت مقصد ({customInvoice.bank_name}):</span>
                <span className="font-bold text-white">{customInvoice.card_holder}</span>
              </div>
              <div className="font-mono text-xl font-black tracking-widest text-white text-center py-1.5 bg-black/40 rounded-xl border border-blue-500/20">
                {customInvoice.card_number}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customInvoice.card_number);
                  showToast('شماره کارت کپی شد ✓');
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Copy className="w-4 h-4" /> کپی شماره کارت بانکی
              </button>
            </div>

            {/* دکمه بررسی و تایید دستی پرداخت برای رفع مشکل ماندن روی تایمر */}
            <button
              onClick={handleCheckPaymentStatus}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> واریز کردم؛ تایید و قطعی کردن نوبت
            </button>

            <button
              onClick={() => setCustomInvoice(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              بازگشت به سایت
            </button>
          </div>
        </div>
      )}

      {/* فرم اصلی رزرو نوبت */}
      <div className={`max-w-xl w-full ${c.card} border rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl relative z-10 mb-6`} dir="rtl">
        
        <div className={`space-y-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-5`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> نوبت‌دهی آنلاین
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition"
              >
                <Search className="w-3 h-3" />
                <span>لغو نوبت با کد</span>
              </button>
            </div>

            <button
              onClick={toggleClientTheme}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${
                isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-center space-y-1">
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
              {db.salon_info?.name || 'سالن پیرایش الف'}
            </h1>
            <p className={`text-xs ${c.muted}`}>رزرو آنلاین با آرایشگران سالن الف</p>
          </div>
        </div>

        {/* انتخاب آرایشگر */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}>
            <User className="w-4 h-4 text-blue-500" /> انتخاب آرایشگر:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableBarbers.map((op: any) => {
              const isSelected = operatorId === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperatorId(op.id)}
                  className={`p-4 rounded-2xl border text-right transition flex justify-between items-center ${
                    isSelected ? c.buttonSelected : `${c.innerCard} ${c.text}`
                  }`}
                >
                  <div>
                    <span className="text-sm font-black block">{op.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">مشاهده نوبت‌ها</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full ${isSelected ? 'bg-white shadow' : 'bg-slate-400'}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* خدمات اختصاصی */}
        <div className={`${c.innerCard} border rounded-2xl p-4 sm:p-5 space-y-3`}>
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-purple-500" /> خدمات اختصاصی {currentOp?.name}:
            </label>
            <span className="text-[11px] bg-purple-500/15 text-purple-500 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> مجموع: {formatDuration(totalDuration)}
            </span>
          </div>

          <div className="space-y-2">
            {currentOpServices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">خدمتی برای این آرایشگر ثبت نشده است.</p>
            ) : (
              currentOpServices.map((srv: any) => {
                const isChecked = selectedServices.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition ${
                      isChecked
                        ? 'bg-purple-950/25 border-purple-500 text-white shadow-sm'
                        : `${c.card} hover:border-purple-400/50`
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-400'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{srv.title}</span>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-purple-500 font-bold text-xs">+{Number(srv.price).toLocaleString('fa-IR')} ت</span>
                      <span className={`text-[11px] ${c.muted} font-sans block mt-0.5`}>{srv.duration} دقیقه</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* تقویم شمسی */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}>
            <Calendar className="w-4 h-4 text-blue-500" /> انتخاب روز از تقویم سالن الف:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {shamsiDays.map((d) => {
              const isSelected = selectedDate === d.date;
              const isDayOff = (db.off_days || []).some(
                (o: any) => o.operator_id === operatorId && o.date === d.date
              );

              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => { setSelectedDate(d.date); setSelectedStartTime(null); }}
                  className={`py-3 px-1 rounded-2xl border text-center transition flex flex-col items-center justify-center relative ${
                    isDayOff 
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 opacity-80' 
                      : isSelected 
                      ? `${c.buttonSelected} scale-105` 
                      : `${c.innerCard} ${c.muted}`
                  }`}
                >
                  <span className="text-[10px] opacity-80">{d.weekday}</span>
                  <span className="font-mono text-sm mt-0.5 font-black">{d.dayNum}</span>
                  {isDayOff && (
                    <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded mt-0.5 font-bold">
                      تعطیل
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ساعت‌های شروع */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}>
            <Clock className="w-4 h-4 text-blue-500" /> ساعت شروع نوبت با {currentOp?.name}:
          </label>

          {isSelectedDateOff ? (
            <div className="py-7 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold flex flex-col items-center gap-1">
              <Ban className="w-5 h-5 text-rose-400" />
              <span>{currentOp?.name} در این تاریخ حضور ندارد (روز تعطیل).</span>
            </div>
          ) : availableStartSlots.length === 0 ? (
            <p className={`py-6 text-center ${c.innerCard} rounded-2xl border ${c.muted} text-xs`}>
              تایم بازی برای این روز وجود ندارد.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {availableStartSlots.map((slot) => {
                const isSelected = selectedStartTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedStartTime(slot.time)}
                    className={`py-3 px-2 rounded-xl text-xs font-black border flex flex-col items-center justify-center transition ${
                      !slot.available
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                        : `${c.innerCard} text-emerald-500 hover:border-emerald-500/50`
                    }`}
                  >
                    <span className="font-mono text-sm">{slot.time}</span>
                    <span className="text-[10px] mt-0.5">
                      {!slot.available ? 'پر' : isSelected ? 'انتخاب ✓' : 'خالی'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedStartTime && !isSelectedDateOff && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-500 flex justify-between items-center">
              <span>بازه تقریبی نوبت:</span>
              <span className="font-mono font-black">از {selectedStartTime} تا حدود {estimatedEndTime}</span>
            </div>
          )}
        </div>

        {/* کد تخفیف */}
        {!isSelectedDateOff && (
          <div className={`${c.innerCard} border p-4 rounded-2xl space-y-2`}>
            <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}>
              <Tag className="w-3.5 h-3.5 text-amber-500" /> کد تخفیف:
            </label>
            <form onSubmit={handleApplyDiscount} className="flex gap-2">
              <input
                type="text"
                placeholder="مثال: ALEF20"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className={`flex-1 ${c.input} border text-xs p-2.5 rounded-xl uppercase font-mono focus:outline-none`}
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 rounded-xl text-xs font-bold transition"
              >
                اعمال
              </button>
            </form>
            {discountMsg && (
              <p className={`text-[11px] font-bold mt-1 ${discountMsg.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {discountMsg.text}
              </p>
            )}
          </div>
        )}

        {/* مشخصات مراجع و دکمه پرداخت */}
        {selectedStartTime && !receipt && !isSelectedDateOff && (
          <form onSubmit={handleProceedPayment} className={`${c.innerCard} border p-5 rounded-2xl space-y-4`}>
            <h3 className={`text-xs font-black ${c.text}`}>مشخصات مراجع:</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علی حسینی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-3 rounded-xl focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">شماره موبایل (۱۱ رقم):</label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => {
                    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setPhone(cleanDigits);
                  }}
                  className={`w-full ${c.input} border text-xs p-3 rounded-xl font-mono text-center tracking-widest focus:outline-none`}
                />
              </div>
            </div>

            <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-3 space-y-1.5 text-xs`}>
              <div className="flex justify-between">
                <span className={c.muted}>آرایشگر:</span>
                <span className="font-bold text-blue-500">{currentOp?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>مجموع خدمات:</span>
                <span>{subtotalPrice.toLocaleString('fa-IR')} تومان</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-amber-500 font-bold">
                  <span>تخفیف:</span>
                  <span>- {discountAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}
              <div className={`flex justify-between font-black text-sm pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span>مبلغ نهایی:</span>
                <span className="text-emerald-500 font-mono text-base">{finalPrice.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isSubmitting ? 'در حال صدور فاکتور تیکارت...' : `پرداخت کارت‌به‌کارت (${finalPrice.toLocaleString('fa-IR')} تومان)`}
            </button>
          </form>
        )}
      </div>

      {/* بخش نمونه‌کارها */}
      <div className={`max-w-xl w-full ${c.card} border rounded-3xl p-6 space-y-4 shadow-xl mb-6`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-700/40">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            <h2 className="text-sm font-black">نمونه‌کارهای {currentOp?.name}:</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{currentOpPortfolios.length} اثر</span>
        </div>

        {currentOpPortfolios.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">هنوز تصویری برای این آرایشگر ثبت نشده است.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentOpPortfolios.map((port: any) => (
              <div key={port.id} className="rounded-2xl overflow-hidden border border-slate-700/60 bg-black/40 shadow group">
                <div className="w-full h-32 overflow-hidden bg-slate-800">
                  <img 
                    src={port.image} 
                    alt={port.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                </div>
                <p className="text-[11px] font-bold p-2 text-center truncate text-slate-200">{port.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* بخش کارت شیشه‌ای و دکمه‌های ارتباطی */}
      <div className={`max-w-xl w-full ${c.card} border rounded-3xl p-6 space-y-5 shadow-xl`}>
        <div className="space-y-1 text-center border-b pb-3 border-slate-700/40">
          <h3 className="text-sm font-black text-slate-100">نشانی و ارتباط با {db.salon_info?.name || 'سالن پیرایش الف'}</h3>
          <p className="text-[11px] text-slate-400">اطلاعات حضوری و ارتباط مستقیم با {currentOp?.name}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.04] dark:bg-black/40 backdrop-blur-xl border border-white/15 dark:border-white/10 shadow-xl text-right space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">آدرس حضوری سالن الف:</span>
              <p className="text-xs font-bold text-slate-200 leading-relaxed">
                {db.salon_info?.address || 'آدرس ثبت نشده است'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                شماره تماس مستقیم {currentOp?.name}:
              </span>
              <a 
                href={activePhoneNumber ? `tel:${activePhoneNumber}` : '#'} 
                className="text-xs font-mono font-black text-emerald-400 hover:underline"
              >
                {activePhoneNumber || 'ثبت نشده'}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <a
            href={db.salon_info?.instagram ? `https://instagram.com/${db.salon_info.instagram}` : '#'}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-2 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg hover:opacity-95 transition"
          >
            <InstagramSvg className="w-5 h-5" />
            <span>پیج اینستاگرام</span>
          </a>

          <a
            href={activePhoneNumber ? `tel:${activePhoneNumber}` : '#'}
            className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg transition"
          >
            <Phone className="w-5 h-5" />
            <span>تماس مستقیم</span>
          </a>

          <a
            href={db.salon_info?.map_url || '#'}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg transition"
          >
            <MapPin className="w-5 h-5" />
            <span>مسیریابی نقشه</span>
          </a>
        </div>
      </div>

    </main>
  );
}