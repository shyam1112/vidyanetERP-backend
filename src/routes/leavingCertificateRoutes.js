const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTemplate, saveTemplate } = require('../controllers/leavingCertificateController');

router.use(protect);
router.get('/template', getTemplate);
router.put('/template', saveTemplate);

module.exports = router;
