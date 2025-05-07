const express = require('express');
const router = express.Router();
const { getCompanyUsers, getUserProfile, updateUserProfile } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/company', getCompanyUsers);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

module.exports = router; 