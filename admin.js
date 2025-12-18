// Navigation functionality
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.querySelector('.page-title');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarNav = document.querySelector('.sidebar-nav');

// Section titles
const sectionTitles = {
    dashboard: 'Dashboard',
    products: 'Products Management',
    orders: 'Orders Management',
    customers: 'Customers Management',
    analytics: 'Analytics',
    settings: 'Settings'
};

// Navigation click handler
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));

        // Add active class to clicked item
        item.classList.add('active');

        // Get section ID
        const sectionId = item.dataset.section;

        // Hide all sections
        sections.forEach(section => section.classList.remove('active'));

        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
            pageTitle.textContent = sectionTitles[sectionId];
        }

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebarNav.classList.remove('active');
        }
    });
});

// Sidebar toggle for mobile
sidebarToggle.addEventListener('click', () => {
    sidebarNav.classList.toggle('active');
});

// Add product button
const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        alert('Add Product functionality would open a modal form');
    });
}

// Filter buttons
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Edit and delete buttons
const editBtns = document.querySelectorAll('.btn-icon');
editBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const icon = btn.querySelector('i');
        if (icon.classList.contains('fa-edit')) {
            alert('Edit functionality would open an edit form');
        } else if (icon.classList.contains('fa-trash')) {
            if (confirm('Are you sure you want to delete this item?')) {
                alert('Item deleted successfully');
            }
        } else if (icon.classList.contains('fa-eye')) {
            alert('View order details');
        }
    });
});

// Form submission
const formInputs = document.querySelectorAll('.form-input');
const saveButtons = document.querySelectorAll('.btn-primary');

saveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (btn.textContent.includes('Save') || btn.textContent.includes('Update')) {
            e.preventDefault();
            alert('Changes saved successfully!');
        }
    });
});

// Search functionality
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tableRows = document.querySelectorAll('.data-table tbody tr');

        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Responsive sidebar
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebarNav.classList.remove('active');
    }
});

// Add smooth animations on page load
window.addEventListener('load', () => {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

console.log('Admin Dashboard loaded successfully!');
