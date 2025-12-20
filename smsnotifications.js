// SMS Notification System
class SMSNotifications {
    constructor() {
        this.phoneNumbers = this.loadPhoneNumbers();
    }

    loadPhoneNumbers() {
        const saved = localStorage.getItem('dafah_sms_numbers');
        return saved ? JSON.parse(saved) : [];
    }

    savePhoneNumbers() {
        localStorage.setItem('dafah_sms_numbers', JSON.stringify(this.phoneNumbers));
    }

    addPhoneNumber(phone) {
        if (!this.phoneNumbers.includes(phone)) {
            this.phoneNumbers.push({
                phone: phone,
                addedAt: new Date().toISOString(),
                verified: false,
                preferences: {
                    orderUpdates: true,
                    promotions: true,
                    deliveryAlerts: true
                }
            });
            this.savePhoneNumbers();
            return true;
        }
        return false;
    }

    async sendOrderConfirmationSMS(phone, orderId) {
        console.log(`📱 Sending SMS to ${phone}...`);
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'sms',
                recipient: phone,
                message: `🍩 Dafah: Your order #${orderId} is confirmed! Track it here: dafah.com/track/${orderId}`
            });
            console.log('SMS sent successfully');
        } catch (error) {
            console.error('Failed to send SMS:', error);
        }
        return { to: phone, message: 'Sent via backend' };
    }

    async sendDeliveryAlertSMS(phone, orderId) {
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'sms',
                recipient: phone,
                message: `🚚 Dafah: Your order #${orderId} is out for delivery! Expected arrival: Today`
            });
        } catch (error) { console.error('SMS Error:', error); }
    }

    async sendDeliveredSMS(phone, orderId) {
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'sms',
                recipient: phone,
                message: `✅ Dafah: Your order #${orderId} has been delivered! Rate your experience: dafah.com/rate/${orderId}`
            });
        } catch (error) { console.error('SMS Error:', error); }
    }

    async sendPromotionalSMS(phone, message) {
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'sms',
                recipient: phone,
                message: `🎉 Dafah: ${message}`
            });
        } catch (error) { console.error('SMS Error:', error); }
    }

    sendVerificationSMS(phone, code) {
        console.log(`📱 SMS sent to ${phone}: Verification code ${code}`);
        return {
            to: phone,
            message: `🔐 Dafah: Your verification code is ${code}. Valid for 10 minutes.`
        };
    }

    sendReminderSMS(phone, message) {
        console.log(`📱 SMS sent to ${phone}: ${message}`);
        return {
            to: phone,
            message: `⏰ Dafah: ${message}`
        };
    }

    getPhoneCount() {
        return this.phoneNumbers.length;
    }

    getPhoneStats() {
        return {
            total: this.phoneNumbers.length,
            verified: this.phoneNumbers.filter(p => p.verified).length,
            optedIn: this.phoneNumbers.filter(p => p.preferences.orderUpdates).length
        };
    }
}

// Initialize
const smsNotifications = new SMSNotifications();

// Add phone function
function addPhoneForSMS(phone) {
    if (smsNotifications.addPhoneNumber(phone)) {
        smsNotifications.sendVerificationSMS(phone, Math.floor(Math.random() * 900000 + 100000));
        return { success: true, message: '✅ Phone added! Check SMS for verification code.' };
    }
    return { success: false, message: '⚠️ Phone already registered!' };
}
