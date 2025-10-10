import nodemailer from 'nodemailer';
import { getValidationEmailTemplate, getValidationEmailText, getResendValidationEmailTemplate } from './emailTemplates';

// Email service configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'yahoo', 'outlook', etc.
  host: process.env.EMAIL_HOST, // Optional: custom SMTP host
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined, // Optional: custom port
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // App password (not regular password)
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Go-Goyagoy Dental Clinic',
    address: process.env.EMAIL_USER || 'noreply@go-goyagoy.com',
  },
};

/**
 * Create nodemailer transporter
 * @returns {nodemailer.Transporter} Configured transporter
 */
function createTransporter() {
  // If custom host is provided, use it
  if (EMAIL_CONFIG.host && EMAIL_CONFIG.port) {
    return nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.port === 465, // true for 465, false for other ports
      auth: EMAIL_CONFIG.auth,
    });
  }

  // Otherwise use predefined service (gmail, yahoo, etc.)
  return nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: EMAIL_CONFIG.auth,
  });
}

/**
 * Send email validation link to user
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's full name
 * @param {string} validationToken - Validation token
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendValidationEmail(
  to: string,
  name: string,
  validationToken: string
): Promise<boolean> {
  try {
    // Construct validation link
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const validationLink = `${frontendUrl}/validate-email?token=${validationToken}`;

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.address}>`,
      to,
      subject: 'Verify Your Email - Go-Goyagoy Dental Clinic',
      html: getValidationEmailTemplate(name, validationLink),
      text: getValidationEmailText(name, validationLink),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[Email Service] Validation email sent:', {
      to,
      messageId: info.messageId,
      accepted: info.accepted,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending validation email:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[Email Service] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return false;
  }
}

/**
 * Resend validation email with new token
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's full name
 * @param {string} validationToken - New validation token
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendResendValidationEmail(
  to: string,
  name: string,
  validationToken: string
): Promise<boolean> {
  try {
    // Construct validation link
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const validationLink = `${frontendUrl}/validate-email?token=${validationToken}`;

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.address}>`,
      to,
      subject: 'New Verification Link - Go-Goyagoy Dental Clinic',
      html: getResendValidationEmailTemplate(name, validationLink),
      text: getValidationEmailText(name, validationLink),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[Email Service] Resend validation email sent:', {
      to,
      messageId: info.messageId,
      accepted: info.accepted,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending resend validation email:', error);
    
    if (error instanceof Error) {
      console.error('[Email Service] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return false;
  }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[Email Service] Email configuration is valid');
    return true;
  } catch (error) {
    console.error('[Email Service] Email configuration error:', error);
    return false;
  }
}
