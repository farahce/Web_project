// Handle Contact Form Submission
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value.trim();
    const formMessage = document.getElementById('formMessage');
    
    // Validation
    if (!name || !email || !subject || !message) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Phone validation (if provided)
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
        showMessage('Please enter a valid phone number', 'error');
        return;
    }
    
    // Simulate sending message
    console.log('Form submitted:', {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message
    });
    
    // Show success message
    showMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
    
    // Reset form
    this.reset();
    
    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 5000);
});

// Show/Hide Form Message
function showMessage(text, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        const faqItem = this.parentElement;
        
        // Close other items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle current item
        faqItem.classList.toggle('active');
    });
});

// Add smooth focus effects to form inputs
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.opacity = '1';
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.style.opacity = '0.8';
        }
    });
});

// Add animation on page load
window.addEventListener('load', function() {
    document.querySelector('.contact-form-section').style.animation = 'fadeInLeft 0.6s ease-out';
    document.querySelector('.contact-info-section').style.animation = 'fadeInRight 0.6s ease-out';
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effects to info cards
document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
    });
});
