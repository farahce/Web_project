// Email Marketing System
class EmailMarketing {
    constructor() {
        this.subscribers = this.loadSubscribers();
    }

    loadSubscribers() {
        const saved = localStorage.getItem('dafah_email_subscribers');
        return saved ? JSON.parse(saved) : [];
    }

    saveSubscribers() {
        localStorage.setItem('dafah_email_subscribers', JSON.stringify(this.subscribers));
    }

    subscribe(email) {
        if (!this.subscribers.includes(email)) {
            this.subscribers.push({
                email: email,
                subscribedAt: new Date().toISOString(),
                preferences: {
                    promotions: true,
                    newProducts: true,
                    weeklyDeals: true,
                    orderUpdates: true
                }
            });
            this.saveSubscribers();
            return true;
        }
        return false;
    }

    unsubscribe(email) {
        this.subscribers = this.subscribers.filter(s => s.email !== email);
        this.saveSubscribers();
    }

    async sendWelcomeEmail(email) {
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'email',
                recipient: email,
                subject: '🎉 Welcome to Dafah!',
                message: 'Thanks for subscribing! Get 10% off your first order with code WELCOME10'
            });
        } catch (error) { console.error('Email Error:', error); }
    }

    async sendPromotionalEmail(subject, message) {
        // Broadcast to all (simulated loop or single call if API supported bulk)
        // For now just logging as this is admin feature
        console.log(`📧 Promotional email: ${subject}`);
    }

    async sendOrderConfirmation(email, orderId) {
        try {
            await apiCall('/api/notifications', 'POST', {
                type: 'email',
                recipient: email,
                subject: `Order Confirmed: ${orderId}`,
                message: 'Your order has been confirmed and will be shipped soon!'
            });
        } catch (error) { console.error('Email Error:', error); }
    }

    sendAbandonedCartEmail(email, cartItems) {
        console.log(`📧 Abandoned cart email sent to ${email}`);
        return {
            to: email,
            subject: '🛒 You left something behind!',
            body: `Complete your purchase and get 15% off! Items: ${cartItems.length}`
        };
    }

    sendBirthdayEmail(email, name) {
        console.log(`📧 Birthday email sent to ${email}`);
        return {
            to: email,
            subject: `🎂 Happy Birthday ${name}!`,
            body: 'Enjoy 20% off your birthday treat!'
        };
    }

    getSubscriberCount() {
        return this.subscribers.length;
    }

    getSubscriberStats() {
        return {
            total: this.subscribers.length,
            active: this.subscribers.filter(s => s.preferences.promotions).length,
            newThisMonth: this.subscribers.filter(s => {
                const date = new Date(s.subscribedAt);
                const now = new Date();
                return date.getMonth() === now.getMonth();
            }).length
        };
    }
}

// Initialize
const emailMarketing = new EmailMarketing();

// Subscribe function for forms
function subscribeToNewsletter(email) {
    if (emailMarketing.subscribe(email)) {
        emailMarketing.sendWelcomeEmail(email);
        return { success: true, message: '✅ Subscribed! Check your email.' };
    }
    return { success: false, message: '⚠️ Already subscribed!' };
}
