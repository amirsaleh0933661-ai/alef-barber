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
  return { bookings: [], salon_info: {}, operators: [], services: [], intervals: [], discounts: [], off_days: [] };
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

export async function GET(req: Request) {
  const db = await getDb();
  const filteredDb = {
    ...db,
    bookings: (db.bookings || []).filter((b: any) => b.payment_status === 'PAID')
  };
  return NextResponse.json(filteredDb, {
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

      if (booking.payment_status === 'PENDING_PAYMENT' && booking.ref_id) {
        try {
          const tcartApiKey = db.salon_info?.tcart_api_key || process.env.TCART_API_KEY || 'sk_AmPTCVFuTeH5K3xnnae5YaZIhq3Mrrdr9nCbMpU0k38';
          const tcartCheckRes = await fetch(`https://tcartt.com/api/v1/invoices?tracking_code=${booking.ref_id}`, {
            headers: {
              'Authorization': `Bearer ${tcartApiKey}`,
              'Accept': 'application/json'
            }
          });
          
          if (tcartCheckRes.ok) {
            const tcartCheckData = await tcartCheckRes.json();
            if (tcartCheckData && (tcartCheckData.status === 'paid' || tcartCheckData.is_paid || tcartCheckData.paid)) {
              booking.payment_status = 'PAID';
              await saveDb(db);
              return NextResponse.json({ found: true, paid: true, booking });
            }
          }
        } catch (e) {}
      }

      return NextResponse.json({ found: true, paid: false });
    }

    if (body.action === 'confirm_paid_booking') {
      const booking = (db.bookings || []).find((b: any) => b.id === body.booking_id || b.ref_id === body.tracking_code);
      if (booking) {
        booking.payment_status = 'PAID';
        await saveDb(db);
        return NextResponse.json({ success: true, booking });
      }
      return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    if (body.action === 'cancel_booking_by_customer') {
      const code = body.code?.trim().toUpperCase();
      const idx = (db.bookings || []).findIndex((b: any) => (b.ref_id?.toUpperCase() === code || b.id?.toUpperCase() === code) && b.payment_status === 'PAID');
      if (idx === -1) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
      const target = db.bookings[idx];
      const op = db.operators.find((o: any) => o.id === target.operator_id);
      db.bookings.splice(idx, 1);
      await saveDb(db);
      return NextResponse.json({ success: true, operator_name: op?.name || 'آرایشگر', operator_phone: op?.phone || '', date: target.date, time: target.start_time });
    }

    if (body.action === 'request_card_payment') {
      const { operator_id, date, start_time, total_duration, customer_name, customer_phone, services, discount_code, amount, booking_id } = body;
      const opId = Number(operator_id) || 1;
      const op = db.operators.find((o: any) => o.id === opId);
      const barberName = op?.name || 'آرایشگر';

      const reqStartMins = timeToMins(start_time);
      const reqEndMins = reqStartMins + Number(total_duration);
      const reqEndTime = minsToTime(reqEndMins);

      // اضافه شدن ref_id به تایپ‌پدینگ جهت رفع خطای TypeScript
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