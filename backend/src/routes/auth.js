'use strict';

const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

/**
 * POST /api/auth/register  — create a new account
 * POST /api/auth/login     — sign in, receive JWT
 * GET  /api/auth/me        — get the current authenticated user
 */

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        requireAuth, getMe);

module.exports = router;
