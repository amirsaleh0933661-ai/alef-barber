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
      redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 2, connectTimeout: 5000 });
    } catch (e) {}
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

async function getDb() {
  const client = getRedis();
  if (client) {
    try {
      const cached = await client.get('alef_barber_db');
      if (cached) return JSON.parse(cached);
    } catch (err) {}
  }
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (e) {}
  return { 
    bookings: [], 
    salon_info: { 
      name: 'سالن پیرایش الف', 
      phone: '09120000000', 
      address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳', 
      instagram: 'alef_salon', 
      map_url: 'https://maps.google.com', 
      arrival_rule: 'لطفاً ۵ دقیقه قبل در سالن حضور داشته باشید.', 
      cancellation_rule: 'کنسلی نوبت تا ۳ ساعت قبل امکان‌پذیر است.',
      tcart_api_key: 'sk_AmPTCVFuTeH5K3xnnae5YaZIhq3Mrrdr9nCbMpU0k38',
      bale_bot_token: ''
    }, 
    operators: [
      { id: 1, name: 'فرزاد', username: 'farzad', password: '123', phone: '09121111111', instagram: 'farzad_barber', min_advance_hours: 3, bale_chat_id: '', role: 'barber' },
      { id: 2, name: 'فرهاد', username: 'farhad', password: '456', phone: '09122222222', instagram: 'farhad_barber', min_advance_hours: 3, bale_chat_id: '', role: 'barber' },
      { id: 99, name: 'برنامه‌نویس و مدیر کل', username: 'admin', password: 'admin', phone: '', role: 'developer' }
    ], 
    services: [], 
    portfolios: [], 
    intervals: [], 
    discounts: [
      { code: 'ALEF20', type: 'percent', value: 20, active: true, operator_id: null, usage_count: 0 },
      { code: 'FARZAD10', type: 'percent', value: 10, active: true, operator_id: 1, usage_count: 0 }
    ], 
    off_days: [] 
  };
}

