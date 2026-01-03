import { Server } from 'socket.io';

class NotificationService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their personal room
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join admin to admin room
      socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log('Admin joined admin room');
      });

      // Join guide to guide room
      socket.on('join-guide-room', (guideId) => {
        socket.join(`guide-${guideId}`);
        console.log(`Guide ${guideId} joined their room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    this.io.to(`user-${userId}`).emit('notification', notification);
  }

  // Send notification to all admins
  sendToAdmins(notification) {
    this.io.to('admin-room').emit('admin-notification', notification);
  }

  // Send notification to specific guide
  sendToGuide(guideId, notification) {
    this.io.to(`guide-${guideId}`).emit('guide-notification', notification);
  }

  // Send notification to all users
  sendToAll(notification) {
    this.io.emit('broadcast-notification', notification);
  }

  // Booking notifications
  notifyBookingCreated(booking) {
    const notification = {
      type: 'booking_created',
      title: 'New Booking',
      message: `New booking created for ${booking.type}`,
      data: booking,
      timestamp: new Date()
    };

    // Notify admins
    this.sendToAdmins(notification);

    // Notify guide if it's a guide booking
    if (booking.guide) {
      this.sendToGuide(booking.guide, notification);
    }
  }

  notifyBookingStatusChanged(booking, oldStatus, newStatus) {
    const notification = {
      type: 'booking_status_changed',
      title: 'Booking Status Updated',
      message: `Booking status changed from ${oldStatus} to ${newStatus}`,
      data: booking,
      timestamp: new Date()
    };

    // Notify user
    this.sendToUser(booking.user, notification);

    // Notify guide if it's a guide booking
    if (booking.guide) {
      this.sendToGuide(booking.guide, notification);
    }
  }

  // User notifications
  notifyUserRegistration(user) {
    const notification = {
      type: 'user_registered',
      title: 'New User Registration',
      message: `New user registered: ${user.name}`,
      data: user,
      timestamp: new Date()
    };

    this.sendToAdmins(notification);
  }

  notifyGuideVerification(guide, isVerified) {
    const notification = {
      type: 'guide_verification',
      title: isVerified ? 'Guide Verified' : 'Guide Verification Rejected',
      message: `Your guide profile has been ${isVerified ? 'verified' : 'rejected'}`,
      data: guide,
      timestamp: new Date()
    };

    this.sendToUser(guide.user, notification);
  }

  // System notifications
  notifySystemMaintenance(message) {
    const notification = {
      type: 'system_maintenance',
      title: 'System Maintenance',
      message: message,
      timestamp: new Date()
    };

    this.sendToAll(notification);
  }

  notifyNewEvent(event) {
    const notification = {
      type: 'new_event',
      title: 'New Event Available',
      message: `New event: ${event.title}`,
      data: event,
      timestamp: new Date()
    };

    this.sendToAll(notification);
  }

  // Payment notifications
  notifyPaymentSuccess(booking) {
    const notification = {
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Payment of ₹${booking.payment.amount} completed successfully`,
      data: booking,
      timestamp: new Date()
    };

    this.sendToUser(booking.user, notification);
  }

  notifyPaymentFailed(booking, reason) {
    const notification = {
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment failed: ${reason}`,
      data: booking,
      timestamp: new Date()
    };

    this.sendToUser(booking.user, notification);
  }
}

export default NotificationService;
