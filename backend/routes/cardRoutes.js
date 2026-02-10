const express = require('express');
const { toggleFreezeCard } = require('../controllers/cardController');
const requireParent = require('../middleware/requireParent');

const router = express.Router();

router.post('/kids/:kidId/freeze', requireParent, toggleFreezeCard);

module.exports = router;
