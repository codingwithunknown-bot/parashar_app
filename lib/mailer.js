import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Kundali" <no-reply@yourapp.com>',
    to: email,
    subject: 'Your password reset code',
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
  });
}

export async function sendSocialAccountEmail(email, provider) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Kundali" <no-reply@yourapp.com>',
    to: email,
    subject: 'About your password reset request',
    text: `You (or someone) requested a password reset for this email, but this account signed up using ${provider}. Please log in with ${provider} instead. If you'd like to also set a password, you can do so from Account Settings after logging in.`,
  });
}

export async function sendAstrologerPromotionEmail(email, name) {
  const displayName = name || 'there';
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Kundali" <no-reply@yourapp.com>',
    to: email,
    subject: "You're now an astrologer on Parashar! 🎉",
    text:
      `Hi ${displayName},\n\n` +
      `Great news — your account has been upgraded to an Astrologer profile.\n\n` +
      `Before you show up under "Talk to Astrologer" and users can start chatting with you, ` +
      `please open the app and complete your astrologer profile: add your specialization, ` +
      `languages, years of experience, an "about" bio, your profile photo, and your price per minute.\n\n` +
      `Your profile only becomes visible to users once this information is filled in, so please ` +
      `complete it as soon as you can to start receiving chats.\n\n` +
      `Log in to the app to get started.\n\n` +
      `— The Kundali Team`,
  });
}