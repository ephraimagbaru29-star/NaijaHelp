'use strict';

const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/servicesController');

/**
 * GET  /api/services          — public (supports ?category, ?city)
 * GET  /api/services?user=me  — authenticated, returns caller's services
 * GET  /api/services/:id      — public
 * POST /api/services          — authenticated
 * PATCH /api/services/:id     — authenticated (owner or admin)
 * DELETE /api/services/:id    — authenticated (owner or admin)
 */

// Public routes
router.get('/',    getServices);
router.get('/:id', getServiceById);

// Protected routes
router.post('/',     requireAuth, createService);
router.patch('/:id', requireAuth, updateService);
router.delete('/:id', requireAuth, deleteService);

module.exports = router;
