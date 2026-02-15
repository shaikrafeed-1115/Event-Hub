const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendRegistrationEmail(registration, event) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: registration.email,
    subject: `Registration Confirmed: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Event Registration Confirmed!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${registration.name},</p>
          
          <p style="font-size: 16px; color: #333;">
            Thank you for registering! Your spot has been confirmed for the following event:
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h2 style="color: #667eea; margin-top: 0;">${event.title}</h2>
            <p style="margin: 10px 0; color: #555;"><strong>📅 Date:</strong> ${formatDate(event.date)}</p>
            <p style="margin: 10px 0; color: #555;"><strong>🕐 Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0; color: #555;"><strong>📍 Location:</strong> ${event.location}</p>
            ${event.description ? `<p style="margin: 10px 0; color: #555;"><strong>Description:</strong> ${event.description}</p>` : ''}
          </div>
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Your Registration Details:</h3>
            <p style="margin: 5px 0; color: #555;"><strong>Name:</strong> ${registration.name}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Email:</strong> ${registration.email}</p>
            ${registration.phone ? `<p style="margin: 5px 0; color: #555;"><strong>Phone:</strong> ${registration.phone}</p>` : ''}
            <p style="margin: 5px 0; color: #555;"><strong>Registration ID:</strong> #${registration.id}</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Please save this email for your records. If you need to make any changes or have questions, 
            please contact the event organizer.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            We look forward to seeing you at the event!
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${registration.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

module.exports = { sendRegistrationEmail };
