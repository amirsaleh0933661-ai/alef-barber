import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.json');

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function generateDefaultIntervals() {
  const intervals: any[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    let y = '', m = '', day = '';
    for (const p of parts) {
      if (p.type === 'year') y = p.value;
      if (p.type === 'month') m = p.value;
      if (p.type === 'day') day = p.value;
    }
    const fullDate = `${y}/${m}/${day}`;
    intervals.push({ id: `int_1_${i}_a`, operator_id: 1, date: fullDate, start_time: '10:00', end_time: '14:00' });
    intervals.push({ id: `int_1_${i}_b`, operator_id: 1, date: fullDate, start_time: '16:00', end_time: '21:00' });
    intervals.push({ id: `int_2_${i}`, operator_id: 2, date: fullDate, start_time: '11:00', end_time: '20:00' });
  }
  return intervals;
}

const defaultData = {
  current_theme: 'dark',
  salon_info: {
    name: 'سالن پیرایش الف',
    phone: '09120000000',
    address: 'خیابان اصلی، نبش کوچه ششم، پلاک ۱۲، سالن پیرایش الف',
    instagram: 'alef_barber',
    map_url: 'https://maps.google.com',
    welcome_title: 'به سالن پیرایش الف خوش آمدید',
    welcome_text: 'تجربه‌ای متمایز از استایل و پیرایش حرفه‌ای. لطفاً خدمات و زمان مدنظرتان را رزرو کنید.',
    install_prompt_text: 'اگه نمی‌خوای هرسری دنبال لینک نگردی، برنامه رو نصب کن تا با یک لمس همیشه روی صفحه گوشیت باشه!',
    arrival_rule: 'زمان نوبت تقریبی است؛ لطفاً ۵ الی ۱۰ دقیقه قبل از ساعت رزرو در سالن الف حضور داشته باشید.',
    cancellation_rule: 'در صورت انصراف یا نیاز به جابجایی ساعت، لطفاً حداقل ۳ ساعت قبل اطلاع دهید تا حق نوبت سایر مراجعین محفوظ بماند.'
  },
  operators: [
    { id: 1, name: 'فرزاد', username: 'farzad', password: '123', phone: '09121111111', role: 'barber', merchant_id: '' },
    { id: 2, name: 'فرهاد', username: 'farhad', password: '456', phone: '09122222222', role: 'barber', merchant_id: '' },
    { id: 99, name: 'برنامه‌نویس و مدیر کل', username: 'admin', password: 'admin', phone: '', role: 'developer', merchant_id: '' }
  ],
  off_days: [] as { operator_id: number; date: string }[],
  services: [
    { id: 's1', operator_id: 1, title: 'اصلاح کلاسیک و فید تخصصی', duration: 45, price: 200000 },
    { id: 's2', operator_id: 1, title: 'طراحی ریش و خط‌گیری با تیغ', duration: 25, price: 90000 },
    { id: 's3', operator_id: 1, title: 'پکیج VIP مو و پاکسازی فرزاد', duration: 75, price: 380000 },
    { id: 's4', operator_id: 2, title: 'کوپ و استایل مدرن فشن', duration: 45, price: 220000 },
    { id: 's5', operator_id: 2, title: 'فیشیال تخصصی پوست و بلک‌ماسک', duration: 40, price: 250000 },
    { id: 's6', operator_id: 2, title: 'پکیج کامل گریم و اصلاح داماد فرهاد', duration: 120, price: 700000 }
  ],
  portfolios: [
    { id: 'p1', operator_id: 1, title: 'فید کلاسیک و سایه‌زنی', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=60' },
    { id: 'p2', operator_id: 2, title: 'استایل مدرن و فرم‌دهی ریش', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60' }
  ],
  intervals: generateDefaultIntervals(),
  discounts: [
    { code: 'ALEF20', type: 'percent', value: 20, active: true },
    { code: 'VIP50T', type: 'fixed', value: 50000, active: true }
  ],
  bookings: []
};

let memoryDb: any = null;

function getDb() {
  if (memoryDb) return memoryDb;
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
      memoryDb = defaultData;
      return memoryDb;
    }
    const content = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(content);

    if (!parsed.salon_info) parsed.salon_info = defaultData.salon_info;
    if (!parsed.salon_info.arrival_rule) parsed.salon_info.arrival_rule = defaultData.salon_info.arrival_rule;
    if (!parsed.salon_info.cancellation_rule) parsed.salon_info.cancellation_rule = defaultData.salon_info.cancellation_rule;
    if (!parsed.salon_info.address) parsed.salon_info.address = defaultData.salon_info.address;

    if (!parsed.operators || !Array.isArray(parsed.operators) || parsed.operators.length === 0) {
      parsed.operators = defaultData.operators;
    } else {
      const hasFarzad = parsed.operators.some((o: any) => o.username === 'farzad');
      const hasFarhad = parsed.operators.some((o: any) => o.username === 'farhad');
      const hasAdmin = parsed.operators.some((o: any) => o.username === 'admin');

      if (!hasFarzad) parsed.operators.unshift(defaultData.operators[0]);
      if (!hasFarhad) parsed.operators.splice(1, 0, defaultData.operators[1]);
      if (!hasAdmin) parsed.operators.push(defaultData.operators[2]);

      parsed.operators.forEach((op: any) => {
        if (op.merchant_id === undefined) op.merchant_id = '';
      });
    }

    const todayParts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    let ty = '', tm = '', td = '';
    for (const p of todayParts) {
      if (p.type === 'year') ty = p.value;
      if (p.type === 'month') tm = p.value;
      if (p.type === 'day') td = p.value;
    }
    const todayShamsi = `${ty}/${tm}/${td}`;
    const hasTodayIntervals = (parsed.intervals || []).some((it: any) => it.date === todayShamsi);
    if (!hasTodayIntervals) {
      parsed.intervals = generateDefaultIntervals();
    }

    if (!parsed.portfolios) parsed.portfolios = defaultData.portfolios;
    if (!parsed.off_days) parsed.off_days = [];
    if (!parsed.services || parsed.services.length === 0) parsed.services = defaultData.services;

    memoryDb = parsed;
    return memoryDb;
  } catch {
    memoryDb = defaultData;
    return memoryDb;
  }
}

