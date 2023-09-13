export const verificationCodeTemplate = (code: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Verification Code</title>
    </head>
    <body>
      <p>Dear user,</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>Please enter this code in the appropriate field to complete your verification process.</p>
      <p>Thank you for using our service!</p>
    </body>
  </html>
`;

export const resetPasswordTemplate = (passwordResetUrl: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Password Reset</title>
    </head>
    <body>
      <h1>Password Reset</h1>
      <p>Hello [username],</p>
      <p>We received a request to reset your password. If you did not make this request, please ignore this email.</p>
      <p>To reset your password, please click the following link:</p>
      <p><a href="${passwordResetUrl}">Reset Password</a></p>
      <p>If the link above does not work, please copy and paste the following URL into your web browser:</p>
      <p>[passwordResetLink]</p>
      <p>This link will expire in 24 hours.</p>
      <p>Thank you,</p>
      <p>The [companyName] Team</p>
    </body>
  </html>
`;
