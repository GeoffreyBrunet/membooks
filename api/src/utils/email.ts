import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify().then(() => {
  logger.info("smtp connection verified");
}).catch((error) => {
  logger.error("smtp connection failed", {
    error: error instanceof Error ? error.message : String(error),
  });
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    logger.info("sending email", { to: options.to, subject: options.subject });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info("email sent", { to: options.to, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error("failed to send email", {
      to: options.to,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  language: string = "en"
): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  // Use EXPO_DEV_URL for development (exp://192.168.x.x:8081), or membooks:// for production
  const deepLink = process.env.EXPO_DEV_URL
    ? `exp://${process.env.EXPO_DEV_URL}/--/reset-password?token=${token}`
    : `membooks://reset-password?token=${token}`;

  const translations = {
    en: {
      subject: "Reset your password",
      title: "Password Reset Request",
      message: "You requested to reset your password. Click the button below to set a new password:",
      button: "Reset Password",
      mobileButton: "Open in App",
      expiry: "This link will expire in 1 hour.",
      ignore: "If you didn't request this, you can safely ignore this email.",
      orMobile: "Or open directly in the app:",
    },
    fr: {
      subject: "Réinitialiser votre mot de passe",
      title: "Demande de réinitialisation de mot de passe",
      message: "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :",
      button: "Réinitialiser le mot de passe",
      mobileButton: "Ouvrir dans l'app",
      expiry: "Ce lien expirera dans 1 heure.",
      ignore: "Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.",
      orMobile: "Ou ouvrez directement dans l'application :",
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">${t.title}</h1>
              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">${t.message}</p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
                <tr>
                  <td style="background-color: #0066cc; border-radius: 6px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">${t.button}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px 0; color: #6a6a6a; font-size: 14px;">${t.orMobile}</p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: #ffffff; border: 2px solid #0066cc; border-radius: 6px;">
                    <a href="${deepLink}" style="display: inline-block; padding: 12px 24px; color: #0066cc; text-decoration: none; font-size: 14px; font-weight: 500;">${t.mobileButton}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px;">${t.expiry}</p>
              <p style="margin: 0; color: #6a6a6a; font-size: 14px;">${t.ignore}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `${t.title}\n\n${t.message}\n\n${t.button}: ${resetUrl}\n\n${t.orMobile} ${deepLink}\n\n${t.expiry}\n\n${t.ignore}`;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}
