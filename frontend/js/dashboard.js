const API_URL = 'http://127.0.0.1:8000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
        // User is not logged in, redirect to login
        alert('Please login first!');
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    document.getElementById('userName').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        alert('Logged out successfully!');
        window.location.href = 'login.html';
    }
}

// Calendar rendering
function renderCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Set month and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonth').textContent = monthNames[month];
    document.getElementById('calendarYear').textContent = year;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    
    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(dayDiv);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        
        // Highlight today
        if (day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        calendarGrid.appendChild(dayDiv);
    }
    
    // Add next month's leading days to complete the grid
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = day;
        calendarGrid.appendChild(dayDiv);
    }
}

// Daily motivational quotes based on day of week
function setDailyQuote() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const quotes = [
        "New week, new possibilities. Start fresh and shine bright! ☀️", // Sunday
        "Every accomplishment starts with the decision to try. Make today count! 💪", // Monday
        "Progress is progress, no matter how small. Keep moving forward! 🌱", // Tuesday
        "You're halfway through. Keep pushing, you've got this! 🚀", // Wednesday
        "Think positive, be positive, and positive things will happen! ✨", // Thursday
        "You made it! Celebrate your wins, big and small! 🎉", // Friday
        "Take time to rest and recharge. You deserve it! 🌟" // Saturday
    ];
    
    document.getElementById('dailyQuote').textContent = quotes[dayOfWeek];
    document.getElementById('quoteDay').textContent = dayNames[dayOfWeek];
}

// ============ NEW: Fetch and Display Streak ============
async function loadStreak() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/streak/`, {
            headers: {
                'Authorization': `Token ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayStreak(data);
        } else {
            console.error('Failed to load streak');
        }
    } catch (error) {
        console.error('Error loading streak:', error);
    }
}

function displayStreak(data) {
    const streakElement = document.getElementById('streakCount');
    const streakMessage = document.getElementById('streakMessage');
    
    if (streakElement && streakMessage) {
        streakElement.textContent = data.streak;
        
        if (data.streak === 0) {
            streakMessage.textContent = 'Start your streak today!';
        } else if (data.streak === 1) {
            streakMessage.textContent = 'Great start! Keep it going!';
        } else if (data.streak < 7) {
            streakMessage.textContent = 'You\'re on fire! 🔥';
        } else if (data.streak < 30) {
            streakMessage.textContent = 'Amazing streak! Keep it up! 🌟';
        } else {
            streakMessage.textContent = 'Incredible dedication! 🏆';
        }
    }
}

// ============ NEW: Fetch and Display Statistics ============
async function loadStatistics() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/statistics/`, {
            headers: {
                'Authorization': `Token ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayStatistics(data);
        } else {
            console.error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function displayStatistics(data) {
    // Total Journals
    const totalElement = document.getElementById('totalJournals');
    if (totalElement) {
        totalElement.textContent = data.total_journals;
    }
    
    // Recent Journals (7 days)
    const recentElement = document.getElementById('recentJournals');
    if (recentElement) {
        recentElement.textContent = data.recent_journals_7days;
    }
    
    // Mood Distribution
    const moodElement = document.getElementById('moodDistribution');
    if (moodElement && data.mood_distribution) {
        displayMoodChart(data.mood_distribution);
    }
}

// Display mood distribution as simple bars
function displayMoodChart(moodData) {
    const moodElement = document.getElementById('moodDistribution');
    
    const moodEmojis = {
        'very_happy': '😊',
        'happy': '😀',
        'neutral': '😐',
        'sad': '😞',
        'very_sad': '😢'
    };
    
    let html = '';
    for (const [mood, count] of Object.entries(moodData)) {
        const emoji = moodEmojis[mood] || '😐';
        html += `
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <span style="font-size: 20px; margin-right: 10px;">${emoji}</span>
                <div style="background: #ddd; height: 20px; flex: 1; border-radius: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, var(--primary), var(--secondary)); height: 100%; width: ${count * 10}%;"></div>
                </div>
                <span style="margin-left: 10px; font-size: 14px; color: var(--muted);">${count}</span>
            </div>
        `;
    }
    
    moodElement.innerHTML = html || '<p style="color: var(--muted); font-size: 14px;">No mood data yet</p>';
}

// Run on page load
checkAuth();
renderCalendar();
setDailyQuote();
loadStreak();      // NEW
loadStatistics();  // NEW