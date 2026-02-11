const express = require('express');
const { registerParent, loginUser, loginKid } = require('../controllers/authController');

const router = express.Router();

router.post('/register-parent', registerParent);
router.post('/login', loginUser);
router.post('/kid-login', loginKid);

module.exports = router;
