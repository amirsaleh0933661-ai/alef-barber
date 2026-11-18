'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, ShieldCheck, User, Sparkles, Tag, Check, 
  AlertCircle, CheckCircle2, Scissors, Timer, Info, Share2, Copy, 
  X, Sun, Moon, Phone, MapPin, CreditCard, Lock, Image as ImageIcon, Ban,
  Download, ArrowLeft, Smartphone, Share, PlusSquare, Search, AlertTriangle, Trash2, RefreshCw
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
  const [manualRefInput, setManualRefInput] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRefInput, setCancelRefInput] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelSuccessData, setCancelSuccessData] = useState<any>(null);

  const [clientTheme, setClientTheme] = useState<'dark' | 'light'>('dark');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsRefreshing(true);
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
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    const days = getShamsiNext7Days();
    setShamsiDays(days);
    if (days.length > 0) setSelectedDate(days[0].date);
    const n = new Date();
    setCurrentTotalMins(n.getHours() * 60 + n.getMinutes());
    loadData();
  }, []);

  // بررسی خودکار وضعیت پرداخت هر ۳ ثانیه
  useEffect(() => {
    if (!customInvoice?.booking_id && !customInvoice?.tracking_code) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'check_booking_status', 
            booking_id: customInvoice.booking_id || customInvoice.tracking_code 
          })
        });
        const data = await res.json();
        if (data.found && data.paid) {
          setReceipt(data.booking);
          setCustomInvoice(null);
          clearInterval(interval);
          showToast('پرداخت به طور خودکار تایید شد ✓');
          loadData();
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [customInvoice]);

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRefInput.trim()) {
      showToast('لطفاً کد رهگیری یا کد پرداخت را وارد کنید.');
      return;
    }
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_manual_payment_code',
          booking_id: customInvoice.booking_id || customInvoice.tracking_code,
          manual_ref: manualRefInput.trim()
        })
      });
      const result = await res.json();
      if (result.success) {
        setReceipt(result.booking);
        setCustomInvoice(null);
        showToast('کد پرداخت ثبت و نوبت قطعی شد ✓');
        loadData();
      } else {
        showToast(result.error || 'خطا در ثبت کد پرداخت');
      }
    } catch {
      showToast('خطای شبکه در ثبت کد پرداخت');
    }
  };

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
    buttonSelected: 'bg-blue-600 border-blue-500 text-white shadow-lg ring-2 ring-blue-400/40'
  };

  const availableBarbers = (db.operators || []).filter((o: any) => o.role !== 'developer');
  const currentOp = availableBarbers.find((o: any) => o.id === operatorId) || availableBarbers[0] || { name: 'فرزاد' };
  const currentOpServices = (db.services || []).filter((s: any) => s.operator_id === operatorId);
  const activeServiceObjects = currentOpServices.filter((s: any) => selectedServices.includes(s.id));
  const totalDuration = activeServiceObjects.reduce((sum: number, s: any) => sum + Number(s.duration || 30), 0);
  const subtotalPrice = activeServiceObjects.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = appliedDiscount.type === 'fixed' ? Math.min(subtotalPrice, appliedDiscount.value) : Math.round((subtotalPrice * appliedDiscount.value) / 100);
  }
  const finalPrice = Math.max(0, subtotalPrice - discountAmount);
  const estimatedEndTime = selectedStartTime ? minsToTime(timeToMins(selectedStartTime) + totalDuration) : '';

  const isSelectedDateOff = (db.off_days || []).some((o: any) => o.operator_id === operatorId && o.date === selectedDate);
  const opIntervalsForDay = (db.intervals || []).filter((it: any) => it.operator_id === operatorId && it.date === selectedDate);
  const dayBookings = (db.bookings || []).filter((b: any) => b.operator_id === operatorId && b.date === selectedDate);
  const isSelectedDateToday = shamsiDays.length > 0 && selectedDate === shamsiDays[0]?.date;

  const availableStartSlots: { time: string; available: boolean; tooClose?: boolean }[] = [];
  if (!isSelectedDateOff) {
    opIntervalsForDay.forEach((interval: any) => {
      const startM = timeToMins(interval.start_time);
      const endM = timeToMins(interval.end_time);
      for (let t = startM; t < endM; t += 30) {
        const candidateStart = t;
        const timeStr = minsToTime(candidateStart);

        let isTooClose = false;
        if (isSelectedDateToday && currentTotalMins > 0) {
          if (candidateStart <= currentTotalMins + 180) {
            isTooClose = true;
          }
        }

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
          available: !hasConflict && !isTooClose,
          tooClose: isTooClose
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
      setDiscountMsg({ type: 'ok', text: 'کد تخفیف اعمال شد.' });
    } else {
      setAppliedDiscount(null);
      setDiscountMsg({ type: 'err', text: 'کد تخفیف معتبر نیست.' });
    }
  };

  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedStartTime || selectedServices.length === 0) {
      showToast('لطفاً تمامی اطلاعات را کامل وارد کنید.');
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
        setCustomInvoice({ ...result, booking_id: bookingId });
        showToast('فاکتور پرداخت صادر شد.');
      } else {
        showToast(result.error || 'خطا در صدور فاکتور');
      }
    } catch {
      setIsSubmitting(false);
      showToast('خطای ارتباط با سرور');
    }
  };

  const handleCustomerCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = cancelRefInput.trim().toUpperCase();
    if (!cleanCode) return;
    setIsCanceling(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_booking_by_customer', code: cleanCode })
      });
      const result = await res.json();
      setIsCanceling(false);
      if (result.success) {
        setCancelSuccessData(result);
        loadData();
      } else {
        showToast(result.error || 'کد یافت نشد.');
      }
    } catch {
      setIsCanceling(false);
      showToast('خطا در ارتباط با سرور');
    }
  };

  const copyAppointmentText = () => {
    if (!receipt) return;
    const text = `نوبت سالن پیرایش الف\n${getFirstName(receipt.customer_name)} عزیز، نوبت شما ثبت شد:\nآرایشگر: ${receipt.operator_name}\nتاریخ: ${receipt.date}\nساعت: ${receipt.start_time}\nکد پیگیری: ${receipt.ref_id}`;
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <main className={`min-h-screen ${c.bg} ${c.text} py-10 px-4 font-sans relative flex flex-col items-center justify-start`} dir="rtl">
      
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold border border-slate-700">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* صفحه پرداخت تیکارت همراه با کد دستی و دکمه رفرش */}
      {customInvoice && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 text-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative">
            <button onClick={() => setCustomInvoice(null)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 transition z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 border-b border-slate-800 pb-3">
              <span className="text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full font-black inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> درگاه پرداخت امن کارت‌به‌کارت
              </span>
              <h3 className="text-xs font-bold text-slate-300 mt-2">کد پیگیری فاکتور: <span className="font-mono text-white font-black">{customInvoice.tracking_code}</span></h3>
            </div>

            <PaymentTimer expiresAt={customInvoice.expires_at} onExpire={() => { showToast('مهلت پرداخت به پایان رسید.'); setCustomInvoice(null); }} />

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2.5">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">مبلغ دقیق قابل واریز (با رقم یکتا):</span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {customInvoice.unique_amount_toman?.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  معادل {(customInvoice.unique_amount_toman * 10)?.toLocaleString('fa-IR')} ریال
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => { navigator.clipboard.writeText(String(customInvoice.unique_amount_toman)); showToast('تومان کپی شد ✓'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-amber-400" /> کپی تومان
                </button>
                <button onClick={() => { navigator.clipboard.writeText(String(customInvoice.unique_amount_toman * 10)); showToast('ریال کپی شد ✓'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-emerald-400" /> کپی ریال
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-950/80 to-slate-900 p-4 rounded-2xl border border-blue-800/50 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-blue-300">
                <span>شماره کارت مقصد ({customInvoice.bank_name}):</span>
                <span className="font-bold text-white">{customInvoice.card_holder}</span>
              </div>
              <div className="font-mono text-xl font-black tracking-widest text-white text-center py-1.5 bg-black/40 rounded-xl border border-blue-500/20">
                {customInvoice.card_number}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(customInvoice.card_number); showToast('شماره کارت کپی شد ✓'); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" /> کپی شماره کارت
              </button>
            </div>

            <form onSubmit={handleManualPaymentSubmit} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-amber-400 block">
                کد رهگیری تراکنش یا فیش پرداختی (اختیاری):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: TCO-98765"
                  value={manualRefInput}
                  onChange={(e) => setManualRefInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl font-mono uppercase focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl text-xs font-bold transition"
                >
                  ثبت کد
                </button>
              </div>
            </form>

            <button onClick={() => setCustomInvoice(null)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">
              بستن صفحه
            </button>
          </div>
        </div>
      )}

      {/* رسید موفقیت و نکات */}
      {receipt && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h3 className="text-base font-black">پرداخت تایید شد و نوبت قطعی گردید! 🎉</h3>
            <div className="text-xs space-y-2 bg-slate-800/60 p-4 rounded-2xl text-right">
              <div className="flex justify-between"><span className="text-slate-400">مشتری:</span><span className="font-bold">{receipt.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">آرایشگر:</span><span className="font-bold text-blue-400">{receipt.operator_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">تاریخ و ساعت:</span><span className="font-mono">{receipt.date} ساعت {receipt.start_time}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">کد پیگیری:</span><span className="font-mono text-amber-400">{receipt.ref_id}</span></div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-[11px] text-blue-200 text-right space-y-1">
              <p className="font-bold">📌 نکات مهم حضور در سالن الف:</p>
              <p>• لطفاً ۵ الی ۱۰ دقیقه قبل از ساعت رزرو در سالن حضور داشته باشید.</p>
              <p>• ثبت نوبت حداقل از ۳ ساعت قبل امکان‌پذیر است تا از ازدحام جلوگیری شود.</p>
            </div>

            <button onClick={copyAppointmentText} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition">
              {copiedNote ? 'کپی شد ✓' : 'کپی مشخصات نوبت'}
            </button>
            <button onClick={() => { setReceipt(null); setSelectedStartTime(null); loadData(); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold">
              رزرو نوبت جدید
            </button>
          </div>
        </div>
      )}

      {/* فرم اصلی رزرو همراه با دکمه رفرش */}
      <div className={`max-w-xl w-full ${c.card} border rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl relative z-10 mb-6`} dir="rtl">
        <div className={`space-y-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-5`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> نوبت‌دهی آنلاین
              </div>

              <button
                type="button"
                onClick={loadData}
                className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700`}
                title="بروزرسانی وضعیت نوبت‌ها"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="text-[11px]">بروزرسانی</span>
              </button>
            </div>

            <button onClick={toggleClientTheme} className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-700'}`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-center space-y-1">
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{db.salon_info?.name || 'سالن پیرایش الف'}</h1>
            <p className={`text-xs ${c.muted}`}>رزرو آنلاین با آرایشگران سالن الف (محدودیت ثبت: حداقل ۳ ساعت قبل)</p>
          </div>
        </div>

        {/* انتخاب آرایشگر */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}><User className="w-4 h-4 text-blue-500" /> انتخاب آرایشگر:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableBarbers.map((op: any) => {
              const isSelected = operatorId === op.id;
              return (
                <button key={op.id} type="button" onClick={() => setOperatorId(op.id)} className={`p-4 rounded-2xl border text-right transition flex justify-between items-center ${isSelected ? c.buttonSelected : `${c.innerCard} ${c.text}`}`}>
                  <div><span className="text-sm font-black block">{op.name}</span></div>
                  <div className={`w-3.5 h-3.5 rounded-full ${isSelected ? 'bg-white shadow' : 'bg-slate-400'}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* خدمات */}
        <div className={`${c.innerCard} border rounded-2xl p-4 sm:p-5 space-y-3`}>
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold flex items-center gap-1.5"><Scissors className="w-4 h-4 text-purple-500" /> خدمات اختصاصی:</label>
            <span className="text-[11px] bg-purple-500/15 text-purple-500 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">مجموع: {formatDuration(totalDuration)}</span>
          </div>
          <div className="space-y-2">
            {currentOpServices.map((srv: any) => {
              const isChecked = selectedServices.includes(srv.id);
              return (
                <div key={srv.id} onClick={() => toggleService(srv.id)} className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition ${isChecked ? 'bg-purple-950/25 border-purple-500 text-white' : `${c.card}`}`}>
                  <div className="flex items-center gap-2.5 text-xs font-bold">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-400'}`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{srv.title}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-purple-500 font-bold text-xs">+{Number(srv.price).toLocaleString('fa-IR')} ت</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* تقویم */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}><Calendar className="w-4 h-4 text-blue-500" /> انتخاب روز:</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {shamsiDays.map((d) => {
              const isSelected = selectedDate === d.date;
              const isDayOff = (db.off_days || []).some((o: any) => o.operator_id === operatorId && o.date === d.date);
              return (
                <button key={d.date} type="button" onClick={() => { setSelectedDate(d.date); setSelectedStartTime(null); }} className={`py-3 px-1 rounded-2xl border text-center transition flex flex-col items-center justify-center relative ${isDayOff ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 opacity-80' : isSelected ? `${c.buttonSelected} scale-105` : `${c.innerCard} ${c.muted}`}`}>
                  <span className="text-[10px] opacity-80">{d.weekday}</span>
                  <span className="font-mono text-sm mt-0.5 font-black">{d.dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ساعت‌های شروع با اعمال محدودیت ۳ ساعته */}
        <div className="space-y-2.5">
          <label className={`text-xs font-bold ${c.text} flex items-center gap-1.5`}><Clock className="w-4 h-4 text-blue-500" /> ساعت شروع نوبت (حداقل ۳ ساعت قبل):</label>
          {isSelectedDateOff ? (
            <div className="py-5 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold">آرایشگر در این روز حضور ندارد.</div>
          ) : availableStartSlots.length === 0 ? (
            <p className={`py-5 text-center ${c.innerCard} rounded-2xl border ${c.muted} text-xs`}>تایم خالی وجود ندارد.</p>
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
                      slot.tooClose 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-not-allowed opacity-75' 
                        : !slot.available 
                        ? 'bg-rose-500/10 text-rose-400 cursor-not-allowed line-through' 
                        : isSelected 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' 
                        : `${c.innerCard} text-emerald-500`
                    }`}
                  >
                    <span className="font-mono text-sm">{slot.time}</span>
                    <span className="text-[9px] mt-0.5 opacity-90">
                      {slot.tooClose ? 'کمتر از ۳ ساعت' : !slot.available ? 'رزرو شده' : 'قابل رزرو'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* فرم مشخصات و پرداخت */}
        {selectedStartTime && !isSelectedDateOff && (
          <form onSubmit={handleProceedPayment} className={`${c.innerCard} border p-5 rounded-2xl space-y-4 animate-fadeIn`}>
            <h3 className={`text-xs font-black ${c.text}`}>مشخصات مراجع:</h3>
            <div className="space-y-3">
              <input type="text" required placeholder="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} className={`w-full ${c.input} border text-xs p-3 rounded-xl focus:outline-none`} />
              <input type="tel" required inputMode="numeric" maxLength={11} placeholder="شماره موبایل (۰۹۱۲...)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} className={`w-full ${c.input} border text-xs p-3 rounded-xl font-mono text-center tracking-widest focus:outline-none`} />
            </div>

            <div className={`border-t pt-3 space-y-1.5 text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex justify-between font-black text-sm pt-1">
                <span>مبلغ نهایی:</span>
                <span className="text-emerald-500 font-mono text-base">{finalPrice.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {isSubmitting ? 'در حال صدور فاکتور...' : `پرداخت کارت‌به‌کارت (${finalPrice.toLocaleString('fa-IR')} تومان)`}
            </button>
          </form>
        )}
      </div>

    </main>
  );
}