'use client';

import { useState, useEffect } from 'react';

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

    days.push({
      date: `${year}/${month}/${day}`,
      dayNum: day,
      weekday: i === 0 ? 'امروز' : i === 1 ? 'فردا' : weekdayFa,
      label: `${weekdayFa} ${day} ${monthFa}`,
    });
  }
  return days;
}

export default function PaymentPage() {
  const [days, setDays] = useState<any[]>([]);

  useEffect(() => {
    // اجرای تاریخ در محیط کلاینت پس از رندر اولیه
    setDays(getShamsiNext7Days());
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-4">
        <h1 className="text-lg font-black">درگاه پرداخت سالن پیرایش الف</h1>
        <p className="text-xs text-slate-400">در حال انتقال یا پردازش نوبت...</p>
        <div className="text-xs text-slate-500 font-mono">
          {days.length > 0 ? `تاریخ فعال: ${days[0].date}` : 'در حال بارگذاری...'}
        </div>
      </div>
    </main>
  );
}