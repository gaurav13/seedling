const express = require('express');
const { getWalletSecret, unlockLearningWallet, moveLearningToSpending } = require('../controllers/walletController');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');

const router = express.Router();

router.post('/:userId/secret', requireUser, getWalletSecret);
router.post('/:userId/unlock-learning', requireParent, unlockLearningWallet);
router.post('/:userId/move-learning', requireUser, moveLearningToSpending);

module.exports = router;
