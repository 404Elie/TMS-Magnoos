import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  private initialized = true;

  constructor() {
    // Simple transporter that logs emails to console for development
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      logger: false
    });
    console.log("Email service initialized with console logging.");
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
      console.log('\n' + '='.repeat(80));
      console.log('📧 NEW TRAVEL REQUEST NOTIFICATION');
      console.log('='.repeat(80));
      console.log(`Traveler: ${request.travelerName}`);
      console.log(`Requested by: ${request.requesterName}`);
      console.log(`Route: ${request.origin} → ${request.destination}`);
      console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
      console.log(`Purpose: ${request.purpose}`);
      if (request.projectName) console.log(`Project: ${request.projectName}`);
      console.log('\nNotifying:');
      recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
      console.log('='.repeat(80) + '\n');
      
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
      console.log('\n' + '='.repeat(80));
      console.log('✅ TRAVEL REQUEST APPROVED NOTIFICATION');
      console.log('='.repeat(80));
      console.log(`Approved by: ${request.pmApproverName}`);
      console.log(`Traveler: ${request.travelerName}`);
      console.log(`Route: ${request.origin} → ${request.destination}`);
      console.log(`Dates: ${new Date(request.departureDate).toLocaleDateString()} - ${new Date(request.returnDate).toLocaleDateString()}`);
      if (request.projectName) console.log(`Project: ${request.projectName}`);
      console.log('\nNotifying:');
      recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
      console.log('='.repeat(80) + '\n');
      
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
      console.log('\nNotifying:');
      recipients.forEach(r => console.log(`  • ${r.email} (${r.role})`));
      console.log('='.repeat(80) + '\n');
      
      return true;
    } catch (error) {
      console.error('Failed to send booking completion notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();