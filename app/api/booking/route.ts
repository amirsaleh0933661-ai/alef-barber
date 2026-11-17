import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';

const dbPath = path.join(process.cwd(), 'data.json');

const redisUrl = process.env.STORAGE_URL || process.env.REDIS_URL || process.env.KV_URL;
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisClient && redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        lazyConnect: false,
      });
      redisClient.on('error', (err) => console.error('خطای ارتباط با دیتابیس ابری:', err));
    } catch (e) {
      console.error('عدم موفقیت در ساخت کلاینت ردیس:', e);
    }
  }
  return redisClient;
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
    cancellation_rule: 'در صورت انصراف یا نیاز به جابجایی ساعت، لطفاً حداقل ۳ ساعت قبل اطلاع دهید تا حق نوبت سایر مراجعین محفوظ بماند.',
    tcart_api_key: 'sk_AmPTCVFuTeH5K3xnnae5YaZIhq3Mrrdr9nCbMpU0k38'
  },
  operators: [
    { id: 1, name: 'فرزاد', username: 'farzad', password: '123', phone: '09121111111', role: 'barber' },
    { id: 2, name: 'فرهاد', username: 'farhad', password: '456', phone: '09122222222', role: 'barber' },
    { id: 99, name: 'برنامه‌نویس و مدیر کل', username: 'admin', password: 'admin', phone: '', role: 'developer' }
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

async function getDb() {
  const client = getRedis();
  if (client) {
    try {
      const cached = await client.get('alef_barber_db');
      if (cached) {
        memoryDb = JSON.parse(cached);
        return memoryDb;
      }
    } catch (err) {
      console.error('خطا در خواندن از ردیس:', err);
    }
  }

  if (memoryDb) return memoryDb;

  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      memoryDb = JSON.parse(content);
    } else {
      memoryDb = defaultData;
    }
  } catch {
    memoryDb = defaultData;
  }

  return memoryDb;
}

async function saveDb(data: any) {
  memoryDb = data;
  const client = getRedis();

  if (client) {
    try {
      await client.set('alef_barber_db', JSON.stringify(data));
      return;
    } catch (err) {
      console.error('خطا در نوشتن در دیتابیس ابری ردیس:', err);
    }
  }

  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {}
}

export async function GET(req: Request) {
  const db = await getDb();
  // فقط نوبت‌هایی که پرداخت شده‌اند (PAID) به کلاینت و آرایشگر ارسال می‌شوند
  const filteredDb = {
    ...db,
    bookings: (db.bookings || []).filter((b: any) => b.payment_status === 'PAID')
  };
  return NextResponse.json(filteredDb, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();

    if (body.action === 'cancel_booking_by_customer') {
      const code = body.code?.trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ error: 'لطفاً کد رهگیری سفارش را وارد کنید.' }, { status: 400 });
      }

      const bookingIndex = (db.bookings || []).findIndex(
        (b: any) => (b.ref_id?.toUpperCase() === code || b.id?.toUpperCase() === code) && b.payment_status === 'PAID'
      );

      if (bookingIndex === -1) {
        return NextResponse.json({ error: 'نوبت قطعی‌شده‌ای با این کد رهگیری در سیستم یافت نشد.' }, { status: 404 });
      }

      const targetBooking = db.bookings[bookingIndex];
      const op = (db.operators || []).find((o: any) => o.id === targetBooking.operator_id);
      const opName = targetBooking.operator_name || op?.name || 'آرایشگر';
      const opPhone = op?.phone || db.salon_info?.phone || 'شماره تماس سالن';

      db.bookings.splice(bookingIndex, 1);
      await saveDb(db);

      return NextResponse.json({
        success: true,
        operator_name: opName,
        operator_phone: opPhone,
        date: targetBooking.date,
        time: targetBooking.start_time
      });
    }

    if (body.action === 'request_card_payment') {
      const { operator_id, date, start_time, total_duration, customer_name, customer_phone, services, discount_code, amount, booking_id } = body;
      const opId = Number(operator_id) || 1;
      const op = db.operators.find((o: any) => o.id === opId);
      const barberName = op?.name || 'آرایشگر';

      const reqStartMins = timeToMins(start_time);
      const reqEndMins = reqStartMins + Number(total_duration);
      const reqEndTime = minsToTime(reqEndMins);

      // ثبت اولیه با وضعیت PENDING_PAYMENT و فیلد ref_id اختیاری برای جلوگیری از خطای TypeScript
      const pendingBooking: {
        id: any;
        operator_id: number;
        operator_name: any;
        date: any;
        start_time: any;
        end_time: string;
        duration: number;
        customer_name: any;
        customer_phone: any;
        services: any;
        discount_applied: any;
        amount: number;
        payment_status: string;
        created_at: string;
        ref_id?: string;
      } = {
        id: booking_id,
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
      await saveDb(db);

      const tcartApiKey = db.salon_info?.tcart_api_key || process.env.TCART_API_KEY || 'sk_AmPTCVFuTeH5K3xnnae5YaZIhq3Mrrdr9nCbMpU0k38';
      const host = req.headers.get('host') || 'alef-barber.vercel.app';
      // همیشه https را اجبار می‌کنیم تا خطای تیکارت برطرف شود
      const protocol = 'https';

      try {
        const tcartRes = await fetch('https://tcartt.com/api/v1/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tcartApiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount_toman: Number(amount),
            title: `رزرو نوبت سالن الف - ${barberName}`,
            external_order_id: booking_id,
            buyer_ref: customer_phone,
            return_url: `${protocol}/?payment_status=success&booking_id=${booking_id}`,
            callback_url: `${protocol}/api/payment`,
            expires_minutes: 5 // مهلت پرداخت دقیقاً ۵ دقیقه
          })
        });

        const tcartData = await tcartRes.json();

        if (tcartRes.ok && tcartData) {
          pendingBooking.ref_id = tcartData.tracking_code;
          await saveDb(db);

          return NextResponse.json({
            success: true,
            invoice_id: tcartData.invoice_id,
            tracking_code: tcartData.tracking_code,
            unique_amount_toman: tcartData.unique_amount_toman,
            card_number: tcartData.card_number_formatted,
            card_holder: tcartData.card_holder,
            bank_name: tcartData.bank_name
          });
        } else {
          return NextResponse.json({ success: false, error: tcartData.error || 'خطا در صدور فاکتور در تیکارت' });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: 'خطای شبکه در اتصال به تیکارت: ' + err.message });
      }
    }

    if (body.action === 'confirm_paid_booking') {
      const booking = (db.bookings || []).find((b: any) => b.id === body.booking_id);
      if (booking) {
        booking.payment_status = 'PAID';
        await saveDb(db);
        return NextResponse.json({ success: true, booking });
      }
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'خطای سرور: ' + err.message }, { status: 500 });
  }
}