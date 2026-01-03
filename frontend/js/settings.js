// API Configuration
const API_URL = 'http://127.0.0.1:8000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first!');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Change Password
async function changePassword() {
    if (!checkAuth()) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill all password fields!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters!');
        return;
    }

    // Note: Django doesn't have a built-in change password endpoint
    // You would need to create one in your backend
    alert('Password change feature will be implemented in backend. For now, this is a UI demo.');
    
    // Clear fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Delete Account
async function deleteAccount() {
    if (!checkAuth()) return;

    const confirm1 = window.confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!');
    
    if (!confirm1) return;

    const confirm2 = window.confirm('⚠️ Final warning: All your journals and data will be permanently deleted. Continue?');
    
    if (!confirm2) return;

    alert('Account deletion feature will be implemented in backend. For now, this is a UI demo.');
    
    // In real implementation:
    // const token = localStorage.getItem('token');
    // Delete user account via API
    // Then logout and redirect to login
}

// Load settings on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}