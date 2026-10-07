'use strict';

const supabase = require('../config/supabase');

/* ── GET /api/services ─────────────────────────────────────────
   Supports query params:
     ?category=Hospital
     ?city=Lagos
     ?user=me  (requires auth — returns only the caller's services)
   ─────────────────────────────────────────────────────────── */
async function getServices(req, res) {
  try {
    let query = supabase.from('services').select('*');

    // Filter by category
    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }

    // Filter by city
    if (req.query.city) {
      query = query.ilike('city', req.query.city);
    }

    // Filter by owner (authenticated user)
    if (req.query.user === 'me' && req.user) {
      query = query.eq('user_id', req.user.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);

  } catch (err) {
    console.error('getServices error:', err.message);
    return res.status(500).json({ error: 'Failed to load services.' });
  }
}

/* ── GET /api/services/:id ──────────────────────────────────── */
async function getServiceById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('getServiceById error:', err.message);
    return res.status(500).json({ error: 'Failed to load service.' });
  }
}

/* ── POST /api/services (auth required) ─────────────────────── */
async function createService(req, res) {
  try {
    const {
      name,
      category,
      description,
      phone,
      email,
      address,
      city,
      state,
      latitude,
      longitude,
    } = req.body;

    // Required field validation
    if (!name || !category || !city) {
      return res.status(400).json({ error: 'name, category and city are required.' });
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{
        name:        name.trim(),
        category,
        description: description ? description.trim() : null,
        phone:       phone       ? phone.trim()       : null,
        email:       email       ? email.trim().toLowerCase() : null,
        address:     address     ? address.trim()     : null,
        city:        city.trim(),
        state:       state || null,
        latitude:    latitude  || null,
        longitude:   longitude || null,
        is_verified: false,
        user_id:     req.user.id,
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);

  } catch (err) {
    console.error('createService error:', err.message);
    return res.status(500).json({ error: 'Failed to create service.' });
  }
}

/* ── PATCH /api/services/:id (auth required) ────────────────── */
async function updateService(req, res) {
  try {
    const { id } = req.params;

    // Confirm the service exists and belongs to this user (or is admin)
    const { data: existing, error: fetchErr } = await supabase
      .from('services')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this service.' });
    }

    // Build update object from only allowed editable fields
    const allowedFields = [
      'name', 'category', 'description', 'phone', 'email',
      'address', 'city', 'state', 'latitude', 'longitude',
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Admins can also verify a service
    if (req.user.role === 'admin' && req.body.is_verified !== undefined) {
      updates.is_verified = req.body.is_verified;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);

  } catch (err) {
    console.error('updateService error:', err.message);
    return res.status(500).json({ error: 'Failed to update service.' });
  }
}

/* ── DELETE /api/services/:id (auth required) ───────────────── */
async function deleteService(req, res) {
  try {
    const { id } = req.params;

    // Confirm ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('services')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this service.' });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Service deleted successfully.' });

  } catch (err) {
    console.error('deleteService error:', err.message);
    return res.status(500).json({ error: 'Failed to delete service.' });
  }
}

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
