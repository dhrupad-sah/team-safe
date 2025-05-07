const express = require('express');
const router = express.Router();
const { 
  createSecret, 
  getSecrets, 
  getSecretById,
  markAsRead 
} = require('../controllers/secret.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', createSecret);
router.get('/', getSecrets);
router.get('/:id', getSecretById);
router.put('/:id/read', markAsRead);

module.exports = router; 