// Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Handle Form Submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Call API
    const response = await apiCall('/api/login', 'POST', {
        email: email,
        password: password
    });

    if (response.status === 'success') {
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('user_id', response.data.user_id);

        alert('Login successful! Welcome to Dafah.');

        // Redirect to home page
        window.location.href = 'Home_page.html';
    } else {
        alert('Login failed: ' + response.message);
    }

    // Reset form
    this.reset();
});


// Add smooth focus effects
document.querySelectorAll('.input-wrapper input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = '0 0 0 3px rgba(212, 163, 115, 0.1)';
    });

    input.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = 'none';
    });
});

// Social Login Buttons
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const provider = this.classList[1].split('-')[0];
        console.log('Login with:', provider);
        alert(`Redirecting to ${provider} login...`);
    });
});

// Add animation on page load
window.addEventListener('load', function() {
    document.querySelector('.login-content').style.animation = 'fadeInUp 0.6s ease-out';
});

// Add fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
