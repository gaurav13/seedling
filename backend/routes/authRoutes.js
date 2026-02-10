const express = require('express');
const { registerParent, loginUser } = require('../controllers/authController');

const router = express.Router();

router.post('/register-parent', registerParent);
router.post('/login', loginUser);

module.exports = router;
