import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin } from '../authStore.js';
import { generateTrackingNumber } from '../trackingNumber.js';

const router = Router();

// helper to wrap async route handlers and surface errors
function wrapAsync(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error('ROUTE ERROR', {
        message: err.message,
        details: err.details || err.hint,
        stack: err.stack,
      });
      const payload = { error: err.message || 'Internal Server Error' };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = err.details || err.hint || JSON.stringify(err, Object.getOwnPropertyNames(err));
        payload.stack = err.stack;
      }
      return res.status(500).json(payload);
    }
  };
}

const REQUIRED_FIELDS = [
  'sender_name',
  'receiver_name',
  'origin',
  'destination',
  'shipment_type',
  'estimated_delivery',
];

// ---------- ADMIN: list all shipments ----------
router.get(
  '/',
  requireAdmin,
  wrapAsync(async (req, res) => {
    const search = (req.query.search || '').trim();

    let query = supabaseAdmin.from('shipments').select('*').order('created_at', { ascending: false });

    if (search) {
      // Search by tracking number, sender, or receiver name
      query = query.or(
        `tracking_number.ilike.%${search}%,sender_name.ilike.%${search}%,receiver_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ shipments: data });
  })
);

// ---------- ADMIN: create shipment ----------
router.post('/', requireAdmin, wrapAsync(async (req, res) => {
  const body = req.body;

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) return res.status(400).json({ error: `Missing required field: ${field}` });
  }

  // Tracking numbers are unique — retry on the rare collision.
  let trackingNumber = generateTrackingNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabaseAdmin
      .from('shipments')
      .select('id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();
    if (!existing) break;
    trackingNumber = generateTrackingNumber();
  }

  const status = body.status || 'packaging';

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .insert({
      tracking_number: trackingNumber,
      courier: body.courier || null,
      sender_name: body.sender_name,
      sender_email: body.sender_email || null,
      sender_phone: body.sender_phone || null,
      receiver_name: body.receiver_name,
      receiver_email: body.receiver_email || null,
      receiver_phone: body.receiver_phone || null,
      origin: body.origin,
      origin_lat: body.origin_lat ?? null,
      origin_lng: body.origin_lng ?? null,
      destination: body.destination,
      destination_lat: body.destination_lat ?? null,
      destination_lng: body.destination_lng ?? null,
      shipment_type: body.shipment_type,
      quantity: body.quantity || 1,
      is_fragile: !!body.is_fragile,
      is_express: !!body.is_express,
      progress_speed: body.progress_speed || 'medium',
      progress_percent: body.progress_percent ?? 0,
      description: body.description || null,
      estimated_delivery: body.estimated_delivery,
      status,
      payment_status: body.payment_status || 'pending',
      amount_to_pay: body.amount_to_pay || null,
      payment_method: body.payment_method || null,
      payment_reason: body.payment_reason || null,
      booked_at: body.booked_at || null,
      shipped_date: body.shipped_date || null,
      estimated_delivery: body.estimated_delivery,
    })
    .select()
    .single();

  if (error) throw error;

  await supabaseAdmin.from('shipment_status_history').insert({
    shipment_id: data.id,
    status,
    note: 'Shipment created',
  });

  // Attach any pre-uploaded image URLs (uploaded via /api/images/upload first)
  if (Array.isArray(body.image_urls) && body.image_urls.length > 0) {
    const rows = body.image_urls.slice(0, 5).map((url) => ({ shipment_id: data.id, url }));
    await supabaseAdmin.from('shipment_images').insert(rows);
  }

  res.json({ shipment: data });
}));

// ---------- ADMIN: get single shipment (with images + history) ----------
router.get('/:id', requireAdmin, wrapAsync(async (req, res) => {
  const { data: shipment, error } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!shipment) return res.status(404).json({ error: 'Not found' });

  const [{ data: images }, { data: history }, { data: updates }] = await Promise.all([
    supabaseAdmin.from('shipment_images').select('*').eq('shipment_id', shipment.id),
    supabaseAdmin
      .from('shipment_status_history')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('changed_at', { ascending: true }),
    supabaseAdmin
      .from('shipment_updates')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('update_time', { ascending: true }),
  ]);

  res.json({
    shipment,
    images: images || [],
    history: history || [],
    updates: updates || [],
  });
}));

// ---------- ADMIN: update shipment ----------
router.patch('/:id', requireAdmin, wrapAsync(async (req, res) => {
  const body = req.body;
  const { data: existing } = await supabaseAdmin
    .from('shipments')
    .select('status')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;

  if (body.status && body.status !== existing.status) {
    await supabaseAdmin.from('shipment_status_history').insert({
      shipment_id: req.params.id,
      status: body.status,
    });
  }

  res.json({ shipment: data });
}));

// ---------- ADMIN: delete shipment ----------
router.delete('/:id', requireAdmin, wrapAsync(async (req, res) => {
  const { error } = await supabaseAdmin.from('shipments').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

// ---------- ADMIN: hold / resume ----------
router.post('/:id/hold', requireAdmin, wrapAsync(async (req, res) => {
  const { action } = req.body; // 'hold' | 'resume'

  const { data: shipment, error: fetchError } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchError || !shipment) return res.status(404).json({ error: 'Not found' });

  if (action === 'hold') {
    if (shipment.is_on_hold) return res.json({ shipment });

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update({ is_on_hold: true, held_at: new Date().toISOString(), status: 'on hold' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('shipment_status_history').insert({
      shipment_id: req.params.id,
      status: 'on hold',
    });

    return res.json({ shipment: data });
  }

  if (action === 'resume') {
    if (!shipment.is_on_hold) return res.json({ shipment });

    const heldSeconds = shipment.held_at
      ? Math.floor((Date.now() - new Date(shipment.held_at).getTime()) / 1000)
      : 0;

    const resumedStatus = shipment.status === 'on hold' ? 'in transit' : shipment.status;

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update({
        is_on_hold: false,
        held_at: null,
        total_held_seconds: shipment.total_held_seconds + heldSeconds,
        status: resumedStatus,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('shipment_status_history').insert({
      shipment_id: req.params.id,
      status: resumedStatus,
      note: `Resumed after ${heldSeconds}s on hold`,
    });

    return res.json({ shipment: data });
  }

  res.status(400).json({ error: 'action must be "hold" or "resume"' });
}));

// ---------- PUBLIC: look up by tracking number (no auth) ----------


// ---------- PUBLIC: look up by tracking number (no auth) ----------
router.get(
  '/public/:trackingNumber',
  wrapAsync(async (req, res) => {
    const code = req.params.trackingNumber.trim().toUpperCase();

    const { data: shipment, error } = await supabaseAdmin
      .from('shipments')
      .select(`
        id,
        tracking_number,
        origin,
        destination,
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng,
        shipment_type,
        quantity,
        estimated_delivery,
        status,
        is_on_hold,
        progress_percent,
        booked_at,
        shipped_date
      `)
      .eq('tracking_number', code)
      .maybeSingle();

    if (error) throw error;
    if (!shipment) {
      return res.status(404).json({
        error: 'No shipment found with that tracking number',
      });
    }

    // Keep the database ID internally, but do not expose it publicly.
    const { id: shipmentId, ...publicShipment } = shipment;

    const [
      { data: images, error: imagesError },
      { data: updates, error: updatesError },
    ] = await Promise.all([
      supabaseAdmin
        .from('shipment_images')
        .select('url')
        .eq('shipment_id', shipmentId),
      supabaseAdmin
        .from('shipment_updates')
        .select('id, message, update_time')
        .eq('shipment_id', shipmentId)
        .order('update_time', { ascending: true }),
    ]);

    if (imagesError) throw imagesError;
    if (updatesError) throw updatesError;

    res.json({
      shipment: publicShipment,
      images: images || [],
      updates: updates || [],
    });
  })
);


// ---------- ADMIN: shipment updates ----------
router.post('/:id/updates', requireAdmin, wrapAsync(async (req, res) => {
  const { message, update_time } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('shipment_updates')
    .insert({
      shipment_id: req.params.id,
      message: message.trim(),
      update_time: update_time ? new Date(update_time).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  res.json({ update: data });
}));

router.delete('/:id/updates/:updateId', requireAdmin, wrapAsync(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('shipment_updates')
    .delete()
    .eq('id', req.params.updateId)
    .eq('shipment_id', req.params.id);

  if (error) throw error;
  res.json({ ok: true });
}));

export default router;
