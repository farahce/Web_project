console.log('contact.js: Starting initialization');

document.addEventListener('DOMContentLoaded', function () {
    console.log('contact.js: DOM fully loaded and parsed');

    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        alert('ERROR: contactForm element not found in DOM!');
        return;
    }

    console.log('contact.js: Form found, attaching listener');

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        console.log('contact.js: Form submit intercepted');

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value.trim();
        const formMessage = document.getElementById('formMessage');

        console.log('contact.js: Form data collected', { name, email, phone, subject, message });

        // Simple frontend validation
        if (!name || !email || !message) {
            alert('ValidationError: Please fill name, email, and message.');
            showMessage('Please fill in required fields', 'error');
            return;
        }

        const submitBtn = document.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            console.log('contact.js: Calling apiCall...');
            const response = await apiCall('/api/messages', 'POST', {
                name,
                email,
                phone,
                subject,
                message
            });

            console.log('contact.js: API Response received', response);

            if (response.status === 'success') {
                alert('SUCCESS: ' + (response.message || 'Message sent!'));
                showMessage(response.message || 'Message sent successfully!', 'success');
                contactForm.reset();
                setTimeout(() => {
                    if (formMessage) formMessage.style.display = 'none';
                }, 5000);
            } else {
                alert('BACKEND ERROR: ' + (response.message || 'Unknown error'));
                showMessage(response.message || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('contact.js: Fetch/Call error', error);
            alert('NETWORK/JS ERROR: ' + error.message);
            showMessage('An error occurred: ' + error.message, 'error');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    console.log('contact.js: Initialization complete');
});

// Show/Hide Form Message and Alert
function showMessage(text, type) {
    console.log('showMessage triggered:', { text, type });
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
    }
}
