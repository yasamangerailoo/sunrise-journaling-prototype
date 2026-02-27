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

// Load User Profile
async function loadUserProfile() {
    if (!checkAuth()) return;

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    // Display username
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileAvatar').textContent = username.charAt(0).toUpperCase();

    try {
        // Get user profile
        const response = await fetch(`${API_URL}/users/profiles/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const profiles = await response.json();

        if (response.ok && profiles.length > 0) {
            const profile = profiles[0]; // Get first profile (user's own)
            displayProfile(profile);
        } else {
            document.getElementById('profileBio').value = '';
        }
    } catch (error) {
        alert('Error loading profile: ' + error);
    }
}

// Display Profile
function displayProfile(profile) {
    document.getElementById('profileEmail').textContent = profile.user.email || 'No email';
    document.getElementById('profileBio').value = profile.bio || '';
    document.getElementById('profileCreated').textContent = new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Display user goals
    displayUserGoals();
}

// Display User Goals
function displayUserGoals() {
    const goalsContainer = document.getElementById('userGoals');
    const saved = localStorage.getItem('userGoals');
    
    if (saved) {
        const goals = JSON.parse(saved);
        const goalLabels = {
            'journaling': '📝 Daily Journaling',
            'mood': '😊 Mood Tracking',
            'mindfulness': '🧘 Mindfulness',
            'growth': '🌱 Personal Growth',
            'stress': '😌 Stress Relief',
            'habits': '✅ Better Habits',
            'reflect': '💭 Daily Reflection',
            'productivity': '🎯 Productivity',
            'emotions': '💙 Emotional Awareness'
        };
        
        let html = '';
        goals.forEach(goal => {
            const label = goalLabels[goal] || goal;
            html += `<span class="goal-badge">${label}</span>`;
        });
        
        goalsContainer.innerHTML = html || '<span style="color: var(--muted); font-size: 14px;">No goals set yet</span>';
    } else {
        goalsContainer.innerHTML = '<span style="color: var(--muted); font-size: 14px;">No goals set yet</span>';
    }
}

// Save Profile
async function saveProfile() {
    if (!checkAuth()) return;

    const token = localStorage.getItem('token');
    const bio = document.getElementById('profileBio').value;

    try {
        // First, get the profile ID
        const getResponse = await fetch(`${API_URL}/users/profiles/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const profiles = await getResponse.json();

        if (profiles.length === 0) {
            alert('Profile not found!');
            return;
        }

        const profileId = profiles[0].id;

        // Update the profile
        const updateResponse = await fetch(`${API_URL}/users/profiles/${profileId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                bio: bio
            })
        });

        if (updateResponse.ok) {
            alert('Profile updated successfully! ✅');
        } else {
            const data = await updateResponse.json();
            alert('Error updating profile: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Load profile on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserProfile);
} else {
    loadUserProfile();
}