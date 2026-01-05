// Main Configuration
const API_URL = 'http://127.0.0.1:8000/api';

// Signup Function
async function signup() {
    // Get values from inputs
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validation
    if (!username || !email || !password) {
        alert('Please fill all fields!');
        return;
    }

    try {
        // Send request to API
        const response = await fetch(`${API_URL}/users/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Success!
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            // Error
            alert('Error: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Login Function
async function login() {
    // Get values from inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validation
    if (!username || !password) {
        alert('Please fill all fields!');
        return;
    }

    try {
        // Send request to API
        const response = await fetch(`${API_URL}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        
        if (response.ok) {
    // Success! Save token
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('is_staff', data.is_staff);  // اضافه شد
            alert('Login successful!');
    
    // Check if user is admin
    if (data.is_staff) {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }

        } else {
            // Error
            alert('Login failed: ' + (data.error || 'Invalid credentials'));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}