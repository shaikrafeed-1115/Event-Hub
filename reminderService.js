const cron = require('node-cron');
const nodemailer = require('nodemailer');
const db = require('./database');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Run every day at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running event reminder check...');
  checkAndSendReminders();
});

async function checkAndSendReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  // Get events happening tomorrow that haven't sent reminders
  db.all(
    `SELECT * FROM events WHERE date = ? AND reminder_sent = 0`,
    [tomorrowDate],
    (err, events) => {
      if (err) {
        console.error('Error fetching events:', err);
        return;
      }

      events.forEach(event => {
        // Get all registrations for this event
        db.all(
          `SELECT * FROM registrations WHERE event_id = ? AND reminder_sent = 0`,
          [event.id],
          async (err, registrations) => {
            if (err) {
              console.error('Error fetching registrations:', err);
              return;
            }

            // Send reminder to each registered user
            for (const registration of registrations) {
              await sendReminderEmail(registration, event);
              
              // Mark reminder as sent
              db.run(
                `UPDATE registrations SET reminder_sent = 1 WHERE id = ?`,
                [registration.id]
              );
            }

            // Mark event reminder as sent
            db.run(
              `UPDATE events SET reminder_sent = 1 WHERE id = ?`,
              [event.id]
            );
          }
        );
      });
    }
  );
}

async function sendReminderEmail(registration, event) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: registration.email,
    subject: `Reminder: ${event.title} is Tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">⏰ Event Reminder</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${registration.name},</p>
          
          <p style="font-size: 16px; color: #333;">
            This is a friendly reminder that your event is happening <strong>tomorrow</strong>!
          </p>
          
          <div style="background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h2 style="color: #856404; margin-top: 0;">${event.title}</h2>
            <p style="margin: 10px 0; color: #856404;"><strong>📅 Date:</strong> ${formatDate(event.date)}</p>
            <p style="margin: 10px 0; color: #856404;"><strong>🕐 Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0; color: #856404;"><strong>📍 Location:</strong> ${event.location}</p>
          </div>
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Important Reminders:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Please arrive 15 minutes early</li>
              <li>Bring a valid ID for check-in</li>
              <li>Check the weather and dress accordingly</li>
              <li>Save this email for reference</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            We're excited to see you tomorrow! If you have any questions, please contact the event organizer.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated reminder email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${registration.email}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
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

module.exports = { checkAndSendReminders };
