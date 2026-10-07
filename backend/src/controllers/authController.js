'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const supabase = require('../config/supabase');

/* ── Helpers ───────────────────────────────────────────────── */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user) {
  // Never send the password hash back to the client
  const { password_hash, ...safe } = user;
  return safe;
}

/* ── Register ──────────────────────────────────────────────── */
async function register(req, res) {
  try {
    const { full_name, email, phone, password } = req.body;

    // Basic server-side validation
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Check for existing user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        full_name,
        email: email.toLowerCase(),
        phone:  phone || null,
        password_hash,
        role: 'user',
      }])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: safeUser(newUser),
    });

  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/* ── Login ─────────────────────────────────────────────────── */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Fetch user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;

    // Generic message to avoid user enumeration
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: safeUser(user),
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

/* ── Get current user (me) ─────────────────────────────────── */
async function getMe(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: safeUser(user) });

  } catch (err) {
    console.error('GetMe error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
}

module.exports = { register, login, getMe };
