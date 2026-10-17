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
    operators: [
      { id: 1, name: 'فرزاد', username: 'farzad', password: '123', phone: '09121111111', role: 'barber', merchant_id: '' },
      { id: 2, name: 'فرهاد', username: 'farhad', password: '456', phone: '09122222222', role: 'barber', merchant_id: '' },
      { id: 99, name: 'برنامه‌نویس و مدیر کل', username: 'admin', password: 'admin', phone: '', role: 'developer', merchant_id: '' }
    ], 
    services: [], 
    portfolios: [],
    intervals: [], 
    bookings: [], 
    discounts: [], 
    off_days: [],
    salon_info: { name: 'سالن پیرایش الف', phone: '', address: '', instagram: '', map_url: '', arrival_rule: '', cancellation_rule: '' },
    current_theme: 'dark' 
  });

  const [merchantInputs, setMerchantInputs] = useState<{ [key: number]: string }>({});
  const isMerchantInitializedRef = useRef(false);

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
  const [newBarberMerchant, setNewBarberMerchant] = useState('');

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

      if (!isMerchantInitializedRef.current && data.operators) {
        const tokens: { [key: number]: string } = {};
        data.operators.forEach((op: any) => {
          tokens[op.id] = op.merchant_id || '';
        });
        setMerchantInputs(tokens);
        isMerchantInitializedRef.current = true;
      }

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
      } catch { 
        localStorage.removeItem('op_session'); 
      }
    }
    const savedTheme = localStorage.getItem('op_theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('op_theme', newTheme);
    showToast(`تم ${newTheme === 'dark' ? 'مشکی' : 'سفید'} انتخاب شد.`);
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
      showToast('ورود با دسترسی کامل برنامه‌نویس');
      loadData();
      return;
    }

    if ((targetUser === 'farzad' || targetUser === 'op1') && targetPass === '123') {
      const op = { id: 1, name: 'فرزاد', username: 'farzad', role: 'barber' };
      setOperator(op);
      localStorage.setItem('op_session', JSON.stringify(op));
      setActiveTab('salon_stats');
      showToast('خوش آمدید فرزاد عزیز');
      loadData();
      return;
    }

    if ((targetUser === 'farhad' || targetUser === 'op2') && targetPass === '456') {
      const op = { id: 2, name: 'فرهاد', username: 'farhad', role: 'barber' };
      setOperator(op);
      localStorage.setItem('op_session', JSON.stringify(op));
      setActiveTab('salon_stats');
      showToast('خوش آمدید فرهاد عزیز');
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
      showToast(`خوش آمدید ${found.name}`);
      loadData();
      return;
    }

    setLoginError('نام کاربری یا رمز عبور اشتباه است.');
  };

  const handleLogout = () => {
    localStorage.removeItem('op_session');
    setOperator(null);
  };

  const handleSaveMerchantToken = async (opId: number, opName: string) => {
    const token = (merchantInputs[opId] || '').trim();

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_operator_merchant',
        operator_id: opId,
        merchant_id: token
      })
    });

    const result = await res.json();
    if (result.success) {
      if (result.is_connected) {
        showToast(`درگاه شاپرک برای ${opName} فعال و متصل شد ✓`);
      } else {
        showToast(`توکن ذخیره شد (وضعیت: غیرفعال یا ناقص)`, 'error');
      }
      isMerchantInitializedRef.current = false;
      loadData();
    } else {
      showToast('خطا در ذخیره توکن', 'error');
    }
  };

  const handleClearMerchantToken = async (opId: number, opName: string) => {
    setMerchantInputs(prev => ({ ...prev, [opId]: '' }));
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_operator_merchant',
        operator_id: opId,
        merchant_id: ''
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`درگاه برای ${opName} غیرفعال شد.`);
      isMerchantInitializedRef.current = false;
      loadData();
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
        phone: newBarberPhone,
        merchant_id: newBarberMerchant
      })
    });

    const result = await res.json();
    if (result.success) {
      setNewBarberName('');
      setNewBarberUsername('');
      setNewBarberPassword('');
      setNewBarberPhone('');
      setNewBarberMerchant('');
      isMerchantInitializedRef.current = false;
      showToast(`آرایشگر جدید "${result.operator.name}" اضافه شد.`);
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
          showToast(`آرایشگر "${name}" حذف شد.`);
          isMerchantInitializedRef.current = false;
          loadData();
        } else {
          showToast(result.error || 'خطا در حذف', 'error');
        }
      }
    });
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
        welcome_title: welcomeTitleInput,
        welcome_text: welcomeTextInput,
        install_prompt_text: installPromptInput,
        arrival_rule: arrivalRuleInput,
        cancellation_rule: cancellationRuleInput
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast('تنظیمات سالن، متن‌های ولکام و قوانین کنسلی با موفقیت ذخیره شدند.');
      loadData();
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
          showToast('تمام نوبت‌ها صفر شدند.');
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
        showToast('تصویر بهینه‌سازی شد.');
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
      showToast('نمونه‌کار ذخیره شد.');
      loadData();
    } else {
      showToast('خطا در ذخیره نمونه‌کار', 'error');
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
          showToast('نمونه‌کار حذف شد.');
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
      showToast(`خدمت "${newServiceTitle.trim()}" اضافه شد.`);
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
          showToast('خدمت حذف شد.');
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
      showToast(result.is_off ? 'این تاریخ به عنوان روز تعطیل ثبت شد.' : 'این تاریخ به روز کاری بازگشت.');
      loadData();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator) return;

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        operator_id: operator.id,
        old_password: oldPasswordInput,
        new_password: newPasswordInput
      })
    });

    const result = await res.json();
    if (result.success) {
      operator.password = newPasswordInput.trim();
      localStorage.setItem('op_session', JSON.stringify(operator));
      setOldPasswordInput('');
      setNewPasswordInput('');
      showToast('رمز عبور تغییر یافت.');
      loadData();
    } else {
      showToast(result.error || 'خطا در تغییر رمز', 'error');
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
      showToast('شیفت کاری ذخیره شد.');
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
          showToast('شیفت حذف شد.');
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
          showToast('نوبت لغو شد.');
          loadData();
        }
      }
    });
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newDiscountCode.trim().toUpperCase();
    if (!cleanCode) return;
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'add_discount', 
        code: cleanCode, 
        type: discountType,
        value: Number(newDiscountValue) 
      })
    });
    const result = await res.json();
    if (result.success) {
      setNewDiscountCode('');
      showToast(`کد تخفیف ${cleanCode} ایجاد شد.`);
      loadData();
    }
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
          showToast('کد تخفیف حذف شد.');
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
              <span>درگاه‌ها</span>
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
                  <h3 className="text-sm font-black text-white">مدیریت درگاه‌های پرداخت شاپرک (زرین‌پال)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">درآمد هر آرایشگر مستقیماً به حساب خودش واریز می‌شود</p>
                </div>
              </div>
              <button onClick={loadData} className="text-blue-500 p-1.5 hover:bg-slate-800 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {(db.operators || [])
                .filter((o: any) => o.role !== 'developer')
                .map((op: any) => {
                  const currentToken = merchantInputs[op.id] !== undefined ? merchantInputs[op.id] : (op.merchant_id || '');
                  const isConnected = currentToken.trim().length >= 30;

                  return (
                    <div key={op.id} className={`p-4 sm:p-5 ${c.innerCard} border rounded-2xl space-y-3.5 relative overflow-hidden`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{op.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">(@{op.username})</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                            تلفن مستقیم: {op.phone || 'ثبت نشده'}
                          </div>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                          isConnected 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-500/10' 
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                          <span>{isConnected ? 'درگاه متصل و فعال' : 'درگاه غیرفعال / فاقد توکن'}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-300 block font-bold">
                          مرچنت‌کد ۳۶ رقمی زرین‌پال شاپرک برای {op.name}:
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={currentToken}
                          onChange={(e) => setMerchantInputs({ ...merchantInputs, [op.id]: e.target.value })}
                          className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none tracking-wider`}
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        {isConnected && (
                          <button
                            type="button"
                            onClick={() => handleClearMerchantToken(op.id, op.name)}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            حذف توکن
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveMerchantToken(op.id, op.name)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          ذخیره و فعال‌سازی درگاه
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 leading-relaxed space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" /> راهنمای دریافت وجه:
              </p>
              <p className="text-[11px] text-slate-300">
                • به محض اینکه مرچنت‌کد ۳۶ رقمی زرین‌پال را وارد کرده و دکمه ذخیره را بزنید، چراغ سبز می‌شود.
                <br />
                • از آن لحظه به بعد، هر مشتری که نوبت آن فرد را رزرو کند، مستقیماً به شاپرک منتقل شده و پول مستقیماً به شبای ثبت‌شده در پنل زرین‌پال همان فرد واریز می‌گردد.
              </p>
            </div>
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
              <span className={`text-[11px] ${c.muted} font-mono`}>{todayDate}</span>
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
              <button onClick={loadData} className="text-blue-500">
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
                      <div className="font-mono font-black text-emerald-500">
                        {Number(b.amount).toLocaleString('fa-IR')} ت
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
                <label className="text-[11px] block mb-1 font-bold text-slate-300">شماره تماس مستقیم (جهت نمایش به مشتری):</label>
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
            <h3 className="text-xs font-black text-slate-200">پرسنل فعال سالن الف:</h3>
            <div className="space-y-2">
              {(db.operators || [])
                .filter((o: any) => o.role !== 'developer')
                .map((op: any) => (
                  <div key={op.id} className={`p-3.5 ${c.innerCard} border rounded-2xl flex justify-between items-center text-xs`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{op.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">(@{op.username})</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-1">
                        تلفن مستقیم: {op.phone || 'ثبت نشده'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        رمز ورود: {op.password}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBarber(op.id, op.name)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                      title="حذف آرایشگر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                <h3 className="text-sm font-black text-white">تنظیمات کارت شیشه‌ای، دکمه‌ها و متن‌های قوانین رسید</h3>
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
                  <Home className="w-3.5 h-3.5" /> آدرس دقیق متنی سالن الف (نمایش در کارت شیشه‌ای):
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
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">
                    متن قانون زمان حضور مراجع (چند دقیقه زودتر تشریف بیاورند):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: زمان نوبت تقریبی است؛ لطفاً ۵ الی ۱۰ دقیقه قبل در سالن الف حضور داشته باشید."
                    value={arrivalRuleInput}
                    onChange={(e) => setArrivalRuleInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">
                    متن قانون کنسلی یا جابجایی نوبت (چند ساعت زودتر اطلاع دهند):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: در صورت انصراف یا نیاز به تغییر ساعت، لطفاً حداقل ۳ ساعت قبل هماهنگ فرمایید تا حق نوبت سایر مراجعین محفوظ بماند."
                    value={cancellationRuleInput}
                    onChange={(e) => setCancellationRuleInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50 space-y-3">
                <span className="text-xs font-black text-cyan-400 block flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> تنظیمات متن‌های پنجره خوش‌آمدگویی و نصب:
                </span>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">تیتر پنجره خوش‌آمدگویی:</label>
                  <input
                    type="text"
                    value={welcomeTitleInput}
                    onChange={(e) => setWelcomeTitleInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-slate-300">توضیحات پنجره خوش‌آمدگویی:</label>
                  <textarea
                    rows={2}
                    value={welcomeTextInput}
                    onChange={(e) => setWelcomeTextInput(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none leading-relaxed`}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1 font-bold text-emerald-400">متن پیام پیشنهاد نصب برنامه (PWA):</label>
                  <textarea
                    rows={2}
                    value={installPromptInput}
                    onChange={(e) => setInstallPromptInput(e.target.value)}
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

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> تعریف کد تخفیف:
              </h3>
              <div className={`flex ${c.innerCard} p-1 rounded-xl border text-[10px]`}>
                <button
                  type="button"
                  onClick={() => { setDiscountType('percent'); setNewDiscountValue('20'); }}
                  className={`px-2 py-1 rounded-lg font-bold transition ${
                    discountType === 'percent' ? 'bg-amber-500 text-slate-950' : c.muted
                  }`}
                >
                  درصدی (٪)
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountType('fixed'); setNewDiscountValue('50000'); }}
                  className={`px-2 py-1 rounded-lg font-bold transition ${
                    discountType === 'fixed' ? 'bg-amber-500 text-slate-950' : c.muted
                  }`}
                >
                  تومانی (مبلغی)
                </button>
              </div>
            </div>

            <form onSubmit={handleAddDiscount} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="کد (مثلاً ALEF20)"
                  value={newDiscountCode}
                  onChange={(e) => setNewDiscountCode(e.target.value)}
                  className={`flex-1 ${c.input} border text-xs p-2.5 rounded-xl uppercase font-mono focus:outline-none`}
                />
                <input
                  type="number"
                  required
                  placeholder={discountType === 'percent' ? 'درصد' : 'مبلغ به تومان'}
                  value={newDiscountValue}
                  onChange={(e) => setNewDiscountValue(e.target.value)}
                  className={`w-32 ${c.input} border text-xs p-2.5 rounded-xl text-center focus:outline-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition"
              >
                ایجاد کد تخفیف {discountType === 'percent' ? 'درصدی' : 'تومانی'}
              </button>
            </form>

            <div className={`flex flex-wrap gap-2 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {(db.discounts || []).map((d: any) => {
                const isFixed = d.type === 'fixed';
                const val = d.value ?? d.percent;
                return (
                  <div key={d.code} className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs border ${c.innerCard}`}>
                    <span className="font-mono font-bold text-amber-500">{d.code}</span>
                    <span className={`text-[10px] ${c.muted} font-mono`}>
                      ({isFixed ? `${Number(val).toLocaleString('fa-IR')} تومان` : `${Number(val).toLocaleString('fa-IR')}٪`})
                    </span>
                    <button onClick={() => handleDeleteDiscount(d.code)} className="text-rose-500 p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isDeveloper && activeTab === 'my_panel' && (
        <div className="space-y-4 animate-fadeIn">
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

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
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

            <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
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

          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-500" /> تعریف شیفت کاری جدید برای من:
            </h3>

            <form onSubmit={handleAddInterval} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={`text-[11px] ${c.muted} block mb-1`}>از ساعت:</span>
                  <select
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className={`w-full ${c.input} border text-xs p-2.5 rounded-xl font-mono focus:outline-none`}
                  >
                    {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span className={`text-[11px] ${c.muted} block mb-1`}>تا ساعت:</span>
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

            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-1.5`}>
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

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">مراجعین من در تاریخ انتخابی:</span>
              <button onClick={loadData} className="text-blue-500">
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
                      <div className="text-[10px] text-amber-500 font-mono mt-0.5">شاپرک: {b.ref_id}</div>
                    </div>

                    <div className="text-left flex flex-col items-end gap-1">
                      <span className="font-black text-emerald-500">{Number(b.amount).toLocaleString('fa-IR')} ت</span>
                      <button onClick={() => handleCancelBooking(b.id)} className="text-rose-500 text-[10px] hover:underline">
                        لغو نوبت
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3.5`}>
            <h3 className="text-xs font-black text-blue-500 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> آپلود نمونه‌کار اختصاصی {operator.name}:
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
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> ذخیره در نمونه‌کارهای من
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
                  <button onClick={() => handleDeleteService(srv.id)} className="text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`${c.card} border p-5 rounded-3xl space-y-3`}>
            <h3 className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <KeyRound className="w-4 h-4 text-blue-500" /> تغییر رمز عبور حساب من ({operator.name}):
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-2.5">
              <input
                type="password"
                required
                placeholder="رمز عبور فعلی شما"
                value={oldPasswordInput}
                onChange={(e) => setOldPasswordInput(e.target.value)}
                className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
              />
              <input
                type="password"
                required
                placeholder="رمز عبور جدید"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className={`w-full ${c.input} border text-xs p-2.5 rounded-xl focus:outline-none`}
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> ذخیره رمز عبور جدید
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}