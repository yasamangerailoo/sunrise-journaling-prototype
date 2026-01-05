// API Configuration
const API_URL = 'http://127.0.0.1:8000/api';

// Check if user is logged in and is admin
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const isStaff = localStorage.getItem('is_staff');
    
    if (!token) {
        alert('Please login first!');
        window.location.href = 'login.html';
        return false;
    }
    
    if (isStaff !== 'true') {
        alert('Access denied! Admin privileges required.');
        window.location.href = 'user-dashboard.html';
        return false;
    }
    
    return true;
}

// Load Admin Dashboard Stats
async function loadAdminStats() {
    if (!checkAdminAuth()) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users/admin/stats/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.total_users;
            document.getElementById('totalJournals').textContent = data.total_journals;
            document.getElementById('totalTemplates').textContent = data.total_templates;
        } else {
            alert('Error loading stats: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Load Users List for Admin
async function loadAdminUsers() {
    if (!checkAdminAuth()) return;

    const token = localStorage.getItem('token');
    const usersContainer = document.getElementById('usersList');

    usersContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading users...</p>';

    try {
        const response = await fetch(`${API_URL}/users/admin/users/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const users = await response.json();

        if (response.ok) {
            displayAdminUsers(users);
        } else {
            usersContainer.innerHTML = '<p style="color: red;">Error loading users</p>';
        }
    } catch (error) {
        usersContainer.innerHTML = '<p style="color: red;">Server connection error</p>';
    }
}

// Display Users in Admin Panel
function displayAdminUsers(users) {
    const usersContainer = document.getElementById('usersList');
    
    let html = '';
    
    users.forEach(user => {
        const joinDate = new Date(user.date_joined).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const statusClass = user.is_active ? 'status-active' : 'status-inactive';
        const statusText = user.is_active ? 'Active' : 'Inactive';
        const buttonText = user.is_active ? 'Disable' : 'Enable';
        const buttonClass = user.is_active ? 'btn-danger' : 'btn-success';
        
        html += `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-main">
                        <span class="user-name">${user.username}</span>
                        <span class="user-badge ${statusClass}">${statusText}</span>
                        ${user.is_staff ? '<span class="user-badge badge-admin">Admin</span>' : ''}
                    </div>
                    <div class="user-details">
                        <span>📧 ${user.email || 'No email'}</span>
                        <span>📅 Joined: ${joinDate}</span>
                        <span>📝 ${user.journal_count} journals</span>
                    </div>
                </div>
                ${!user.is_staff ? `
                    <button class="btn ${buttonClass}" onclick="toggleUser(${user.id})">
                        ${buttonText}
                    </button>
                ` : ''}
            </div>
        `;
    });
    
    usersContainer.innerHTML = html;
}

// Toggle User Status (Enable/Disable)
async function toggleUser(userId) {
    if (!confirm('Are you sure you want to change this user\'s status?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users/admin/users/${userId}/toggle/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('User status updated!');
            loadAdminUsers(); // Reload list
        } else {
            alert('Error: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Run auth check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
} else {
    checkAdminAuth();
}