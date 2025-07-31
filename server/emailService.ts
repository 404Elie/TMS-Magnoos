import { MailService } from '@sendgrid/mail';

class EmailService {
  private mailService: MailService;
  private initialized = false;

  constructor() {
    this.mailService = new MailService();
    this.initialize();
  }

  private initialize() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
    } else {
      console.warn("SENDGRID_API_KEY not found. Email notifications disabled.");
    }
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
    if (!this.initialized) {
      console.log("Email service not initialized. Skipping notification.");
      return false;
    }

    try {
      const subject = `New Travel Request: ${request.travelerName} - ${request.destination}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2563eb;">New Travel Request Submitted</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Travel Details</h3>
            <p><strong>Traveler:</strong> ${request.travelerName}</p>
            <p><strong>Requested by:</strong> ${request.requesterName}</p>
            <p><strong>Route:</strong> ${request.origin} → ${request.destination}</p>
            <p><strong>Departure:</strong> ${new Date(request.departureDate).toLocaleDateString()}</p>
            <p><strong>Return:</strong> ${new Date(request.returnDate).toLocaleDateString()}</p>
            <p><strong>Purpose:</strong> ${request.purpose}</p>
            ${request.projectName ? `<p><strong>Project:</strong> ${request.projectName}</p>` : ''}
          </div>
          
          <p>Please log into the travel management system to review and process this request.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>This is an automated notification from the Magnoos Travel Management System.</p>
          </div>
        </div>
      `;

      const emailPromises = recipients.map(recipient => 
        this.mailService.send({
          to: recipient.email,
          from: 'travel@magnoos.com', // This should be verified in SendGrid
          subject: subject,
          html: htmlContent,
        })
      );

      await Promise.all(emailPromises);
      console.log(`Travel request notification sent to ${recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Failed to send travel request notification:', error);
      return false;
    }
  }

  async sendStatusUpdateNotification(
    request: {
      id: string;
      travelerName: string;
      destination: string;
      status: string;
      pmComments?: string;
    },
    recipients: { email: string }[]
  ): Promise<boolean> {
    if (!this.initialized) {
      console.log("Email service not initialized. Skipping notification.");
      return false;
    }

    try {
      const subject = `Travel Request Update: ${request.travelerName} - ${request.destination}`;
      
      const statusMessages = {
        'pm_approved': 'Your travel request has been approved by the Project Manager.',
        'pm_rejected': 'Your travel request has been rejected by the Project Manager.',
        'operations_completed': 'Your travel arrangements have been completed by the Operations team.',
        'cancelled': 'Your travel request has been cancelled.'
      };

      const statusMessage = statusMessages[request.status as keyof typeof statusMessages] || 
        `Your travel request status has been updated to: ${request.status}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2563eb;">Travel Request Status Update</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Update Details</h3>
            <p><strong>Traveler:</strong> ${request.travelerName}</p>
            <p><strong>Destination:</strong> ${request.destination}</p>
            <p><strong>Status:</strong> ${statusMessage}</p>
            ${request.pmComments ? `<p><strong>Comments:</strong> ${request.pmComments}</p>` : ''}
          </div>
          
          <p>Please log into the travel management system for complete details.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>This is an automated notification from the Magnoos Travel Management System.</p>
          </div>
        </div>
      `;

      const emailPromises = recipients.map(recipient => 
        this.mailService.send({
          to: recipient.email,
          from: 'travel@magnoos.com',
          subject: subject,
          html: htmlContent,
        })
      );

      await Promise.all(emailPromises);
      console.log(`Status update notification sent to ${recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Failed to send status update notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();