/**
 * nav.js
 * Role-based navigation menu with click-to-toggle dropdown
 */

document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.querySelector('.nav-login-btn');
    if (!loginBtn) return;

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        // Not logged in
        loginBtn.innerHTML = 'Login';
        loginBtn.href = 'login.html';
        loginBtn.onclick = null;
        loginBtn.style.cursor = 'pointer';
        return;
    }

    // Set username
    loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.username}`;
    loginBtn.href = '#';
    loginBtn.style.cursor = 'pointer';
    loginBtn.style.position = 'relative';

    // Create dropdown
    const dropdown = document.createElement('ul');
    dropdown.className = 'dropdown';
    dropdown.style.display = 'none';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.padding = '10px';
    dropdown.style.listStyle = 'none';
    dropdown.style.margin = '0';
    dropdown.style.minWidth = '150px';
    dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

    // Role-based menu links
    if (user.role === 'admin') {
        dropdown.innerHTML = `
            <li><a href="admin.html">Admin Profile</a></li>
            <li><a href="#" id="logoutBtn">Logout</a></li>
        `;
    } else {
        dropdown.innerHTML = `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="inbox.html"><i class="fas fa-envelope"></i> My Inbox</a></li>
            <li><a href="#" id="logoutBtn">Logout</a></li>
        `;
    }

    loginBtn.appendChild(dropdown);

    // Toggle dropdown only when clicking username, not links inside
    loginBtn.addEventListener('click', function (e) {
        if (e.target === loginBtn) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!loginBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
});
