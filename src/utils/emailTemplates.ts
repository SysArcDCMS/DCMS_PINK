/**
 * Email validation template
 * @param {string} name - User's full name
 * @param {string} validationLink - Full URL with validation token
 * @returns {string} HTML email template
 */
export function getValidationEmailTemplate(name: string, validationLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Go-Goyagoy Dental Clinic</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #030213; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Go-Goyagoy</h1>
              <p style="margin: 8px 0 0 0; color: #e0e0e0; font-size: 14px;">Dental Clinic Management System</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #030213; font-size: 24px;">Welcome, ${name}!</h2>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                Thank you for signing up with Go-Goyagoy Dental Clinic. To complete your registration and start booking appointments, please verify your email address.
              </p>

              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 24px;">
                Click the button below to verify your email:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${validationLink}" style="display: inline-block; padding: 14px 40px; background-color: #030213; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 30px 0; padding: 12px; background-color: #f4f4f4; border-radius: 4px; word-break: break-all;">
                <a href="${validationLink}" style="color: #030213; text-decoration: none; font-size: 13px;">${validationLink}</a>
              </p>

              <!-- Expiry Notice -->
              <div style="padding: 16px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 20px;">
                  ⚠️ <strong>Important:</strong> This link will expire in 24 hours for security reasons.
                </p>
              </div>

              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 20px;">
                If you didn't create an account, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; text-align: center; line-height: 18px;">
                This email was sent by Go-Goyagoy Dental Clinic Management System
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 18px;">
                If you have any questions, please contact your dental clinic administrator.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version of validation email (fallback)
 * @param {string} name - User's full name
 * @param {string} validationLink - Full URL with validation token
 * @returns {string} Plain text email
 */
export function getValidationEmailText(name: string, validationLink: string): string {
  return `
Welcome to Go-Goyagoy Dental Clinic, ${name}!

Thank you for signing up. To complete your registration and start booking appointments, please verify your email address.

Click the link below to verify your email:
${validationLink}

IMPORTANT: This link will expire in 24 hours for security reasons.

If you didn't create an account, please ignore this email.

---
Go-Goyagoy Dental Clinic Management System
  `.trim();
}

/**
 * Resend validation email template (slightly different messaging)
 * @param {string} name - User's full name
 * @param {string} validationLink - Full URL with validation token
 * @returns {string} HTML email template
 */
export function getResendValidationEmailTemplate(name: string, validationLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Verification Link - Go-Goyagoy Dental Clinic</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #030213; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Go-Goyagoy</h1>
              <p style="margin: 8px 0 0 0; color: #e0e0e0; font-size: 14px;">Dental Clinic Management System</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #030213; font-size: 24px;">New Verification Link</h2>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                Hi ${name},
              </p>

              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                You requested a new email verification link. Click the button below to verify your email address and activate your account.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${validationLink}" style="display: inline-block; padding: 14px 40px; background-color: #030213; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 30px 0; padding: 12px; background-color: #f4f4f4; border-radius: 4px; word-break: break-all;">
                <a href="${validationLink}" style="color: #030213; text-decoration: none; font-size: 13px;">${validationLink}</a>
              </p>

              <!-- Expiry Notice -->
              <div style="padding: 16px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 20px;">
                  ⚠️ <strong>Important:</strong> This new link will expire in 24 hours. Your previous verification link has been invalidated.
                </p>
              </div>

              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 20px;">
                If you didn't request this email, please contact support immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; text-align: center; line-height: 18px;">
                This email was sent by Go-Goyagoy Dental Clinic Management System
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 18px;">
                If you have any questions, please contact your dental clinic administrator.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