function saveDb(data: any) {
  memoryDb = data;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('ذخیره در حافظه انجام شد:', err);
  }
}

export async function GET() {
  return NextResponse.json(getDb());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();

    if (body.action === 'cancel_booking_by_customer') {
      const code = body.code?.trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ error: 'لطفاً کد رهگیری سفارش را وارد کنید.' }, { status: 400 });
      }

      const bookingIndex = (db.bookings || []).findIndex(
        (b: any) => b.ref_id?.toUpperCase() === code || b.id?.toUpperCase() === code
      );

      if (bookingIndex === -1) {
        return NextResponse.json({ error: 'نوبتی با این کد رهگیری در سیستم یافت نشد.' }, { status: 404 });
      }

      const targetBooking = db.bookings[bookingIndex];
      const op = (db.operators || []).find((o: any) => o.id === targetBooking.operator_id);
      const opName = targetBooking.operator_name || op?.name || 'آرایشگر';
      const opPhone = op?.phone || db.salon_info?.phone || 'شماره تماس سالن';

      db.bookings.splice(bookingIndex, 1);
      saveDb(db);

      return NextResponse.json({
        success: true,
        operator_name: opName,
        operator_phone: opPhone,
        date: targetBooking.date,
        time: targetBooking.start_time
      });
    }

    if (body.action === 'update_salon_info') {
      db.salon_info = {
        name: body.name?.trim() || 'سالن پیرایش الف',
        phone: body.phone?.trim() || '',
        address: body.address?.trim() || '',
        instagram: body.instagram?.trim() || '',
        map_url: body.map_url?.trim() || '',
        welcome_title: body.welcome_title?.trim() || 'به سالن پیرایش الف خوش آمدید',
        welcome_text: body.welcome_text?.trim() || '',
        install_prompt_text: body.install_prompt_text?.trim() || '',
        arrival_rule: body.arrival_rule?.trim() || '',
        cancellation_rule: body.cancellation_rule?.trim() || ''
      };
      saveDb(db);
      return NextResponse.json({ success: true, salon_info: db.salon_info });
    }

    if (body.action === 'update_operator_merchant') {
      const opId = Number(body.operator_id);
      const op = db.operators.find((o: any) => o.id === opId);
      if (!op) return NextResponse.json({ error: 'آرایشگر یافت نشد.' }, { status: 404 });

      op.merchant_id = body.merchant_id?.trim() || '';
      saveDb(db);
      const isConnected = op.merchant_id.length >= 30;
      return NextResponse.json({ success: true, is_connected: isConnected, merchant_id: op.merchant_id });
    }

    if (body.action === 'request_gateway_payment') {
      const { operator_id, date, start_time, total_duration, customer_name, customer_phone, services, discount_code, amount, callback_url } = body;
      const opId = Number(operator_id) || 1;
      const op = db.operators.find((o: any) => o.id === opId);
      const barberName = op?.name || 'آرایشگر';
      const merchantId = op?.merchant_id?.trim();

      const bookingId = 'bk_' + Date.now();
      const reqStartMins = timeToMins(start_time);
      const reqEndMins = reqStartMins + Number(total_duration);
      const reqEndTime = minsToTime(reqEndMins);

      if (merchantId && merchantId.length >= 30) {
        try {
          const finalCallback = callback_url || `http://localhost:3000/api/payment/callback?booking_id=${bookingId}`;
          const zarinpalRes = await fetch('https://payment.zarinpal.com/pg/v4/payment/request.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              merchant_id: merchantId,
              amount: Number(amount),
              currency: 'IRT',
              description: `رزرو نوبت سالن الف - ${barberName} برای ${customer_name}`,
              callback_url: finalCallback,
              metadata: { mobile: customer_phone, order_id: bookingId }
            })
          });

          const zpData = await zarinpalRes.json();
          if (zpData.data && zpData.data.code === 100) {
            const authority = zpData.data.authority;
            const pendingBooking = {
              id: bookingId,
              authority,
              operator_id: opId,
              operator_name: barberName,
              date,
              start_time,
              end_time: reqEndTime,
              duration: Number(total_duration),
              customer_name,
              customer_phone,
              services: services || [],
              discount_applied: discount_code || null,
              amount: Number(amount),
              payment_status: 'PENDING_PAYMENT',
              created_at: new Date().toISOString()
            };
            db.bookings = db.bookings || [];
            db.bookings.unshift(pendingBooking);
            saveDb(db);

            return NextResponse.json({
              success: true,
              is_real_gateway: true,
              payment_url: `https://payment.zarinpal.com/pg/StartPay/${authority}`,
              authority
            });
          }
        } catch (zarinErr) {
          console.error('خطای ارتباط با زرین‌پال:', zarinErr);
        }
      }

      return NextResponse.json({
        success: true,
        is_real_gateway: false
      });
    }

    if (body.action === 'add_operator') {
      const { name, username, password, phone, merchant_id } = body;
      const cleanUser = username.trim().toLowerCase();
      if (db.operators.some((o: any) => o.username.toLowerCase() === cleanUser)) {
        return NextResponse.json({ error: 'این نام کاربری قبلاً ثبت شده است.' }, { status: 400 });
      }

      const newOp = {
        id: Date.now(),
        name: name.trim(),
        username: cleanUser,
        password: password.trim(),
        phone: phone?.trim() || '',
        merchant_id: merchant_id?.trim() || '',
        role: 'barber'
      };

      db.operators.push(newOp);
      saveDb(db);
      return NextResponse.json({ success: true, operator: newOp });
    }

    if (body.action === 'delete_operator') {
      const opId = Number(body.operator_id);
      if (opId === 99) {
        return NextResponse.json({ error: 'حذف اکانت اصلی برنامه‌نویس امکان‌پذیر نیست.' }, { status: 403 });
      }
      db.operators = db.operators.filter((o: any) => o.id !== opId);
      db.services = (db.services || []).filter((s: any) => s.operator_id !== opId);
      db.portfolios = (db.portfolios || []).filter((p: any) => p.operator_id !== opId);
      db.intervals = (db.intervals || []).filter((i: any) => i.operator_id !== opId);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'reset_all_bookings') {
      db.bookings = [];
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle_off_day') {
      const opId = Number(body.operator_id);
      const date = body.date;
      db.off_days = db.off_days || [];
      const exists = db.off_days.some((o: any) => o.operator_id === opId && o.date === date);
      if (exists) {
        db.off_days = db.off_days.filter((o: any) => !(o.operator_id === opId && o.date === date));
      } else {
        db.off_days.push({ operator_id: opId, date });
      }
      saveDb(db);
      return NextResponse.json({ success: true, is_off: !exists });
    }

    if (body.action === 'add_portfolio') {
      const newPortfolio = {
        id: 'port_' + Date.now(),
        operator_id: Number(body.operator_id) || 1,
        title: body.title?.trim() || 'نمونه‌کار پیرایش الف',
        image: body.image
      };
      db.portfolios = db.portfolios || [];
      db.portfolios.unshift(newPortfolio);
      saveDb(db);
      return NextResponse.json({ success: true, portfolio: newPortfolio });
    }

    if (body.action === 'delete_portfolio') {
      db.portfolios = (db.portfolios || []).filter((p: any) => p.id !== body.portfolio_id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'add_service') {
      const newService = {
        id: 'srv_' + Date.now(),
        operator_id: Number(body.operator_id) || 1,
        title: body.title.trim(),
        duration: Number(body.duration) || 30,
        price: Number(body.price) || 100000
      };
      db.services = db.services || [];
      db.services.push(newService);
      saveDb(db);
      return NextResponse.json({ success: true, service: newService });
    }

    if (body.action === 'delete_service') {
      db.services = (db.services || []).filter((s: any) => s.operator_id !== body.service_id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'change_password') {
      const op = db.operators.find((o: any) => o.id === Number(body.operator_id));
      if (!op) return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
      if (body.old_password && op.password !== body.old_password?.trim()) {
        return NextResponse.json({ error: 'رمز عبور فعلی اشتباه است.' }, { status: 400 });
      }
      op.password = body.new_password?.trim();
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'set_theme') {
      db.current_theme = body.theme;
      saveDb(db);
      return NextResponse.json({ success: true, theme: db.current_theme });
    }

    if (body.action === 'add_interval') {
      const newInterval = {
        id: 'int_' + Date.now(),
        operator_id: Number(body.operator_id) || 1,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time
      };
      db.intervals = db.intervals || [];
      db.intervals.push(newInterval);
      saveDb(db);
      return NextResponse.json({ success: true, interval: newInterval });
    }

    if (body.action === 'delete_interval') {
      db.intervals = (db.intervals || []).filter((it: any) => it.id !== body.interval_id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'add_discount') {
      const code = body.code.trim().toUpperCase();
      const discType = body.type === 'fixed' ? 'fixed' : 'percent';
      db.discounts = (db.discounts || []).filter((d: any) => d.code !== code);
      db.discounts.push({
        code,
        type: discType,
        value: Number(body.value),
        active: true
      });
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'delete_discount') {
      db.discounts = (db.discounts || []).filter((d: any) => d.code !== body.code);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'cancel_booking') {
      db.bookings = (db.bookings || []).filter((b: any) => b.id !== body.booking_id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'confirm_paid_booking') {
      const { operator_id, date, start_time, total_duration, customer_name, customer_phone, services, discount_code, amount, transaction_ref } = body;
      const opId = Number(operator_id) || 1;
      const reqStartMins = timeToMins(start_time);
      const reqEndMins = reqStartMins + Number(total_duration);
      const reqEndTime = minsToTime(reqEndMins);

      const op = db.operators.find((o: any) => o.id === opId);
      const newBooking = {
        id: 'bk_' + Date.now(),
        operator_id: opId,
        operator_name: op?.name || 'آرایشگر',
        date,
        start_time,
        end_time: reqEndTime,
        duration: Number(total_duration),
        customer_name,
        customer_phone,
        services: services || [],
        discount_applied: discount_code || null,
        amount: Number(amount),
        ref_id: transaction_ref || ('SHP-' + Math.floor(10000000 + Math.random() * 90000000)),
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      };

      db.bookings = db.bookings || [];
      db.bookings.unshift(newBooking);
      saveDb(db);

      return NextResponse.json({ success: true, booking: newBooking });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'خطای سرور: ' + err.message }, { status: 500 });
  }
}