// Form State Management
const formState = {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
    newsletter: false
};

let currentStep = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupPasswordStrength();
});

// Setup Event Listeners
function setupEventListeners() {
    const form = document.getElementById('signup-form');

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm();
    });

    // Input change listeners
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            formState[e.target.name] = e.target.value;
        });

        input.addEventListener('input', (e) => {
            clearError(e.target);
        });
    });

    // Checkbox listeners
    document.getElementById('terms').addEventListener('change', (e) => {
        formState.terms = e.target.checked;
        clearError(e.target);
    });

    document.getElementById('newsletter').addEventListener('change', (e) => {
        formState.newsletter = e.target.checked;
    });
}

// Setup Password Strength Indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthBar(strength);
    });
}

// Calculate Password Strength
function calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

// Update Strength Bar
function updateStrengthBar(strength) {
    const strengthBar = document.querySelector('.strength-bar::after');
    const strengthLevel = document.getElementById('strength-level');
    const bar = document.querySelector('.strength-bar');

    const percentage = (strength / 5) * 100;
    bar.style.setProperty('--width', percentage + '%');

    let level = 'Weak';
    let color = '#F44336';

    if (strength >= 4) {
        level = 'Strong';
        color = '#4CAF50';
    } else if (strength >= 3) {
        level = 'Good';
        color = '#FF9800';
    } else if (strength >= 2) {
        level = 'Fair';
        color = '#FFC107';
    }

    strengthLevel.textContent = level;
    bar.style.background = `linear-gradient(90deg, ${color} 0%, ${color} ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}

// Toggle Password Visibility
function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    const button = event.target.closest('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        button.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// Validation Functions
function validateStep(step) {
    const errors = [];

    if (step === 1) {
        const firstName = document.getElementById('first-name');
        const lastName = document.getElementById('last-name');
        const email = document.getElementById('email');

        if (!firstName.value.trim()) {
            errors.push({ field: firstName, message: 'First name is required' });
        }

        if (!lastName.value.trim()) {
            errors.push({ field: lastName, message: 'Last name is required' });
        }

        if (!email.value.trim()) {
            errors.push({ field: email, message: 'Email is required' });
        } else if (!isValidEmail(email.value)) {
            errors.push({ field: email, message: 'Please enter a valid email' });
        }

        formState.firstName = firstName.value;
        formState.lastName = lastName.value;
        formState.email = email.value;
    }

    if (step === 2) {
        const address = document.getElementById('address');
        const city = document.getElementById('city');
        const zip = document.getElementById('zip');
        const phone = document.getElementById('phone');

        if (!address.value.trim()) {
            errors.push({ field: address, message: 'Address is required' });
        }

        if (!city.value.trim()) {
            errors.push({ field: city, message: 'City is required' });
        }

        if (!zip.value.trim()) {
            errors.push({ field: zip, message: 'ZIP code is required' });
        }

        if (!phone.value.trim()) {
            errors.push({ field: phone, message: 'Phone number is required' });
        } else if (!isValidPhone(phone.value)) {
            errors.push({ field: phone, message: 'Please enter a valid phone number' });
        }

        formState.address = address.value;
        formState.city = city.value;
        formState.zip = zip.value;
        formState.phone = phone.value;
    }

    if (step === 3) {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm-password');
        const terms = document.getElementById('terms');

        if (!password.value) {
            errors.push({ field: password, message: 'Password is required' });
        } else if (password.value.length < 8) {
            errors.push({ field: password, message: 'Password must be at least 8 characters' });
        }

        if (!confirmPassword.value) {
            errors.push({ field: confirmPassword, message: 'Please confirm your password' });
        } else if (password.value !== confirmPassword.value) {
            errors.push({ field: confirmPassword, message: 'Passwords do not match' });
        }

        if (!terms.checked) {
            errors.push({ field: terms, message: 'You must agree to the terms' });
        }

        formState.password = password.value;
        formState.confirmPassword = confirmPassword.value;
        formState.terms = terms.checked;
    }

    if (errors.length > 0) {
        errors.forEach(error => {
            showError(error.field, error.message);
        });
        return false;
    }

    return true;
}

// Show Error
function showError(field, message) {
    const group = field.closest('.form-group');
    if (group) {
        group.classList.add('error');
        const errorMsg = group.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
        }
    }
}

// Clear Error
function clearError(field) {
    const group = field.closest('.form-group');
    if (group) {
        group.classList.remove('error');
    }
}

// Validation Helpers
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Navigation Functions
function nextStep() {
    if (validateStep(currentStep)) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => {
        s.classList.remove('active');
    });

    // Show current step
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }

    // Scroll to top
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Submit Form
function submitForm() {
    if (validateStep(3)) {
        // Save user data to localStorage
        const userData = {
            ...formState,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('dafah_user', JSON.stringify(userData));

        // Show success message
        showSuccessStep();
        showToast('Account created successfully!', 'success');
    }
}

// Show Success Step
function showSuccessStep() {
    currentStep = 4;

    // Hide form
    document.getElementById('signup-form').style.display = 'none';
    document.querySelector('.login-link').style.display = 'none';

    // Show success step
    const successStep = document.getElementById('success-step');
    successStep.classList.add('active');

    // Display email
    document.getElementById('success-email').textContent = `Welcome, ${formState.firstName}! A confirmation email has been sent to ${formState.email}`;
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Prevent form submission on Enter in input fields (except last field)
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
        e.preventDefault();
        nextStep();
    }
});
// After successful signup
emailMarketing.sendWelcomeEmail(formState.email);
emailMarketing.subscribe(formState.email);
// Handle Signup Form Submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Call API
    const response = await apiCall('/api/register', 'POST', {
        username: username,
        email: email,
        password: password
    });

    if (response.status === 'success') {
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    } else {
        alert('Registration failed: ' + response.message);
    }

    this.reset();
});
