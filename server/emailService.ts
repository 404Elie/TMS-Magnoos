import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  private initialized = true;

  constructor() {
    // Configure for testing with actual email delivery to e.radi@magnoos.com
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'travel@magnoos.com',
        pass: process.env.EMAIL_PASS || 'app-password-here'
      },
      // For testing, we'll override recipients and log to console
      streamTransport: !process.env.EMAIL_USER,
      newline: 'unix',
      logger: false
    });
    console.log("Email service initialized - emails will be logged to console and routed to e.radi@magnoos.com for testing");
  }

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
    try {
      const testEmail = 'e.radi@magnoos.com';
      
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
      console.log(`\n📨 TEST EMAIL ROUTED TO: ${testEmail}`);
      console.log('='.repeat(80) + '\n');

      // Send actual email to test address
      const emailContent = {
        from: 'travel@magnoos.com',
        to: testEmail,
        subject: `[TEST] New Travel Request: ${request.travelerName} - ${request.destination}`,
        html: `
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
            
            <p style="color: #666;">This is a test notification from the Magnoos Travel Management System.</p>
            <p style="color: #666; font-size: 12px;">Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}</p>
          </div>
        `
      };

      await this.transporter.sendMail(emailContent);
      return true;
    } catch (error) {
      console.error('Failed to send travel request notification:', error);
      return false;
    }
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
    try {
      const testEmail = 'e.radi@magnoos.com';
      
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
      console.log(`\n📨 TEST EMAIL ROUTED TO: ${testEmail}`);
      console.log('='.repeat(80) + '\n');

      // Send actual email to test address
      const emailContent = {
        from: 'travel@magnoos.com',
        to: testEmail,
        subject: `[TEST] Travel Request Approved: ${request.travelerName} - ${request.destination}`,
        html: `
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
            
            <p style="color: #1ABC3C; font-weight: bold;">Next Steps: Operations team will now handle your booking arrangements.</p>
            <p style="color: #666;">This is a test notification from the Magnoos Travel Management System.</p>
            <p style="color: #666; font-size: 12px;">Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}</p>
          </div>
        `
      };

      await this.transporter.sendMail(emailContent);
      return true;
    } catch (error) {
      console.error('Failed to send approval notification:', error);
      return false;
    }
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
    try {
      const testEmail = 'e.radi@magnoos.com';
      
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
        console.log(`  • ${booking.type}: $${booking.cost} ${booking.provider ? `(${booking.provider})` : ''}`);
        if (booking.bookingReference) console.log(`    Reference: ${booking.bookingReference}`);
      });
      console.log('\nOriginal Recipients:');
      recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
      console.log(`\n📨 TEST EMAIL ROUTED TO: ${testEmail}`);
      console.log('='.repeat(80) + '\n');

      // Send actual email to test address
      const bookingDetailsHtml = request.bookingDetails.map(booking => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.type}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.provider || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${booking.cost.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${booking.bookingReference || 'N/A'}</td>
        </tr>
      `).join('');

      const emailContent = {
        from: 'travel@magnoos.com',
        to: testEmail,
        subject: `[TEST] Travel Bookings Complete: ${request.travelerName} - ${request.destination}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6F00;">🎯 Travel Bookings Completed</h2>
            
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
            
            <p style="color: #1ABC3C; font-weight: bold;">✅ All travel arrangements are now complete and confirmed!</p>
            <p style="color: #666;">This is a test notification from the Magnoos Travel Management System.</p>
            <p style="color: #666; font-size: 12px;">Original recipients: ${recipients.map(r => `${r.email} (${r.role})`).join(', ')}</p>
          </div>
        `
      };

      await this.transporter.sendMail(emailContent);
      return true;
    } catch (error) {
      console.error('Failed to send booking completion notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();