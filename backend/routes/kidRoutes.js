const express = require('express');
const { createKidProfile, renderDashboard } = require('../controllers/kidController');
const requireParent = require('../middleware/requireParent');
const requireUser = require('../middleware/requireUser');

const router = express.Router();

router.get('/dashboard', requireUser, renderDashboard);
router.post('/create', requireParent, createKidProfile);

module.exports = router;
