const express = require('express');
const { createChore, submitChore, approveChore } = require('../controllers/choreController');
const requireParent = require('../middleware/requireParent');
const requireUser = require('../middleware/requireUser');

const router = express.Router();

router.post('/create', requireParent, createChore);
router.post('/:choreId/submit', requireUser, submitChore);
router.post('/:choreId/approve', requireParent, approveChore);

module.exports = router;
