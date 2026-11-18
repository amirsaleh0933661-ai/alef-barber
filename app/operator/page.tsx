'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Wallet, LogOut, Lock, User, Trash2, 
  RefreshCw, Tag, AlertCircle, Calendar, Clock, Plus, 
  Scissors, BarChart3, TrendingUp, Check, 
  Shield, Bell, BellRing, Volume2, X, Sun, Moon, KeyRound,
  Phone, MapPin, Settings, Sparkles, Ban, Image as ImageIcon,
  Code2, Sliders, Home, UserPlus, MessageSquare, RotateCcw,
  CreditCard, CheckCircle2, XCircle, Zap, Info
} from 'lucide-react';

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

const timeOptions = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'
];

type ThemeMode = 'dark' | 'light';

export default function OperatorPanel() {
  const [shamsiDays, setShamsiDays] = useState<any[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [operator, setOperator] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [activeTab, setActiveTab] = useState<'salon_stats' | 'payment_gateways' | 'barbers_mgr' | 'salon_settings' | 'my_panel'>('payment_gateways');

  const [db, setDb] = useState<any>({ 
    operators: [], 
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
      arrival_rule: '', 
      cancellation_rule: '',
      tcart_api_key: '',
      bale_bot_token: ''
    },
    current_theme: 'dark' 
  });

  const [tcartApiKeyInput, setTcartApiKeyInput] = useState('');
  const [baleBotTokenInput, setBaleBotTokenInput] = useState('');

  const [newStart, setNewStart] = useState('13:00');
  const [newEnd, setNewEnd] = useState('15:00');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServicePrice, setNewServicePrice] = useState('150000');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountValue, setNewDiscountValue] = useState('20');

  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioImage, setNewPortfolioImage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberUsername, setNewBarberUsername] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');

  const [salonNameInput, setSalonNameInput] = useState('');
  const [salonPhoneInput, setSalonPhoneInput] = useState('');
  const [salonAddressInput, setSalonAddressInput] = useState('');
  const [salonInstaInput, setSalonInstaInput] = useState('');
  const [salonMapInput, setSalonMapInput] = useState('');
  const [welcomeTitleInput, setWelcomeTitleInput] = useState('');
  const [welcomeTextInput, setWelcomeTextInput] = useState('');
  const [installPromptInput, setInstallPromptInput] = useState('');
  const [arrivalRuleInput, setArrivalRuleInput] = useState('');
  const [cancellationRuleInput, setCancellationRuleInput] = useState('');

  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [myMinAdvanceHours, setMyMinAdvanceHours] = useState('3');
  const [myBaleChatIdInput, setMyBaleChatIdInput] = useState('');

  const [barberDiscountCode, setBarberDiscountCode] = useState('');
  const [barberDiscountType, setBarberDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [barberDiscountValue, setBarberDiscountValue] = useState('15');

  const [editOpId, setEditOpId] = useState<number | null>(null);
  const [editOpPhone, setEditOpPhone] = useState('');
  const [editOpInsta, setEditOpInsta] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/booking');
      const data = await res.json();
      setDb(data);

      if (data.salon_info) {
        setSalonNameInput(data.salon_info.name || 'سالن پیرایش الف');
        setSalonPhoneInput(data.salon_info.phone || '');
        setSalonAddressInput(data.salon_info.address || '');
        setSalonInstaInput(data.salon_info.instagram || '');
        setSalonMapInput(data.salon_info.map_url || '');
        setWelcomeTitleInput(data.salon_info.welcome_title || 'به سالن پیرایش الف خوش آمدید');
        setWelcomeTextInput(data.salon_info.welcome_text || '');
        setInstallPromptInput(data.salon_info.install_prompt_text || '');
        setArrivalRuleInput(data.salon_info.arrival_rule || '');
        setCancellationRuleInput(data.salon_info.cancellation_rule || '');
        setTcartApiKeyInput(data.salon_info.tcart_api_key || '');
        setBaleBotTokenInput(data.salon_info.bale_bot_token || '');
      }

      if (data.current_theme === 'light' || data.current_theme === 'dark') {
        setTheme(data.current_theme);
      }
    } catch {
      console.error('خطا در دریافت اطلاعات');
    }
  };

  useEffect(() => {
    const days = getShamsiNext7Days();
    setShamsiDays(days);
    if (days.length > 0) {
      setTodayDate(days[0].date);
      setSelectedDate(days[0].date);
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedOp = localStorage.getItem('op_session');
    if (savedOp) {
      try { 
        const parsed = JSON.parse(savedOp);
        if (parsed.username?.toLowerCase() === 'admin' || parsed.id === 99) {
          parsed.role = 'developer';
        }
        setOperator(parsed); 
        setMyMinAdvanceHours(String(parsed.min_advance_hours || 3));
        setMyBaleChatIdInput(parsed.bale_chat_id || '');
      } catch { 
        localStorage.removeItem('op_session'); 
      }
    }
    const savedTheme = localStorage.getItem('op_theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (operator && db.operators) {
      const updatedMe = db.operators.find((o: any) => o.id === operator.id);
      if (updatedMe) {
        setOperator(updatedMe);
        localStorage.setItem('op_session', JSON.stringify(updatedMe));
        setMyMinAdvanceHours(String(updatedMe.min_advance_hours || 3));
        setMyBaleChatIdInput(updatedMe.bale_chat_id || '');
      }
    }
  }, [db.operators]);

  const changeTheme = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('op_theme', newTheme);
    showToast(`تم ${newTheme === 'dark' ? 'مشکی' : 'سفید'} انتخاب شد.`, 'success');
    try {
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_theme', theme: newTheme })
      });
    } catch {
      showToast('خطا در تغییر تم روی سرور', 'error');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    const targetUser = loginUsername.trim().toLowerCase();
    const targetPass = loginPassword.trim();

    if (targetUser === 'admin' && targetPass === 'admin') {
      const dev = { id: 99, name: 'برنامه‌نویس و مدیر کل', username: 'admin', role: 'developer' };
      setOperator(dev);
      localStorage.setItem('op_session', JSON.stringify(dev));
      setActiveTab('payment_gateways');
      showToast('ورود با دسترسی کامل برنامه‌نویس', 'success');
      loadData();
      return;
    }

    const found = (db.operators || []).find(
      (op: any) => op.username.toLowerCase() === targetUser && op.password === targetPass
    );

    if (found) {
      setOperator(found);
      localStorage.setItem('op_session', JSON.stringify(found));
      setActiveTab('salon_stats');
      showToast(`خوش آمدید ${found.name}`, 'success');
      loadData();
      return;
    }

    setLoginError('نام کاربری یا رمز عبور اشتباه است.');
  };

  const handleLogout = () => {
    localStorage.removeItem('op_session');
    setOperator(null);
  };

  const handleSaveTcartApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_salon_info',
        name: salonNameInput,
        phone: salonPhoneInput,
        address: salonAddressInput,
        instagram: salonInstaInput,
        map_url: salonMapInput,
        arrival_rule: arrivalRuleInput,
        cancellation_rule: cancellationRuleInput,
        tcart_api_key: tcartApiKeyInput.trim(),
        bale_bot_token: baleBotTokenInput.trim()
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast('تنظیمات درگاه و بات بله با موفقیت ذخیره شد ✓', 'success');
      loadData();
    } else {
      showToast('خطا در ذخیره تنظیمات', 'error');
    }
  };

  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim() || !newBarberUsername.trim() || !newBarberPassword.trim()) {
      showToast('مشخصات آرایشگر جدید را تکمیل فرمایید.', 'error');
      return;
    }

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_operator',
        name: newBarberName,
        username: newBarberUsername,
        password: newBarberPassword,
        phone: newBarberPhone
      })
    });

    const result = await res.json();
    if (result.success) {
      setNewBarberName('');
      setNewBarberUsername('');
      setNewBarberPassword('');
      setNewBarberPhone('');
      showToast(`آرایشگر جدید "${result.operator.name}" اضافه شد.`, 'success');
      loadData();
    } else {
      showToast(result.error || 'خطا در ثبت آرایشگر', 'error');
    }
  };

  const handleDeleteBarber = (opId: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف آرایشگر',
      message: `آیا از حذف "${name}" مطمئن هستید؟`,
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_operator', operator_id: opId })
        });
        const result = await res.json();
        if (result.success) {
          showToast(`آرایشگر "${name}" حذف شد.`, 'success');
          loadData();
        } else {
          showToast(result.error || 'خطا در حذف', 'error');
        }
      }
    });
  };

  const handleAdminUpdateBarber = async (opId: number) => {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_operator_profile',
        operator_id: opId,
        phone: editOpPhone,
        instagram: editOpInsta
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast('اطلاعات پرسنل بروزرسانی شد.', 'success');
      setEditOpId(null);
      loadData();
    } else {
      showToast('خطا در بروزرسانی', 'error');
    }
  };

  const handleSaveSalonSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_salon_info',
        name: salonNameInput,
        phone: salonPhoneInput,
        address: salonAddressInput,
        instagram: salonInstaInput,
        map_url: salonMapInput,
        arrival_rule: arrivalRuleInput,
        cancellation_rule: cancellationRuleInput,
        tcart_api_key: tcartApiKeyInput,
        bale_bot_token: baleBotTokenInput
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast('تنظیمات سالن و قوانین با موفقیت ذخیره شدند.', 'success');
      loadData();
    }
  };

  const handleUpdateMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator) return;
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_operator_profile',
        operator_id: operator.id,
        min_advance_hours: myMinAdvanceHours,
        bale_chat_id: myBaleChatIdInput
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast('تنظیمات پیش‌رزرو و دسترسی اعلان بله ذخیره شد.', 'success');
      loadData();
    } else {
      showToast('خطا در ذخیره تنظیمات', 'error');
    }
  };

  const handleBarberAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator) return;
    const cleanCode = barberDiscountCode.trim().toUpperCase();
    if (!cleanCode) return;

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_discount',
        code: cleanCode,
        type: barberDiscountType,
        value: Number(barberDiscountValue),
        operator_id: operator.id
      })
    });
    const result = await res.json();
    if (result.success) {
      setBarberDiscountCode('');
      showToast(`کد تخفیف اختصاصی ${cleanCode} ایجاد شد.`, 'success');
      loadData();
    } else {
      showToast('خطا در ایجاد کد تخفیف', 'error');
    }
  };

  const handleResetAllBookings = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'ریست کلیه نوبت‌ها',
      message: 'آیا مایلید تمام نوبت‌های ثبت‌شده تا الان صفر شوند؟',
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_all_bookings' })
        });
        const result = await res.json();
        if (result.success) {
          showToast('تمام نوبت‌ها صفر شدند.', 'success');
          loadData();
        }
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setNewPortfolioImage(compressedBase64);
        setIsCompressing(false);
        showToast('تصویر بهینه‌سازی شد.', 'success');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioTitle.trim()) {
      showToast('عنوان نمونه‌کار را بنویسید.', 'error');
      return;
    }
    if (!newPortfolioImage) {
      showToast('یک تصویر انتخاب کنید.', 'error');
      return;
    }

    const opId = operator?.id || 1;

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_portfolio',
        operator_id: opId,
        title: newPortfolioTitle.trim(),
        image: newPortfolioImage
      })
    });

    const result = await res.json();
    if (result.success) {
      setNewPortfolioTitle('');
      setNewPortfolioImage('');
      showToast('نمونه‌کار آپلود و به گالری شما اضافه شد.', 'success');
      loadData();
    } else {
      showToast('خطا در آپلود نمونه‌کار', 'error');
    }
  };

  const handleDeletePortfolio = (portId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف نمونه‌کار',
      message: 'آیا از حذف این نمونه‌کار مطمئن هستید؟',
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_portfolio', portfolio_id: portId })
        });
        const result = await res.json();
        if (result.success) {
          showToast('نمونه‌کار حذف شد.', 'success');
          loadData();
        }
      }
    });
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) {
      showToast('عنوان خدمت را بنویسید.', 'error');
      return;
    }

    const opId = operator?.id || 1;

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_service',
        operator_id: opId,
        title: newServiceTitle.trim(),
        duration: Number(newServiceDuration) || 30,
        price: Number(newServicePrice) || 100000
      })
    });

    const result = await res.json();
    if (result.success) {
      setNewServiceTitle('');
      showToast(`خدمت "${newServiceTitle.trim()}" اضافه شد.`, 'success');
      loadData();
    } else {
      showToast('خطا در ذخیره خدمت', 'error');
    }
  };

  const handleDeleteService = (srvId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف خدمت',
      message: 'آیا از حذف این خدمت اطمینان دارید؟',
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_service', service_id: srvId })
        });
        const result = await res.json();
        if (result.success) {
          showToast('خدمت حذف شد.', 'success');
          loadData();
        }
      }
    });
  };

  const handleToggleOffDay = async () => {
    if (!operator) return;

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_off_day',
        operator_id: operator.id,
        date: selectedDate
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.is_off ? 'این تاریخ به عنوان روز تعطیل ثبت شد.' : 'این تاریخ به روز کاری بازگشت.', 'success');
      loadData();
    }
  };

  const handleAddInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator) return;
    if (newStart >= newEnd) {
      showToast('ساعت پایان باید بعد از ساعت شروع باشد!', 'error');
      return;
    }

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_interval',
        operator_id: operator.id,
        date: selectedDate,
        start_time: newStart,
        end_time: newEnd
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast('شیفت کاری ذخیره شد.', 'success');
      loadData();
    }
  };

  const handleDeleteInterval = (intId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف شیفت کاری',
      message: 'آیا از حذف این بازه زمانی مطمئن هستید؟',
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_interval', interval_id: intId })
        });
        const result = await res.json();
        if (result.success) {
          showToast('شیفت حذف شد.', 'success');
          loadData();
        }
      }
    });
  };

  const handleCancelBooking = (bId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'لغو نوبت مراجع',
      message: 'آیا از لغو این نوبت اطمینان دارید؟',
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel_booking', booking_id: bId })
        });
        const result = await res.json();
        if (result.success) {
          showToast('نوبت لغو شد.', 'success');
          loadData();
        }
      }
    });
  };

  const handleDeleteDiscount = (code: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف کد تخفیف',
      message: `آیا از حذف کد تخفیف ${code} اطمینان دارید؟`,
      onConfirm: async () => {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_discount', code })
        });
        const result = await res.json();
        if (result.success) {
          showToast('کد تخفیف حذف شد.', 'success');
          loadData();
        }
      }
    });
  };

  const isDeveloper = Boolean(
    operator?.role === 'developer' || 
    operator?.username?.toLowerCase() === 'admin' || 
    operator?.id === 99
  );

  const salonAnalytics = useMemo(() => {
    const allBookings = db.bookings || [];
    const barbers = (db.operators || []).filter((o: any) => o.role !== 'developer');

    const todayBookings = todayDate ? allBookings.filter((b: any) => b.date === todayDate) : [];
    const totalTodayClients = todayBookings.length;
    const totalTodayRevenue = todayBookings.reduce((acc: number, b: any) => acc + Number(b.amount || 0), 0);

    const operatorStats = barbers.map((op: any) => {
      const opTodayBookings = todayBookings.filter((b: any) => b.operator_id === op.id);
      const opAllBookings = allBookings.filter((b: any) => b.operator_id === op.id);
      const countToday = opTodayBookings.length;
      const percentToday = totalTodayClients > 0 ? Math.round((countToday / totalTodayClients) * 100) : 0;
      const revenueToday = opTodayBookings.reduce((acc: number, b: any) => acc + Number(b.amount || 0), 0);
      const totalRevenue = opAllBookings.reduce((acc: number, b: any) => acc + Number(b.amount || 0), 0);

      return {
        ...op,
        countToday,
        percentToday,
        revenueToday,
        totalRevenue,
        totalClients: opAllBookings.length
      };
    });

    return { totalTodayClients, totalTodayRevenue, operatorStats };
  }, [db, todayDate]);

  const isDark = theme === 'dark';
  const c = {
    bg: isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]',
    text: isDark ? 'text-slate-100' : 'text-slate-800',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    innerCard: isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200',
    input: isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900',
    muted: isDark ? 'text-slate-400' : 'text-slate-500',
    btnPrimary: isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    tabActive: isDark ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-md'
  };

  if (!operator) {
    return (
      <div className={`min-h-screen ${c.bg} flex items-center justify-center p-4 font-sans transition-colors duration-300`} dir="rtl">
        <div className={`max-w-sm w-full ${c.card} border p-7 sm:p-8 rounded-3xl shadow-xl space-y-5`}>
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>ورود پرسنل سالن الف</h1>
            <p className={`text-xs ${c.muted} mt-1`}>مدیریت نوبت‌ها و درگاه‌های پرداخت</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold block mb-1">نام کاربری:</label>
              <input
                type="text"
                required
                placeholder="نام کاربری شما"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={`w-full ${c.input} border text-xs p-3 rounded-xl focus:outline-none`}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">رمز عبور:</label>
              <input
                type="password"
                required
                placeholder="رمز عبور شما"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full ${c.input} border text-xs p-3 rounded-xl focus:outline-none`}
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3.5 ${c.btnPrimary} font-black text-xs rounded-xl shadow-md transition active:scale-95`}
            >
              ورود به حساب کاربری
            </button>
          </form>
        </div>
      </div>
    );
  }

  const myBookings = (db.bookings || []).filter((b: any) => b.operator_id === operator.id);
  const myTodayBookings = todayDate ? myBookings.filter((b: any) => b.date === todayDate) : [];
  const mySelectedDateBookings = myBookings
    .filter((b: any) => b.date === selectedDate)
    .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

  const myIntervalsForSelectedDate = (db.intervals || []).filter(
    (it: any) => it.operator_id === operator.id && it.date === selectedDate
  );

  const myServices = (db.services || []).filter((s: any) => s.operator_id === operator.id);
  const myPortfolios = (db.portfolios || []).filter((p: any) => p.operator_id === operator.id);
  const myDiscounts = (db.discounts || []).filter((d: any) => Number(d.operator_id) === Number(operator.id));
  const myTodayIncome = myTodayBookings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);

  return (
    <div className={`min-h-screen ${c.bg} ${c.text} py-8 px-4 max-w-xl mx-auto space-y-5 transition-colors duration-300 relative font-sans`} dir="rtl">
      
      {toast && (
        <div className={`fixed top-4 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs font-bold border transition-all ${
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-600 text-white border-emerald-400'
        }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-sm w-full ${c.card} border p-6 rounded-3xl shadow-2xl space-y-4`}>
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{confirmDialog.title}</h3>
            <p className={`text-xs ${c.muted} leading-relaxed`}>{confirmDialog.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                تأیید و انجام
              </button>
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className={`py-2.5 px-4 ${c.innerCard} border text-xs font-bold rounded-xl transition ${c.text}`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${c.card} border p-4 rounded-3xl flex justify-between items-center shadow-md`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${c.innerCard} border flex items-center justify-center font-black text-base ${isDeveloper ? 'text-amber-400 bg-amber-500/10' : 'text-blue-500'}`}>
            {isDeveloper ? <Code2 className="w-6 h-6" /> : operator.name.slice(0, 1)}
          </div>
          <div>
            <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
              {operator.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                isDeveloper 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold' 
                  : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              }`}>
                {isDeveloper ? 'برنامه‌نویس و مدیر کل' : 'آرایشگر'}
              </span>
            </h2>
            <p className={`text-[11px] ${c.muted} font-mono`}>@{operator.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeTheme(isDark ? 'light' : 'dark')}
            className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
            title="تغییر تم"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-[11px]">{isDark ? 'سفید' : 'مشکی'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-rose-500 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`grid ${isDeveloper ? 'grid-cols-4' : 'grid-cols-2'} gap-1.5 ${c.innerCard} p-1.5 rounded-2xl border text-center`}>
        <button
          onClick={() => setActiveTab('salon_stats')}
          className={`py-2.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
            activeTab === 'salon_stats' ? c.tabActive : c.muted
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span>نوبت‌ها</span>
        </button>

        {isDeveloper ? (
          <>
            <button
              onClick={() => setActiveTab('payment_gateways')}
              className={`py-2.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                activeTab === 'payment_gateways' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40' : c.muted
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>اتصالات و بات</span>
            </button>

            <button
              onClick={() => setActiveTab('barbers_mgr')}
              className={`py-2.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                activeTab === 'barbers_mgr' ? c.tabActive : c.muted
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>پرسنل</span>
            </button>

            <button
              onClick={() => setActiveTab('salon_settings')}
              className={`py-2.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                activeTab === 'salon_settings' ? c.tabActive : c.muted
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>تنظیمات</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveTab('my_panel')}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_panel' ? c.tabActive : c.muted
            }`}
          >
            <User className="w-4 h-4" /> کارتابل {operator.name}
          </button>
        )}
      </div>

      {isDeveloper && activeTab === 'payment_gateways' && (
        <div className="space-y-4 animate-fadeIn">
          <div className={`${c.card} border p-5 rounded-3xl space-y-4`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white">تنظیمات درگاه و بات بله</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">مدیریت اتصال به تیکارت و ربات پیام‌رسان بله</p>
                </div>
              </div>
              <button onClick={loadData} className="text-blue-500 p-1.5 hover:bg-slate-800 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTcartApiKey} className="space-y-3.5 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  کلید API تیکارت (Tcart API Key):
                </label>
                <input
                  type="text"
                  placeholder="sk_..."
                  value={tcartApiKeyInput}
                  onChange={(e) => setTcartApiKeyInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-3 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  توکن ربات پیام‌رسان بله (Bale Bot Token):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456789:ABCdefGHIjkl..."
                  value={baleBotTokenInput}
                  onChange={(e) => setBaleBotTokenInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-3 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                ذخیره تنظیمات
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'salon_stats' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3">
            <div className={`${c.card} border p-4 rounded-3xl`}>
              <div className={`flex items-center gap-1.5 text-xs ${c.muted} font-bold`}>
                <Users className="w-4 h-4 text-blue-500" /> مراجعین امروز:
              </div>
              <div className="text-xl font-black mt-2 font-mono">
                {salonAnalytics.totalTodayClients.toLocaleString('fa-IR')} <span className={`text-xs ${c.muted}`}>نفر</span>
              </div>
            </div>

            <div className={`${c.card} border p-4 rounded-3xl`}>
              <div className={`flex items-center gap-1.5 text-xs ${c.muted} font-bold`}>
                <TrendingUp className="w-4 h-4 text-emerald-500" /> دخل امروز:
              </div>
              <div className="text-xl font-black mt-2 text-emerald-500 font-mono">
                {salonAnalytics.totalTodayRevenue.toLocaleString('fa-IR')} <span className={`text-xs ${c.muted}`}>تومان</span>
              </div>
            </div>
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-4`}>
            <div className={`flex justify-between items-center border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-3`}>
              <h3 className="text-xs font-black flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> سهم پرسنل از مراجعین امروز
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] ${c.muted} font-mono`}>{todayDate}</span>
                <button
                  onClick={loadData}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="بروزرسانی زنده"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {salonAnalytics.totalTodayClients === 0 ? (
              <p className={`text-xs ${c.muted} text-center py-6`}>امروز هنوز نوبت پرداخت‌شده‌ای ثبت نشده است.</p>
            ) : (
              <div className="space-y-4 pt-1">
                {salonAnalytics.operatorStats.map((stat: any) => {
                  const isCurrent = stat.id === operator.id;
                  return (
                    <div key={stat.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          {stat.name} {isCurrent && <span className="text-[10px] text-emerald-500">(شما)</span>}
                        </span>
                        <div className="font-mono text-xs space-x-2 space-x-reverse">
                          <span className="font-black">{stat.countToday.toLocaleString('fa-IR')} نوبت</span>
                          <span className={`text-[11px] ${c.muted}`}>({stat.percentToday.toLocaleString('fa-IR')}٪)</span>
                        </div>
                      </div>

                      <div className={`w-full h-3 ${isDark ? 'bg-slate-950' : 'bg-slate-200'} rounded-full overflow-hidden p-0.5`}>
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-blue-600"
                          style={{ width: `${Math.max(stat.percentToday, 6)}%` }}
                        ></div>
                      </div>

                      <div className={`flex justify-between text-[11px] ${c.muted} font-mono`}>
                        <span>دخل امروز: {Number(stat.revenueToday).toLocaleString('fa-IR')} تومان</span>
                        <span>مجموع سابقه: {Number(stat.totalClients).toLocaleString('fa-IR')} نوبت</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black">ترتیب نوبت‌های امروز سالن:</h3>
              <button onClick={loadData} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {salonAnalytics.totalTodayClients === 0 ? (
              <p className={`text-xs ${c.muted} text-center py-4`}>صف نوبت‌های امروز خالی است.</p>
            ) : (
              <div className="space-y-2">
                {(db.bookings || [])
                  .filter((b: any) => b.date === todayDate)
                  .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                  .map((b: any) => (
                    <div key={b.id} className={`p-3 ${c.innerCard} border rounded-2xl flex justify-between items-center text-xs`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${isDark ? 'bg-white/10' : 'bg-slate-200'} px-2 py-0.5 rounded text-[11px]`}>
                            {b.start_time} - {b.end_time}
                          </span>
                          <span className="font-bold">{b.customer_name}</span>
                        </div>
                        <div className={`text-[11px] ${c.muted} mt-1`}>
                          آرایشگر: <span className="font-bold text-blue-500">{b.operator_name}</span>
                        </div>
                      </div>
                      <div className="text-left flex flex-col items-end gap-1">
                        <span className="font-mono font-black text-emerald-500">
                          {Number(b.amount).toLocaleString('fa-IR')} ت
                        </span>
                        <button onClick={() => handleCancelBooking(b.id)} className="text-rose-500 text-[10px] hover:underline">
                          لغو نوبت
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {isDeveloper && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAllBookings}
                className="w-full py-2.5 bg-rose-600/15 border border-rose-500/30 hover:bg-rose-600/25 text-rose-400 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                پاک‌سازی و ریست کلیه نوبت‌های تستی
              </button>
            </div>
          )}
        </div>
      )}

      {isDeveloper && activeTab === 'barbers_mgr' && (
        <div className="space-y-4 animate-fadeIn">
          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-white">افزودن آرایشگر جدید به سالن</h3>
                <p className="text-[11px] text-slate-400">آرایشگر جدید بلافاصله در صفحه مشتری اضافه می‌شود</p>
              </div>
            </div>

            <form onSubmit={handleCreateBarber} className="space-y-3">
              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: آرمین یا سهراب"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">نام کاربری ورود:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: armin"
                    value={newBarberUsername}
                    onChange={(e) => setNewBarberUsername(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">رمز عبور ورود:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 789"
                    value={newBarberPassword}
                    onChange={(e) => setNewBarberPassword(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">شماره تماس مستقیم:</label>
                <input
                  type="text"
                  placeholder="مثال: 09123456789"
                  value={newBarberPhone}
                  onChange={(e) => setNewBarberPhone(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                ثبت و فعال‌سازی آرایشگر جدید
              </button>
            </form>
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <h3 className="text-xs font-black text-slate-200">پرسنل فعال سالن الف (مدیریت اطلاعات تماس و اینستاگرام):</h3>
            <div className="space-y-3">
              {(db.operators || [])
                .filter((o: any) => o.role !== 'developer')
                .map((op: any) => (
                  <div key={op.id} className={`p-3.5 ${c.innerCard} border rounded-2xl space-y-2 text-xs`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white text-sm">{op.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mr-2">(@{op.username})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBarber(op.id, op.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                        title="حذف آرایشگر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {editOpId === op.id ? (
                      <div className="space-y-2 pt-2 border-t border-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">شماره تماس مستقیم:</span>
                          <input
                            type="text"
                            value={editOpPhone}
                            onChange={(e) => setEditOpPhone(e.target.value)}
                            className={`w-full ${c.input} border text-xs p-2 rounded-xl font-mono`}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">آیدی اینستاگرام (بدون @):</span>
                          <input
                            type="text"
                            value={editOpInsta}
                            onChange={(e) => setEditOpInsta(e.target.value)}
                            className={`w-full ${c.input} border text-xs p-2 rounded-xl font-mono`}
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAdminUpdateBarber(op.id)}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                          >
                            ذخیره تغییرات
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditOpId(null)}
                            className="py-1.5 px-3 bg-slate-700 text-white rounded-lg text-xs"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-700/50">
                        <div className="text-[11px] text-slate-300 font-mono">
                          <div>تلفن: {op.phone || 'ثبت نشده'}</div>
                          <div>اینستاگرام: {op.instagram ? '@' + op.instagram : 'ثبت نشده'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditOpId(op.id);
                            setEditOpPhone(op.phone || '');
                            setEditOpInsta(op.instagram || '');
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-[11px] font-bold"
                        >
                          ویرایش تماس و پیج
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {isDeveloper && activeTab === 'salon_settings' && (
        <div className="space-y-4 animate-fadeIn">
          <div className={`${c.card} border p-5 rounded-3xl space-y-4`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-black text-white">تنظیمات کارت شیشه‌ای و قوانین رسید</h3>
                <p className="text-[11px] text-slate-400">انحصاری برای اکانت برنامه‌نویس</p>
              </div>
            </div>

            <form onSubmit={handleSaveSalonSettings} className="space-y-3.5">
              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">عنوان و برند سالن:</label>
                <input
                  type="text"
                  value={salonNameInput}
                  onChange={(e) => setSalonNameInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-amber-400 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" /> آدرس دقیق متنی سالن الف:
                </label>
                <textarea
                  rows={2}
                  value={salonAddressInput}
                  onChange={(e) => setSalonAddressInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                />
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">شماره تلفن عمومی سالن:</label>
                <input
                  type="text"
                  value={salonPhoneInput}
                  onChange={(e) => setSalonPhoneInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">آیدی اینستاگرام سالن (بدون @):</label>
                <input
                  type="text"
                  value={salonInstaInput}
                  onChange={(e) => setSalonInstaInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-slate-300">لینک مسیریابی نقشه:</label>
                <input
                  type="text"
                  value={salonMapInput}
                  onChange={(e) => setSalonMapInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                />
              </div>

              <div className="pt-2 border-t border-slate-700/50 space-y-3">
                <span className="text-xs font-black text-amber-400 block flex items-center gap-1">
                  <Info className="w-4 h-4" /> قوانین حضور و کنسلی (نمایش روی رسید پرداخت مشتری):
                </span>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">متن قانون زمان حضور مراجع:</label>
                  <textarea
                    rows={2}
                    value={arrivalRuleInput}
                    onChange={(e) => setArrivalRuleInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">متن قانون کنسلی یا جابجایی نوبت:</label>
                  <textarea
                    rows={2}
                    value={cancellationRuleInput}
                    onChange={(e) => setCancellationRuleInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition active:scale-95"
              >
                ذخیره کلیه تنظیمات و قوانین سالن
              </button>
            </form>
          </div>
        </div>
      )}

      {!isDeveloper && activeTab === 'my_panel' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* بخش تنظیمات اختصاصی آرایشگر (محدودیت پیش‌رزرو و چت‌آیدی بله جهت دریافت اعلان) */}
          <form onSubmit={handleUpdateMyProfile} className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black text-blue-500 flex items-center gap-1.5">
              <User className="w-4 h-4" /> تنظیمات کارتابل و اعلان‌ها:
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] block mb-1 font-bold text-amber-500">
                  محدودیت پیش‌رزرو (نوبت‌ها حداقل از چند ساعت قبل بسته شوند؟)
                </label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={myMinAdvanceHours}
                  onChange={(e) => setMyMinAdvanceHours(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none text-center`}
                />
              </div>

              <div>
                <label className="text-[11px] block mb-1 font-bold text-emerald-400">
                  چت آیدی بله (Bale Chat ID) جهت دریافت اعلان نوبت:
                </label>
                <input
                  type="text"
                  placeholder="عدد چت آیدی خود در بات بله"
                  value={myBaleChatIdInput}
                  onChange={(e) => setMyBaleChatIdInput(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none text-center`}
                />
                <p className="text-[10px] text-slate-400 mt-1">با ارسال پیام به بات سالن در پیام‌رسان بله، چت‌آیدی خود را دریافت و اینجا وارد کنید تا اعلان نوبت‌های جدید برایتان ارسال شود.</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> ذخیره تنظیمات من
            </button>
          </form>

          {/* بخش تعریف کد تخفیف اختصاصی توسط آرایشگر همراه با آمار میزان استفاده */}
          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> تعریف کد تخفیف اختصاصی شما ({operator.name}):
            </h3>

            <div className={`flex ${c.innerCard} p-1 rounded-xl border text-[10px]`}>
              <button
                type="button"
                onClick={() => { setBarberDiscountType('percent'); setBarberDiscountValue('15'); }}
                className={`flex-1 py-1 rounded-lg font-bold transition ${barberDiscountType === 'percent' ? 'bg-amber-500 text-slate-950' : c.muted}`}
              >
                درصدی (٪)
              </button>
              <button
                type="button"
                onClick={() => { setBarberDiscountType('fixed'); setBarberDiscountValue('30000'); }}
                className={`flex-1 py-1 rounded-lg font-bold transition ${barberDiscountType === 'fixed' ? 'bg-amber-500 text-slate-950' : c.muted}`}
              >
                تومانی
              </button>
            </div>

            <form onSubmit={handleBarberAddDiscount} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="کد (مثلاً FARZAD10)"
                  value={barberDiscountCode}
                  onChange={(e) => setBarberDiscountCode(e.target.value)}
                  className={`flex-1 ${c.input} border text-xs p-2.5 rounded-xl uppercase font-mono focus:outline-none`}
                />
                <input
                  type="number"
                  required
                  placeholder={barberDiscountType === 'percent' ? 'درصد' : 'مبلغ'}
                  value={barberDiscountValue}
                  onChange={(e) => setBarberDiscountValue(e.target.value)}
                  className={`w-32 ${c.input} border text-xs p-2.5 rounded-xl text-center focus:outline-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition"
              >
                ثبت کد تخفیف اختصاصی
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-700/50">
              <span className="text-[11px] font-bold block text-slate-300">کدهای تخفیف شما و آمار استفاده:</span>
              {myDiscounts.length === 0 ? (
                <p className={`text-xs ${c.muted} text-center py-3 ${c.innerCard} rounded-xl`}>کد تخفیفی ثبت نکرده‌اید.</p>
              ) : (
                myDiscounts.map((d: any) => (
                  <div key={d.code} className={`flex justify-between items-center p-2.5 ${c.innerCard} border rounded-xl text-xs`}>
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-amber-400">{d.code}</span>
                      <span className={`text-[10px] ${c.muted} block font-mono`}>
                        ({d.type === 'fixed' ? `${Number(d.value).toLocaleString('fa-IR')} تومان` : `${d.value}٪`}) - میزان استفاده: <strong className="text-white font-mono">{d.usage_count || 0} بار</strong>
                      </span>
                    </div>
                    <button onClick={() => handleDeleteDiscount(d.code)} className="text-rose-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`${c.card} border p-4 rounded-3xl`}>
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                <Wallet className="w-4 h-4" /> دخل من امروز:
              </div>
              <div className="text-lg font-black mt-2 font-mono">
                {myTodayIncome.toLocaleString('fa-IR')} <span className={`text-xs ${c.muted}`}>تومان</span>
              </div>
            </div>

            <div className={`${c.card} border p-4 rounded-3xl`}>
              <div className="flex items-center gap-1.5 text-xs text-blue-500 font-bold">
                <Users className="w-4 h-4" /> مراجعین من:
              </div>
              <div className="text-lg font-black mt-2 font-mono">
                {myBookings.length.toLocaleString('fa-IR')} <span className={`text-xs ${c.muted}`}>نفر</span>
              </div>
            </div>
          </div>

          {/* بخش تقویم و شیفت‌کاری به صورت عمودی (زیر هم بدون فاصله اضافی) */}
          <div className={`${c.card} border p-5 rounded-3xl space-y-4`}>
            {/* انتخاب تاریخ (تقویم) */}
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" /> انتخاب تاریخ برای نوبت‌های من:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {shamsiDays.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    className={`py-2 px-1 rounded-xl text-center text-xs border transition flex flex-col items-center justify-center ${
                      selectedDate === d.date
                        ? 'bg-blue-600 text-white font-black shadow-md border-transparent scale-105'
                        : `${c.innerCard}${c.muted}`
                    }`}
                  >
                    <span className="text-[10px] opacity-80">{d.weekday}</span>
                    <span className="font-mono mt-0.5 text-xs font-black">{d.dayNum}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-300 font-bold">
                  وضعیت تاریخ {shamsiDays.find(d => d.date === selectedDate)?.label}:
                </span>
                <button
                  type="button"
                  onClick={handleToggleOffDay}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    (db.off_days || []).some((o: any) => o.operator_id === operator.id && o.date === selectedDate)
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {(db.off_days || []).some((o: any) => o.operator_id === operator.id && o.date === selectedDate)
                    ? 'تعطیل است (کلیک برای باز کردن)'
                    : 'تعطیل کردن این روز (مرخصی)'}
                </button>
              </div>
            </div>

            {/* خط جداکننده منظم */}
            <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-4 space-y-3`}>
              <h3 className="text-xs font-black flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> تعریف شیفت کاری جدید :
              </h3>

              <form onSubmit={handleAddInterval} className="space-y-3">
                <div className="space-y-2.5">
                  <div>
                    <span className={`text-[11px] ${c.muted} block mb-1 font-bold`}>از ساعت شروع:</span>
                    <select
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                    >
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={`text-[11px] ${c.muted} block mb-1 font-bold`}>تا ساعت پایان:</span>
                    <select
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                    >
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 ${c.btnPrimary} rounded-xl text-xs font-bold transition flex items-center justify-center gap-1`}
                >
                  <Plus className="w-4 h-4" /> ذخیره شیفت
                </button>
              </form>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold block">شیفت‌های من در این تاریخ:</label>
                {myIntervalsForSelectedDate.length === 0 ? (
                  <p className={`text-xs ${c.muted} text-center py-2 ${c.innerCard} rounded-xl`}>شیفتی ثبت نشده است.</p>
                ) : (
                  myIntervalsForSelectedDate.map((it: any, idx: number) => (
                    <div key={it.id} className={`flex justify-between items-center p-2.5 ${c.innerCard} border rounded-xl text-xs`}>
                      <span className="font-mono">شیفت {idx + 1}: از {it.start_time} تا {it.end_time}</span>
                      <button onClick={() => handleDeleteInterval(it.id)} className="text-rose-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* بخش آپلود عکس نمونه‌کار توسط آرایشگر */}
          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black text-purple-500 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> آپلود نمونه‌کار جدید ({operator.name}):
            </h3>

            <form onSubmit={handleAddPortfolio} className="space-y-2.5">
              <input
                type="text"
                placeholder="عنوان نمونه‌کار (مثال: فید کلاسیک، سایه‌زنی ریش)"
                value={newPortfolioTitle}
                onChange={(e) => setNewPortfolioTitle(e.target.value)}
                className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
              />

              <div className="space-y-1">
                <span className={`text-[11px] ${c.muted} block`}>انتخاب تصویر از گالری گوشی یا سیستم:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`w-full ${c.input} border text-xs p-2 rounded-xl cursor-pointer`}
                />
              </div>

              {isCompressing && (
                <p className="text-[11px] text-amber-500">در حال بهینه‌سازی تصویر...</p>
              )}

              {newPortfolioImage && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-600 mt-2">
                  <img src={newPortfolioImage} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                </div>
              )}

              <button
                type="submit"
                disabled={isCompressing}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> آپلود و ارسال به گالری نمونه‌کارها
              </button>
            </form>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
              {myPortfolios.map((p: any) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/40 group">
                  <img src={p.image} alt={p.title} className="w-full h-20 object-cover" />
                  <p className="text-[10px] font-bold p-1 truncate text-center">{p.title}</p>
                  <button
                    onClick={() => handleDeletePortfolio(p.id)}
                    className="absolute top-1 left-1 bg-rose-600 text-white p-1 rounded-md opacity-80 hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">مراجعین من در تاریخ انتخابی:</span>
              <button
                onClick={loadData}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="رفرش لیست نوبت‌ها"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {mySelectedDateBookings.length === 0 ? (
              <p className={`text-xs ${c.muted} text-center py-5 ${c.innerCard} rounded-xl`}>
                نوبتی برای شما در این روز ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-2">
                {mySelectedDateBookings.map((b: any) => (
                  <div key={b.id} className={`p-3 ${c.innerCard} border rounded-xl flex justify-between items-center text-xs`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {b.start_time} - {b.end_time}
                        </span>
                        <span className="font-bold">{b.customer_name}</span>
                      </div>
                      <div className={`text-[11px] ${c.muted} font-mono mt-1`}>تماس: {b.customer_phone}</div>
                      <div className={`text-[10px] ${c.muted} mt-0.5`}>خدمات: {(b.services || []).join('، ')}</div>
                    </div>

                    <div className="text-left flex flex-col items-end gap-1">
                      <span className="font-black text-emerald-500">{Number(b.amount).toLocaleString('fa-IR')} ت</span>
                      <button type="button" onClick={() => handleCancelBooking(b.id)} className="text-rose-500 text-[10px] hover:underline cursor-pointer">
                        لغو نوبت
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black text-purple-500 flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> خدمات اختصاصی من ({operator.name}):
            </h3>

            <form onSubmit={handleAddService} className="space-y-2.5">
              <div>
                <label className="text-[11px] block mb-1 text-slate-300 font-bold">عنوان خدمت:</label>
                <input
                  type="text"
                  placeholder="مثال: اصلاح سر و فید تخصصی"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`text-[10px] ${c.muted} block mb-1`}>مدت (دقیقه):</span>
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl text-center focus:outline-none`}
                  />
                </div>
                <div>
                  <span className={`text-[10px] ${c.muted} block mb-1`}>قیمت (تومان):</span>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl text-center focus:outline-none`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> ذخیره در خدمات من
              </button>
            </form>

            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-1.5`}>
              <span className="text-[11px] font-bold block mb-1">لیست خدمات فعال من:</span>
              {myServices.map((srv: any) => (
                <div key={srv.id} className={`flex justify-between items-center p-2.5 ${c.innerCard} border rounded-xl text-xs`}>
                  <div>
                    <span className="font-bold">{srv.title}</span>
                    <span className={`text-[10px] ${c.muted} mr-2 font-mono`}>({Number(srv.duration).toLocaleString('fa-IR')} دقیقه - {Number(srv.price).toLocaleString('fa-IR')} ت)</span>
                  </div>
                  <button type="button" onClick={() => handleDeleteService(srv.id)} className="text-rose-500 p-1 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}