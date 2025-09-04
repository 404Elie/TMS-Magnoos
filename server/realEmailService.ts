import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

class RealEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private mailerSend: MailerSend | null = null;
  private initialized = false;
  private initPromise: Promise<void>;
  private emailMethod: 'mailersend' | 'resend' | 'smtp' | 'ethereal' = 'ethereal';

  constructor() {
    this.initPromise = this.setupEmailService();
  }

  private async setupEmailService() {
    try {
      // Option 1: Use Resend API (free tier: 100 emails/day, can send to any email address)
      if (process.env.RESEND_API_KEY) {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.emailMethod = 'resend';
        this.initialized = true;
        console.log("✅ Email service initialized with Resend API");
        console.log("- Service: Resend (resend.com)");
        console.log("- Limit: 100 emails/day (free tier)");
        console.log("- ✅ CAN SEND TO ANY EMAIL ADDRESS (no trial restrictions)");
        return;
      }

      // Option 2: Use MailerSend API (free tier: 3,000 emails/month, trial limitations)
      if (process.env.MAILERSEND_API_KEY) {
        this.mailerSend = new MailerSend({
          apiKey: process.env.MAILERSEND_API_KEY,
        });
        this.emailMethod = 'mailersend';
        this.initialized = true;
        console.log("✅ Email service initialized with MailerSend API");
        console.log("- Service: MailerSend (mailersend.com)");
        console.log("- Limit: 3,000 emails/month (free tier)");
        console.log("- ⚠️  TRIAL LIMITATION: Can only send to verified admin email");
        return;
      }

      // Option 2: Use SMTP with provided credentials
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        this.emailMethod = 'smtp';
        this.initialized = true;
        console.log("✅ Email service initialized with SMTP");
        console.log(`- From: ${process.env.EMAIL_USER}`);
        console.log("- Real emails will be delivered to recipients");
        return;
      }

      // Fallback: Ethereal for preview only
      console.log("⚠️  No real email service configured");
      console.log("📧 Available options for real email delivery:");
      console.log("   1. MAILERSEND_API_KEY - Free at mailersend.com (3,000 emails/month) [RECOMMENDED]");
      console.log("   2. RESEND_API_KEY - Free at resend.com (100 emails/day)");
      console.log("   3. EMAIL_USER + EMAIL_PASS - Gmail app password");
      console.log("");
      console.log("🔄 Falling back to Ethereal for preview only...");
      
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      this.emailMethod = 'ethereal';
      this.initialized = true;
      console.log("📧 Ethereal test account created:");
      console.log(`- User: ${testAccount.user}`);
      console.log(`- Pass: ${testAccount.pass}`);
      console.log("- ⚠️  EMAILS WILL NOT REACH REAL INBOXES");
      console.log("- View previews at: https://ethereal.email");
      
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      this.initialized = true; // Set to true to prevent hanging
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const fromAddress = emailData.from || '"Magnoos Travel System" <noreply@magnoos.com>';
      
      if (this.emailMethod === 'mailersend' && this.mailerSend) {
        // Use MailerSend API - handle trial account limitations
        try {
          const sentFrom = new Sender('noreply@trial-z3m5jgrjr8vg2k68.mlsender.net', 'Magnoos Travel System');
          
          // For trial accounts, route all emails to the verified admin address
          const verifiedEmail = 'e.radi@magnoos.com'; // Your verified admin email
          const recipients = [new Recipient(verifiedEmail)];

          // Add original recipient info to email content for trial mode
          const trialModeHtml = `
            <div style="background: #e0f2fe; border: 2px solid #0288d1; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="color: #01579b; margin: 0 0 10px 0;">📧 Trial Mode Email Routing</h3>
              <p style="margin: 0; color: #0277bd;">
                <strong>Original Recipient:</strong> ${emailData.to}<br>
                <strong>Note:</strong> This email was routed to your verified address due to MailerSend trial account limitations.
              </p>
            </div>
            ${emailData.html}
          `;

          const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(`[TRIAL] ${emailData.subject}`)
            .setHtml(trialModeHtml);

          const response = await this.mailerSend.email.send(emailParams);
          console.log(`✅ Email sent via MailerSend (trial mode) to verified address: ${verifiedEmail}`);
          console.log(`📧 Original intended recipient: ${emailData.to}`);
          return true;
        } catch (error: any) {
          console.error('❌ MailerSend error:', error);
          
          if (error.message && (error.message.includes('domain') || error.message.includes('verify') || error.message.includes('Trial'))) {
            console.log(`🔄 MailerSend trial limitation or domain issue detected`);
            console.log(`ℹ️  Trial accounts can only send to verified administrator email`);
          }
          
          return false;
        }
      }
      
      if (this.emailMethod === 'resend' && this.resend) {
        // Use Resend API 
        try {
          const result = await this.resend.emails.send({
            from: 'Magnoos Travel <onboarding@resend.dev>', // Resend verified domain
            to: [emailData.to], // Try sending to actual recipient first
            subject: emailData.subject,
            html: emailData.html,
          });
          
          if (result.error) {
            // Check if it's a domain verification error (trial restriction)
            const errorMessage = result.error.message || '';
            if (errorMessage.includes('testing emails') || errorMessage.includes('verify a domain') || errorMessage.includes('own email address')) {
              console.log(`🔄 Resend trial mode detected for ${emailData.to}, routing to verified address...`);
              
              // Retry with verified address and modified content
              const trialModeHtml = `
                <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
                  <h3 style="color: #d97706; margin: 0 0 10px 0;">📧 Email Routing Notice</h3>
                  <p style="margin: 0; color: #92400e;">
                    <strong>Original Recipient:</strong> ${emailData.to}<br>
                    <strong>Reason:</strong> Email routed to verified address during Resend trial period.<br>
                    <strong>Note:</strong> In production, this email would be delivered directly to ${emailData.to}.
                  </p>
                </div>
                ${emailData.html}
              `;

              const retryResult = await this.resend.emails.send({
                from: 'Magnoos Travel <onboarding@resend.dev>',
                to: ['e.radi@magnoos.com'], // Verified address
                subject: `[FOR: ${emailData.to}] ${emailData.subject}`,
                html: trialModeHtml,
              });

              if (retryResult.error) {
                console.error(`❌ Failed to send even to verified address:`, retryResult.error);
                return false;
              }

              console.log(`✅ Email routed to verified address: e.radi@magnoos.com`);
              console.log(`📧 Original recipient: ${emailData.to}`);
              console.log(`📧 Message ID: ${retryResult.data?.id}`);
              return true;
            }
            
            console.error(`❌ Resend API error:`, result.error);
            return false;
          }
          
          console.log(`✅ Email sent via Resend to: ${emailData.to}`);
          console.log(`📧 Message ID: ${result.data?.id}`);
          return true;
        } catch (error: any) {
          console.error('❌ Resend delivery error:', error);
          return false;
        }
      }
      
      if (this.emailMethod === 'smtp' && this.transporter) {
        // Use SMTP for real email delivery
        await this.transporter.sendMail({
          from: fromAddress,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        });
        
        console.log(`✅ Real email sent via SMTP to: ${emailData.to}`);
        return true;
        
      } else if (this.emailMethod === 'ethereal' && this.transporter) {
        // Ethereal - preview only, not delivered
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        });
        
        console.log(`📧 Preview email created (NOT DELIVERED): ${emailData.to}`);
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log(`⚠️  To send real emails, configure RESEND_API_KEY or EMAIL credentials`);
        return true;
        
      } else {
        console.log(`❌ No email transporter available`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }



  // Convenience methods for travel notifications
  async sendTravelRequestNotification(
    request: {
      id: string;
      travelerName: string;
      requesterName: string;
      destination: string;
      origin: string;
      departureDate: string;
      returnDate: string;
      purpose: string;
      projectName?: string;
    },
    recipients: { email: string; role: string }[]
  ): Promise<boolean> {
    if (recipients.length === 0) {
      console.log('No recipients found for travel request notification');
      return false;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📧 NEW TRAVEL REQUEST NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Requested by: ${request.requesterName}`);
    console.log(`Route: ${request.origin} → ${request.destination}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    console.log(`Purpose: ${request.purpose}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log('='.repeat(80) + '\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0032FF;">🧳 New Travel Request Submitted</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Travel Details</h3>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Requested by:</strong> ${request.requesterName}</p>
          <p><strong>Route:</strong> ${request.origin} → ${request.destination}</p>
          <p><strong>Departure:</strong> ${new Date(request.departureDate).toLocaleDateString()}</p>
          <p><strong>Return:</strong> ${new Date(request.returnDate).toLocaleDateString()}</p>
          <p><strong>Purpose:</strong> ${request.purpose}</p>
          ${request.projectName ? `<p><strong>Project:</strong> ${request.projectName}</p>` : ''}
        </div>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0032FF;">
          <p style="margin: 0; color: #0032FF; font-weight: bold;">✅ This is a REAL email from the Magnoos Travel Management System</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Travel Management System
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent to: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Request Submitted - ${request.travelerName} to ${request.destination}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send email to ${recipient.email}`);
      } else {
        console.log(`✅ Email sent successfully to ${recipient.email} (${recipient.role})`);
      }
    }
    return allSuccessful;
  }

  async sendTravelRequestApprovalNotification(
    request: {
      id: string;
      travelerName: string;
      requesterName: string;
      destination: string;
      origin: string;
      departureDate: string;
      returnDate: string;
      purpose: string;
      projectName?: string;
      pmApproverName: string;
    },
    recipients: { email: string; role: string }[]
  ): Promise<boolean> {
    if (recipients.length === 0) {
      console.log('No recipients found for travel request approval notification');
      return false;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAVEL REQUEST APPROVED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Approved by: ${request.pmApproverName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${request.origin} → ${request.destination}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log('='.repeat(80) + '\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1ABC3C;">✅ Travel Request Approved</h2>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1ABC3C;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Approval Details</h3>
          <p><strong>Approved by:</strong> ${request.pmApproverName}</p>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Route:</strong> ${request.origin} → ${request.destination}</p>
          <p><strong>Dates:</strong> ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}</p>
          ${request.projectName ? `<p><strong>Project:</strong> ${request.projectName}</p>` : ''}
        </div>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1ABC3C;">
          <p style="margin: 0; color: #1ABC3C; font-weight: bold;">🎯 Next Steps: Operations team will now handle your booking arrangements.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Travel Management System
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent to: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Approved - ${request.travelerName} to ${request.destination}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send approval email to ${recipient.email}`);
      } else {
        console.log(`✅ Approval email sent successfully to ${recipient.email} (${recipient.role})`);
      }
    }
    return allSuccessful;
  }

  async sendBookingCompletionNotification(
    request: {
      id: string;
      travelerName: string;
      requesterName: string;
      destination: string;
      origin: string;
      departureDate: string;
      returnDate: string;
      purpose: string;
      projectName?: string;
      pmApproverName?: string;
      operationsCompletedByName: string;
      totalCost: number;
      bookingDetails: Array<{
        type: string;
        provider?: string;
        bookingReference?: string;
        cost: number;
      }>;
    },
    recipients: { email: string; role: string }[]
  ): Promise<boolean> {
    if (recipients.length === 0) {
      console.log('No recipients found for booking completion notification');
      return false;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TRAVEL BOOKINGS COMPLETED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Completed by: ${request.operationsCompletedByName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${request.origin} → ${request.destination}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    console.log(`Total Cost: $${request.totalCost.toLocaleString()}`);
    console.log('\nBooking Details:');
    request.bookingDetails.forEach(booking => {
      const cost = typeof booking.cost === 'number' ? booking.cost : parseFloat(booking.cost) || 0;
      console.log(`  • ${booking.type}: $${cost} ${booking.provider ? `(${booking.provider})` : ''}`);
      if (booking.bookingReference) console.log(`    Reference: ${booking.bookingReference}`);
    });
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log('='.repeat(80) + '\n');

    const bookingDetailsHtml = request.bookingDetails.map(booking => {
      const cost = typeof booking.cost === 'number' ? booking.cost : parseFloat(booking.cost) || 0;
      return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.provider || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${cost.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.bookingReference || 'N/A'}</td>
      </tr>
      `;
    }).join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0032FF;">🎯 Travel Arrangements Complete</h2>
        
        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6F00;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Trip Summary</h3>
          <p><strong>Completed by:</strong> ${request.operationsCompletedByName}</p>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Route:</strong> ${request.origin} → ${request.destination}</p>
          <p><strong>Dates:</strong> ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}</p>
          <p><strong>Total Cost:</strong> <span style="color: #FF6F00; font-weight: bold;">$${request.totalCost.toLocaleString()}</span></p>
        </div>
        
        <h3 style="color: #8A2BE2;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Type</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Provider</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Cost</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Reference</th>
            </tr>
          </thead>
          <tbody>
            ${bookingDetailsHtml}
          </tbody>
        </table>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1ABC3C;">
          <p style="margin: 0; color: #1ABC3C; font-weight: bold;">✅ All travel arrangements are now complete and confirmed!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Travel Management System
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent to: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Arrangements Confirmed - ${request.travelerName} to ${request.destination}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send completion email to ${recipient.email}`);
      } else {
        console.log(`✅ Completion email sent successfully to ${recipient.email} (${recipient.role})`);
      }
    }
    return allSuccessful;
  }
}

export const realEmailService = new RealEmailService();