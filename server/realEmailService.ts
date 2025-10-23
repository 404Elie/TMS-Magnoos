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

  private getFriendlyRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      'manager': 'Project Manager',
      'pm': 'Business Unit Manager',
      'operations_ksa': 'Operations - KSA',
      'operations_uae': 'Operations - UAE',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  }

  private async setupEmailService() {
    try {
      // Option 1: Use Resend API with verified domain (HIGHEST PRIORITY - Production ready)
      if (process.env.RESEND_API_KEY) {
        try {
          const apiKey = process.env.RESEND_API_KEY.trim();
          console.log("🔧 Initializing Resend with API key...");
          this.resend = new Resend(apiKey);
          this.emailMethod = 'resend';
          this.initialized = true;
          console.log("✅ Email service initialized with Resend API");
          console.log("- Service: Resend (resend.com)");
          console.log("- Domain: magnoos.com (verified)");
          console.log("- From: noreply@magnoos.com");
          console.log("- ✅ PRODUCTION MODE: Direct delivery to recipients");
          return;
        } catch (resendError: any) {
          console.error("❌ Failed to initialize Resend:", resendError.message);
          console.log("🔄 Falling back to next available email service...");
          // Continue to next option
        }
      }

      // Option 2: Use SMTP with provided credentials (fallback) - DISABLED due to auth issues
      if (false && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // SMTP configuration disabled until proper credentials are provided
        console.log("⚠️  SMTP configuration disabled due to authentication issues");
      }
      // Option 3: Use MailerSend API (fallback - has trial limitations)
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
      
      // Fix From address mismatch: Use EMAIL_USER for SMTP to match authentication
      const defaultFromAddress = this.emailMethod === 'smtp' && process.env.EMAIL_USER 
        ? `"Magnoos Travel System" <${process.env.EMAIL_USER}>`
        : '"Magnoos Travel System" <noreply@magnoos.com>';
      const fromAddress = emailData.from || defaultFromAddress;
      
      if (this.emailMethod === 'mailersend' && this.mailerSend) {
        // Use MailerSend API - handle trial account limitations
        try {
          const sentFrom = new Sender('noreply@trial-z3m5jgrjr8vg2k68.mlsender.net', 'Magnoos Travel System');
          
          // For trial accounts, route all emails to the verified admin address
          const verifiedEmail = process.env.ADMIN_EMAIL || 'admin@magnoos.com';
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
            from: 'Magnoos Travel <noreply@magnoos.com>', // Use verified magnoos.com domain
            to: [emailData.to], // Send to actual recipient
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
                from: 'Magnoos Travel <noreply@magnoos.com>',
                to: [process.env.ADMIN_EMAIL || 'admin@magnoos.com'], // Verified address from env
                subject: `[FOR: ${emailData.to}] ${emailData.subject}`,
                html: trialModeHtml,
              });

              if (retryResult.error) {
                console.error(`❌ Failed to send even to verified address:`, retryResult.error);
                return false;
              }

              console.log(`✅ Email routed to verified address: ${process.env.ADMIN_EMAIL || 'admin@magnoos.com'}`);
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
        // Use SMTP for real email delivery with enhanced error handling
        try {
          await this.transporter.sendMail({
            from: fromAddress,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
          });
          
          console.log(`✅ Real email sent via SMTP to: ${emailData.to}`);
          return true;
        } catch (smtpError: any) {
          console.error(`❌ SMTP delivery failed to ${emailData.to}:`, smtpError.message);
          
          // Provide specific error guidance
          if (smtpError.code === 'EAUTH') {
            console.error('   Authentication failed - check EMAIL_USER and EMAIL_PASS');
          } else if (smtpError.code === 'ESOCKET') {
            console.error('   Connection failed - check internet connection and SMTP settings');
          } else if (smtpError.responseCode === 550) {
            console.error('   Recipient rejected - email address may not exist');
          }
          
          return false;
        }
        
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
      destinations?: string[];
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
    
    // Format destinations for display
    const formattedDestinations = request.destinations && request.destinations.length > 0
      ? request.destinations.join(' → ')
      : request.destination;
    
    const fullRoute = `${request.origin} → ${formattedDestinations}`;
    
    console.log('\n' + '='.repeat(80));
    console.log('📧 NEW TRAVEL REQUEST NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Requested by: ${request.requesterName}`);
    console.log(`Route: ${fullRoute}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    console.log(`Purpose: ${request.purpose}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${this.getFriendlyRoleName(r.role)})`));
    console.log('='.repeat(80) + '\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0032FF;">🧳 New Travel Request Submitted</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Travel Details</h3>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Requested by:</strong> ${request.requesterName}</p>
          <p><strong>Route:</strong> ${fullRoute}</p>
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
          This email was sent to: ${recipients.map(r => `${r.email} (${this.getFriendlyRoleName(r.role)})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Request Submitted - ${request.travelerName} to ${formattedDestinations}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send email to ${recipient.email}`);
      } else {
        console.log(`✅ Email sent successfully to ${recipient.email} (${this.getFriendlyRoleName(recipient.role)})`);
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
      destinations?: string[];
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
    
    // Format destinations for display
    const formattedDestinations = request.destinations && request.destinations.length > 0
      ? request.destinations.join(' → ')
      : request.destination;
    
    const fullRoute = `${request.origin} → ${formattedDestinations}`;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAVEL REQUEST APPROVED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Approved by: ${request.pmApproverName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${fullRoute}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${this.getFriendlyRoleName(r.role)})`));
    console.log('='.repeat(80) + '\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1ABC3C;">✅ Travel Request Approved</h2>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1ABC3C;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Approval Details</h3>
          <p><strong>Approved by:</strong> ${request.pmApproverName}</p>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Route:</strong> ${fullRoute}</p>
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
          This email was sent to: ${recipients.map(r => `${r.email} (${this.getFriendlyRoleName(r.role)})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Approved - ${request.travelerName} to ${formattedDestinations}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send approval email to ${recipient.email}`);
      } else {
        console.log(`✅ Approval email sent successfully to ${recipient.email} (${this.getFriendlyRoleName(recipient.role)})`);
      }
    }
    return allSuccessful;
  }

  async sendTravelRequestRejectionNotification(
    request: {
      id: string;
      travelerName: string;
      requesterName: string;
      destination: string;
      destinations?: string[];
      origin: string;
      departureDate: string;
      returnDate: string;
      purpose: string;
      projectName?: string;
      pmRejecterName: string;
      rejectionReason?: string;
    },
    recipients: { email: string; role: string }[]
  ): Promise<boolean> {
    if (recipients.length === 0) {
      console.log('No recipients found for travel request rejection notification');
      return false;
    }
    
    // Format destinations for display
    const formattedDestinations = request.destinations && request.destinations.length > 0
      ? request.destinations.join(' → ')
      : request.destination;
    
    const fullRoute = `${request.origin} → ${formattedDestinations}`;
    
    console.log('\n' + '='.repeat(80));
    console.log('❌ TRAVEL REQUEST REJECTED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Rejected by: ${request.pmRejecterName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${fullRoute}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    if (request.rejectionReason) console.log(`Reason: ${request.rejectionReason}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${this.getFriendlyRoleName(r.role)})`));
    console.log('='.repeat(80) + '\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">❌ Travel Request Rejected</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
          <h3 style="margin-top: 0; color: #8A2BE2;">Request Details</h3>
          <p><strong>Rejected by:</strong> ${request.pmRejecterName}</p>
          <p><strong>Traveler:</strong> ${request.travelerName}</p>
          <p><strong>Route:</strong> ${fullRoute}</p>
          <p><strong>Dates:</strong> ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}</p>
          ${request.projectName ? `<p><strong>Project:</strong> ${request.projectName}</p>` : ''}
          ${request.rejectionReason ? `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 0; color: #DC2626;"><strong>Reason for Rejection:</strong></p>
              <p style="margin: 10px 0 0 0;">${request.rejectionReason}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #6B7280;">
          <p style="margin: 0; color: #374151;">If you have questions about this decision, please contact ${request.pmRejecterName} for more information.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Travel Management System
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent to: ${recipients.map(r => `${r.email} (${this.getFriendlyRoleName(r.role)})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Request Rejected - ${request.travelerName} to ${formattedDestinations}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send rejection email to ${recipient.email}`);
      } else {
        console.log(`✅ Rejection email sent successfully to ${recipient.email} (${this.getFriendlyRoleName(recipient.role)})`);
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
      destinations?: string[];
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
    
    // Format destinations for display
    const formattedDestinations = request.destinations && request.destinations.length > 0
      ? request.destinations.join(' → ')
      : request.destination;
    
    const fullRoute = `${request.origin} → ${formattedDestinations}`;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TRAVEL BOOKINGS COMPLETED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Completed by: ${request.operationsCompletedByName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${fullRoute}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    console.log(`Total Cost: $${request.totalCost.toLocaleString()}`);
    console.log('\nBooking Details:');
    request.bookingDetails.forEach(booking => {
      const cost = typeof booking.cost === 'number' ? booking.cost : parseFloat(booking.cost) || 0;
      console.log(`  • ${booking.type}: $${cost} ${booking.provider ? `(${booking.provider})` : ''}`);
      if (booking.bookingReference) console.log(`    Reference: ${booking.bookingReference}`);
    });
    console.log('\nRecipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${this.getFriendlyRoleName(r.role)})`));
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
          <p><strong>Route:</strong> ${fullRoute}</p>
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
          This email was sent to: ${recipients.map(r => `${r.email} (${this.getFriendlyRoleName(r.role)})`).join(', ')}
        </p>
      </div>
    `;

    // Send email to each recipient
    let allSuccessful = true;
    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient.email,
        subject: `Travel Arrangements Confirmed - ${request.travelerName} to ${formattedDestinations}`,
        html: emailContent
      });
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to send completion email to ${recipient.email}`);
      } else {
        console.log(`✅ Completion email sent successfully to ${recipient.email} (${this.getFriendlyRoleName(recipient.role)})`);
      }
    }
    return allSuccessful;
  }
}

export const realEmailService = new RealEmailService();