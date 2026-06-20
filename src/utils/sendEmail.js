const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (to, otp, name) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Vidyanet ERP — Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1e1b4b;margin:0 0 8px;">Password Reset</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Hi ${name}, use the OTP below to reset your password. It expires in <strong>15 minutes</strong>.</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your OTP</p>
          <p style="font-size:36px;font-weight:700;letter-spacing:12px;color:#4f46e5;margin:0;">${otp}</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:0;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;margin:0;">Vidyanet ERP — School Management System</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
