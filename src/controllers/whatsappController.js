const { sendWhatsApp } = require('../services/sendzen');

/**
 * POST /api/whatsapp/send
 * Body: { recipients: [{ phone, name }], templateName?, langCode? }
 * Sends a WhatsApp template message to each recipient.
 */
const sendBulk = async (req, res, next) => {
  try {
    const { recipients, templateName, langCode } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients provided' });
    }

    const results = [];

    for (const recipient of recipients) {
      let phone = String(recipient.phone).replace(/\D/g, '');
      // Normalize to international format: 10-digit Indian numbers → prepend 91
      if (phone.length === 10) phone = '91' + phone;
      if (!phone || phone.length < 10) {
        results.push({ phone: recipient.phone, name: recipient.name, status: 'skipped', reason: 'Invalid phone' });
        continue;
      }

      try {
        const data = await sendWhatsApp(phone, recipient.message || null, templateName, langCode);
        results.push({ phone, name: recipient.name, status: 'sent', data });
      } catch (err) {
        results.push({
          phone,
          name: recipient.name,
          status: 'failed',
          reason: err.response?.data?.message || err.message,
        });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    res.json({ success: true, sent, failed, results });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendBulk };
