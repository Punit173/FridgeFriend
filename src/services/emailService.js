import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '', // Your Gmail address
    pass: '' // Your Gmail password or app password
  }
});

export const sendExpiryNotification = async (item, userEmail) => {
  try {
    // Email template
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <h2 style="color: #dc3545; text-align: center;">⚠️ Expiry Alert ⚠️</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="font-size: 16px; margin-bottom: 10px;">Hello,</p>
          <p style="font-size: 16px; margin-bottom: 10px;">This is to inform you that the following item in your fridge is about to expire:</p>
          <div style="background-color: #fff3f3; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Item:</strong> ${item.product_name}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${item.quantity}</p>
            <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${item.formatted_expiry}</p>
            <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${item.remaining_days} day(s)</p>
          </div>
          <p style="font-size: 16px; margin-top: 20px;">Please take necessary action to prevent food waste.</p>
          <p style="font-size: 16px; margin-top: 20px;">Best regards,<br>FridgeFriend Team</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: 'devanshigenai24@gmail.com',
      to: userEmail,
      subject: `⚠️ Expiry Alert: ${item.product_name}`,
      html: emailTemplate
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 