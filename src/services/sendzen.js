const axios = require('axios');

const SENDZEN_URL = 'https://api.sendzen.io/v1/messages';

/**
 * Send a WhatsApp message via SendZen to a single recipient.
 * If `messageBody` is provided, sends as a custom text message.
 * Otherwise falls back to the configured template.
 */
const sendWhatsApp = async (to, messageBody, templateName, langCode) => {
  const payload = messageBody
    ? {
        from: process.env.SENDZEN_FROM,
        to,
        type: 'text',
        text: { body: messageBody },
      }
    : {
        from: process.env.SENDZEN_FROM,
        to,
        type: 'template',
        template: {
          name: templateName || process.env.SENDZEN_TEMPLATE_NAME,
          lang_code: langCode || process.env.SENDZEN_TEMPLATE_LANG,
        },
      };

  const response = await axios.post(SENDZEN_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.SENDZEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

module.exports = { sendWhatsApp };
