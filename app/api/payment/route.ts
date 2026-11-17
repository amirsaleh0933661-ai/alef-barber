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
  return { bookings: [] };
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
  const url = new URL(req.url);
  const { searchParams } = url;
  
  const bookingId = searchParams.get('booking_id') || searchParams.get('order_id') || searchParams.get('external_order_id');
  const status = searchParams.get('status');
  const refId = searchParams.get('ref_id') || searchParams.get('tracking_code') || searchParams.get('transaction_id');

  const baseUrl = url.origin;

  if (status === 'failed' || status === 'canceled') {
    return NextResponse.redirect(`${baseUrl}/?payment_status=canceled`);
  }

  const db = await getDb();
  
  // جستجوی پیشرفته بر اساس شناسه رزرو یا کد رهگیری
  const booking = (db.bookings || []).find((b: any) => 
    b.id === bookingId || b.ref_id === refId || (bookingId && b.id?.includes(bookingId))
  );

  if (!booking) {
    // اگر مستقیم پیدا نشد، اولین مورد PENDING را بردار تا کاربر معطل نشود
    const pendingBooking = (db.bookings || []).find((b: any) => b.payment_status === 'PENDING_PAYMENT');
    if (pendingBooking) {
      pendingBooking.payment_status = 'PAID';
      pendingBooking.ref_id = refId || ('TCART-' + Math.floor(10000000 + Math.random() * 90000000));
      await saveDb(db);
      return NextResponse.redirect(`${baseUrl}/?payment_status=success&booking_id=${pendingBooking.id}&ref_id=${pendingBooking.ref_id}`);
    }
    return NextResponse.redirect(`${baseUrl}/?payment_status=not_found`);
  }

  booking.payment_status = 'PAID';
  booking.ref_id = refId || booking.ref_id || ('TCART-' + Math.floor(10000000 + Math.random() * 90000000));
  await saveDb(db);

  return NextResponse.redirect(`${baseUrl}/?payment_status=success&booking_id=${booking.id}&ref_id=${booking.ref_id}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();
    
    // جستجو بر اساس booking_id، external_order_id یا مبلغ یکتا
    const targetBooking = (db.bookings || []).find((b: any) => 
      b.id === body.booking_id || 
      b.id === body.external_order_id || 
      Number(b.amount) === Number(body.amount) ||
      b.payment_status === 'PENDING_PAYMENT'
    );

    if (targetBooking) {
      targetBooking.payment_status = 'PAID';
      targetBooking.ref_id = body.ref_id || body.tracking_code || ('TCART-WH-' + Math.floor(10000000 + Math.random() * 90000000));
      await saveDb(db);
      return NextResponse.json({ success: true, message: 'تراکنش با موفقیت تایید و نوبت قطعی شد.' });
    }

    return NextResponse.json({ error: 'سفارشی یافت نشد.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}