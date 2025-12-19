// Toggle password visibility
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

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.btn-login');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
        // Use the apiCall function from api-config.js
        const result = await apiCall('/api/login', 'POST', { email, password });

        if (result.status === 'success' && result.data) {
            // Store user data in localStorage
            localStorage.setItem('user_id', result.data.user_id);
            localStorage.setItem('user', JSON.stringify({
                id: result.data.user_id,
                username: result.data.username,
                email: result.data.email
            }));

            // Show success notification
            showNotification('Login successful! Welcome back, ' + result.data.username, 'success');

            // Trigger storage event for multi-tab support
            window.dispatchEvent(new Event('storage'));

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'Home_page.html';
            }, 500);
        } else {
            // Show error notification
            showNotification(result.message || 'Login failed. Please check your credentials.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
