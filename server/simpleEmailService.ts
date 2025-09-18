import nodemailer from 'nodemailer';

// ================================
// EMAIL CONFIG - USING SECURE ENVIRONMENT VARIABLES
// ================================
const EMAIL_CONFIG = {
  email: process.env.SMTP_EMAIL || 'e.radi@magnoos.com',       // From environment variables
  password: process.env.SMTP_PASSWORD || '',                   // From environment variables  
  host: 'smtp-mail.outlook.com',                               // Outlook/Office365 SMTP host
  port: 587,                                                   // SMTP port for Outlook
  fromName: 'Magnoos Travel System'                           // Display name in emails
};
// ================================

class SimpleEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('🔧 Setting up email service...');
    
    // Create transporter with your settings
    this.transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: EMAIL_CONFIG.email,
        pass: EMAIL_CONFIG.password,
      },
    });

    console.log(`📧 Email service ready - sending from: ${EMAIL_CONFIG.email}`);
  }

  // Send email to multiple recipients
  async sendToUsers(
    recipients: { email: string; role: string }[],
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    if (!recipients.length) {
      console.log('No recipients to send to');
      return false;
    }

    console.log(`📤 Sending email to ${recipients.length} recipients:`)
    recipients.forEach(r => console.log(`   • ${r.email} (${r.role})`));

    try {
      // Send to each recipient
      for (const recipient of recipients) {
        await this.transporter.sendMail({
          from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.email}>`,
          to: recipient.email,
          subject: subject,
          html: htmlContent,
        });
        console.log(`✅ Email sent to: ${recipient.email}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Travel request notification - sent to Business Unit Managers when PM submits
  async sendTravelRequestNotification(
    request: {
      travelerName: string;
      requesterName: string;
      destination: string;
      origin: string;
      departureDate: string;
      returnDate: string;
      purpose: string;
      projectName?: string;
    },
    businessUnitManagers: { email: string; role: string }[]
  ): Promise<boolean> {
    const subject = `New Travel Request - ${request.travelerName} to ${request.destination}`;
    
    const html = `
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
          <p style="margin: 0; color: #0032FF; font-weight: bold;">⏳ This request requires your approval</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review & Approve Request
          </a>
        </div>
      </div>
    `;

    return this.sendToUsers(businessUnitManagers, subject, html);
  }

  // Travel approval notification - sent to operations team when BU manager approves
  async sendTravelApprovalNotification(
    request: {
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
    operationsTeam: { email: string; role: string }[]
  ): Promise<boolean> {
    const subject = `Travel Approved - ${request.travelerName} to ${request.destination}`;
    
    const html = `
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
          <p style="margin: 0; color: #1ABC3C; font-weight: bold;">🎯 Action Required: Please proceed with booking arrangements</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
             style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Manage Bookings
          </a>
        </div>
      </div>
    `;

    return this.sendToUsers(operationsTeam, subject, html);
  }

  // Booking completion notification - sent to approver and original requester
  async sendBookingCompletionNotification(
    request: {
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
    const subject = `Travel Bookings Complete - ${request.travelerName} to ${request.destination}`;
    
    const bookingDetailsHtml = request.bookingDetails.map(booking => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.provider || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${booking.cost.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.bookingReference || 'N/A'}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6F00;">🎯 Travel Arrangements Complete</h2>
        
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
            View Travel Details
          </a>
        </div>
      </div>
    `;

    return this.sendToUsers(recipients, subject, html);
  }
}

export const simpleEmailService = new SimpleEmailService();