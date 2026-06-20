const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendBulk } = require('../controllers/whatsappController');

router.use(protect);
router.post('/send', sendBulk);

module.exports = router;