async function saveDb(data: any) {
  const client = getRedis();
  if (client) {
    try {
      await client.set('alef_barber_db', JSON.stringify(data));
      return;
    } catch (err) {}
  }
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

async function sendBaleNotification(db: any, operatorId: number, bookingDetails: any) {
  try {
    // استفاده از توکن و چت‌آیدی مستقیم شما
    const token = '1548765716:CzJDzh3MI5W2bH8s1wwqEPQ-UUIv4UwtDns';
    const chatId = '1545240903';

    if (!token || !chatId) return;

    const message = `🔔 نوبت جدید و موفق در سالن ثبت شد!\n\n👤 مشتری: ${bookingDetails.customer_name}\n📞 شماره تماس: ${bookingDetails.customer_phone}\n✂️ خدمات: ${(bookingDetails.services || []).join('، ')}\n📅 تاریخ: ${bookingDetails.date}\n⏰ ساعت رزرو: ${bookingDetails.start_time} الی ${bookingDetails.end_time}\n💰 مبلغ پرداختی: ${Number(bookingDetails.amount).toLocaleString('fa-IR')} تومان`;

    await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
  } catch (e) {
    console.error('Bale notification error:', e);
  }
}

export async function GET(req: Request) {
  const db = await getDb();
  return NextResponse.json(db, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();

    if (body.action === 'check_booking_status') {
      const bookingId = body.booking_id;
      const booking = (db.bookings || []).find((b: any) => b.id === bookingId || b.ref_id === bookingId);
      if (!booking) return NextResponse.json({ found: false });
      
      if (booking.payment_status === 'PAID') {
        return NextResponse.json({ found: true, paid: true, booking });
      }
      return NextResponse.json({ found: true, paid: false });
    }

    if (body.action === 'submit_manual_payment_code') {
      const { booking_id, manual_ref } = body;
      const booking = (db.bookings || []).find((b: any) => b.id === booking_id);
      if (booking) {
        booking.payment_status = 'PAID';
        booking.ref_id = manual_ref?.trim() || booking.ref_id;
        
        if (booking.discount_applied) {
          db.discounts = db.discounts || [];
          const disc = db.discounts.find((d: any) => d.code === booking.discount_applied);
          if (disc) {
            disc.usage_count = (disc.usage_count || 0) + 1;
          }
        }

        await saveDb(db);
        
        // ارسال اعلان بله دقیقاً بعد از تأیید پرداخت
        await sendBaleNotification(db, booking.operator_id, booking);

        return NextResponse.json({ success: true, booking });
      }
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    if (body.action === 'cancel_booking' || body.action === 'cancel_booking_by_customer') {
      const bId = body.booking_id || body.code;
      if (!bId) {
        return NextResponse.json({ error: 'شناسه یا کد نوبت ارسال نشده است.' }, { status: 400 });
      }

      const cleanCode = String(bId).trim().toUpperCase();
      db.bookings = db.bookings || [];
      
      const idx = db.bookings.findIndex((b: any) => {
        const idMatch = b.id && String(b.id).trim().toUpperCase() === cleanCode;
        const refMatch = b.ref_id && String(b.ref_id).trim().toUpperCase() === cleanCode;
        return idMatch || refMatch;
      });
      
      if (idx === -1) {
        return NextResponse.json({ error: 'نوبتی با این مشخصات یافت نشد.' }, { status: 404 });
      }
      
      const target = db.bookings[idx];
      const op = (db.operators || []).find((o: any) => o.id === target.operator_id);
      
      db.bookings.splice(idx, 1);
      await saveDb(db);
      
      return NextResponse.json({ 
        success: true, 
        operator_name: op?.name || 'آرایشگر', 
        operator_phone: op?.phone || '', 
        date: target.date, 
        time: target.start_time 
      });
    }

    if (body.action === 'update_salon_info') {
      db.salon_info = {
        ...db.salon_info,
        name: body.name ?? db.salon_info.name,
        phone: body.phone ?? db.salon_info.phone,
        address: body.address ?? db.salon_info.address,
        instagram: body.instagram ?? db.salon_info.instagram,
        map_url: body.map_url ?? db.salon_info.map_url,
        arrival_rule: body.arrival_rule ?? db.salon_info.arrival_rule,
        cancellation_rule: body.cancellation_rule ?? db.salon_info.cancellation_rule,
        tcart_api_key: body.tcart_api_key ?? db.salon_info.tcart_api_key,
        bale_bot_token: body.bale_bot_token ?? db.salon_info.bale_bot_token
      };
      await saveDb(db);
      return NextResponse.json({ success: true, salon_info: db.salon_info });
    }

    if (body.action === 'add_operator') {
      const { name, username, password, phone } = body;
      db.operators = db.operators || [];
      const newOp = {
        id: Date.now(),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        phone: phone ? phone.trim() : '',
        instagram: '',
        min_advance_hours: 3,
        bale_chat_id: '',
        role: 'barber'
      };
      db.operators.push(newOp);
      await saveDb(db);
      return NextResponse.json({ success: true, operator: newOp });
    }

    if (body.action === 'delete_operator') {
      const opId = Number(body.operator_id);
      db.operators = (db.operators || []).filter((o: any) => o.id !== opId);
      db.services = (db.services || []).filter((s: any) => s.operator_id !== opId);
      db.portfolios = (db.portfolios || []).filter((p: any) => p.operator_id !== opId);
      db.intervals = (db.intervals || []).filter((i: any) => i.operator_id !== opId);
      db.discounts = (db.discounts || []).filter((d: any) => d.operator_id !== opId);
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'update_operator_profile') {
      const { operator_id, phone, instagram, min_advance_hours, bale_chat_id } = body;
      const op = (db.operators || []).find((o: any) => o.id === Number(operator_id));
      if (op) {
        if (phone !== undefined) op.phone = phone.trim();
        if (instagram !== undefined) op.instagram = instagram.trim().replace('@', '');
        if (min_advance_hours !== undefined) op.min_advance_hours = Number(min_advance_hours) || 0;
        if (bale_chat_id !== undefined) op.bale_chat_id = bale_chat_id.trim();
        await saveDb(db);
        return NextResponse.json({ success: true, operator: op });
      }
      return NextResponse.json({ error: 'آرایشگر یافت نشد' }, { status: 404 });
    }

    if (body.action === 'add_discount') {
      const { code, type, value, operator_id } = body;
      db.discounts = db.discounts || [];
      const cleanCode = code.trim().toUpperCase();
      const existingIdx = db.discounts.findIndex((d: any) => d.code === cleanCode);
      const newDisc = { 
        code: cleanCode, 
        type: type || 'percent', 
        value: Number(value) || 0, 
        operator_id: operator_id ? Number(operator_id) : null, 
        usage_count: existingIdx >= 0 ? (db.discounts[existingIdx].usage_count || 0) : 0,
        active: true 
      };
      if (existingIdx >= 0) {
        db.discounts[existingIdx] = { ...db.discounts[existingIdx], ...newDisc };
      } else {
        db.discounts.push(newDisc);
      }
      await saveDb(db);
      return NextResponse.json({ success: true, discounts: db.discounts });
    }

    if (body.action === 'delete_discount') {
      db.discounts = (db.discounts || []).filter((d: any) => d.code !== body.code);
      await saveDb(db);
      return NextResponse.json({ success: true, discounts: db.discounts });
    }

    if (body.action === 'add_portfolio') {
      const { operator_id, title, image } = body;
      db.portfolios = db.portfolios || [];
      const newPort = { id: 'p_' + Date.now(), operator_id: Number(operator_id), title, image };
      db.portfolios.unshift(newPort);
      await saveDb(db);
      return NextResponse.json({ success: true, portfolio: newPort });
    }

    if (body.action === 'delete_portfolio') {
      db.portfolios = (db.portfolios || []).filter((p: any) => p.id !== body.portfolio_id);
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'add_service') {
      const { operator_id, title, duration, price } = body;
      db.services = db.services || [];
      const newSrv = { id: 'srv_' + Date.now(), operator_id: Number(operator_id), title, duration: Number(duration), price: Number(price) };
      db.services.push(newSrv);
      await saveDb(db);
      return NextResponse.json({ success: true, service: newSrv });
    }

    if (body.action === 'delete_service') {
      db.services = (db.services || []).filter((s: any) => s.id !== body.service_id);
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'add_interval') {
      const { operator_id, date, start_time, end_time } = body;
      db.intervals = db.intervals || [];
      const newInt = { id: 'int_' + Date.now(), operator_id: Number(operator_id), date, start_time, end_time };
      db.intervals.push(newInt);
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'delete_interval') {
      db.intervals = (db.intervals || []).filter((i: any) => i.id !== body.interval_id);
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle_off_day') {
      const { operator_id, date } = body;
      db.off_days = db.off_days || [];
      const idx = db.off_days.findIndex((o: any) => o.operator_id === Number(operator_id) && o.date === date);
      let is_off = false;
      if (idx >= 0) {
        db.off_days.splice(idx, 1);
        is_off = false;
      } else {
        db.off_days.push({ operator_id: Number(operator_id), date });
        is_off = true;
      }
      await saveDb(db);
      return NextResponse.json({ success: true, is_off });
    }

    if (body.action === 'change_password') {
      const { operator_id, old_password, new_password } = body;
      const op = (db.operators || []).find((o: any) => o.id === Number(operator_id));
      if (op && op.password === old_password) {
        op.password = new_password.trim();
        await saveDb(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'رمز عبور فعلی اشتباه است' }, { status: 400 });
    }

    if (body.action === 'reset_all_bookings') {
      db.bookings = [];
      await saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'request_card_payment') {
      const { operator_id, date, start_time, total_duration, customer_name, customer_phone, services, discount_code, amount, booking_id } = body;
      const opId = Number(operator_id) || 1;
      const op = db.operators.find((o: any) => o.id === opId);
      const barberName = op?.name || 'آرایشگر';

      const reqStartMins = timeToMins(start_time);
      const reqEndMins = reqStartMins + Number(total_duration);
      const reqEndTime = minsToTime(reqEndMins);

      const pendingBooking: any = {
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
      const baseUrl = `https://${host}`;

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
            return_url: `${baseUrl}/?payment_status=success&booking_id=${booking_id}`,
            callback_url: `${baseUrl}/api/payment`,
            expires_minutes: 5
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

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'خطای سرور: ' + err.message }, { status: 500 });
  }
}