const express = require('express');
const { makeOnlinePurchase, sendXrp } = require('../controllers/spendController');
const requireUser = require('../middleware/requireUser');

const router = express.Router();

router.post('/purchase', requireUser, makeOnlinePurchase);
router.post('/send', requireUser, sendXrp);

module.exports = router;
