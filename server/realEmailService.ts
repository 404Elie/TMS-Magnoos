import nodemailer from 'nodemailer';
import { Resend } from 'resend';

class RealEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private initialized = false;
  private initPromise: Promise<void>;
  private emailMethod: 'resend' | 'smtp' | 'ethereal' = 'ethereal';

  constructor() {
    this.initPromise = this.setupEmailService();
  }

  private async setupEmailService() {
    try {
      // Option 1: Use Resend API (free tier: 100 emails/day, no personal credentials needed)
      if (process.env.RESEND_API_KEY) {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.emailMethod = 'resend';
        this.initialized = true;
        console.log("✅ Email service initialized with Resend API");
        console.log("- Service: Resend (resend.com)");
        console.log("- Limit: 100 emails/day (free tier)");
        console.log("- Real emails will be delivered to recipients");
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
      console.log("   1. RESEND_API_KEY - Free at resend.com (100 emails/day)");
      console.log("   2. EMAIL_USER + EMAIL_PASS - Gmail app password");
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
      
      if (this.emailMethod === 'resend' && this.resend) {
        // Use Resend API for real email delivery
        const result = await this.resend.emails.send({
          from: 'Magnoos Travel <onboarding@resend.dev>', // Resend verified domain
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
        });
        
        if (result.error) {
          console.error(`❌ Resend API error:`, result.error);
          return false;
        }
        
        console.log(`✅ Real email sent via Resend to: ${emailData.to}`);
        console.log(`📧 Message ID: ${result.data?.id}`);
        return true;
        
      } else if (this.emailMethod === 'smtp' && this.transporter) {
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
    const targetEmail = 'e.radi@magnoos.com'; // Always send to your email for testing
    
    console.log('\n' + '='.repeat(80));
    console.log('📧 NEW TRAVEL REQUEST NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Requested by: ${request.requesterName}`);
    console.log(`Route: ${request.origin} → ${request.destination}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    console.log(`Purpose: ${request.purpose}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nOriginal Recipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log(`\n📨 EMAIL SENT TO: ${targetEmail}`);
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
          Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}<br>
          Test routing: All notifications sent to e.radi@magnoos.com
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: targetEmail,
      subject: `Travel Request Submitted - ${request.travelerName} to ${request.destination}`,
      html: emailContent
    });
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
    const targetEmail = 'e.radi@magnoos.com';
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAVEL REQUEST APPROVED NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`Approved by: ${request.pmApproverName}`);
    console.log(`Traveler: ${request.travelerName}`);
    console.log(`Route: ${request.origin} → ${request.destination}`);
    console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
    if (request.projectName) console.log(`Project: ${request.projectName}`);
    console.log('\nOriginal Recipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log(`\n📨 EMAIL SENT TO: ${targetEmail}`);
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
          Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}<br>
          Test routing: All notifications sent to e.radi@magnoos.com
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: targetEmail,
      subject: `Travel Approved - ${request.travelerName} to ${request.destination}`,
      html: emailContent
    });
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
    const targetEmail = 'e.radi@magnoos.com';
    
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
    console.log('\nOriginal Recipients:');
    recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
    console.log(`\n📨 EMAIL SENT TO: ${targetEmail}`);
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
          Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}<br>
          Test routing: All notifications sent to e.radi@magnoos.com
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: targetEmail,
      subject: `Travel Arrangements Confirmed - ${request.travelerName} to ${request.destination}`,
      html: emailContent
    });
  }
}

export const realEmailService = new RealEmailService();