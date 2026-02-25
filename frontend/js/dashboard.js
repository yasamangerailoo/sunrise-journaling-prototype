const API_URL = 'http://127.0.0.1:8000/api';

// ---------------- Auth ----------------
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
        alert('Please login first!');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
}

// ---------------- Calendar ----------------
function renderCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('calendarMonth').textContent = monthNames[month];
    document.getElementById('calendarYear').textContent = year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(dayDiv);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        if (day === today.getDate()) dayDiv.classList.add('today');
        calendarGrid.appendChild(dayDiv);
    }

    // Next month leading days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = day;
        calendarGrid.appendChild(dayDiv);
    }
}

// ---------------- Daily Quote ----------------
function setDailyQuote() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday,6=Saturday

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const quotes = [
        "New week, new possibilities! ☀️",
        "Every accomplishment starts with the decision to try! 💪",
        "Progress is progress, no matter how small. Keep moving forward! 🌱",
        "You're halfway through. Keep pushing! 🚀",
        "Think positive, be positive! ✨",
        "You made it! Celebrate your wins! 🎉",
        "Take time to rest and recharge. 🌟"
    ];

    document.getElementById('dailyQuote').textContent = quotes[dayOfWeek];
    document.getElementById('quoteDay').textContent = dayNames[dayOfWeek];
}

// ---------------- Streak ----------------
async function loadStreak() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/journals/streak/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayStreak(data);
        }
    } catch (error) { console.error(error); }
}

function displayStreak(data) {
    const streakElement = document.getElementById('streakCount');
    const streakMessage = document.getElementById('streakMessage');

    if (streakElement && streakMessage) {
        streakElement.textContent = data.streak;
        if (data.streak === 0) streakMessage.textContent = 'Start your streak today!';
        else if (data.streak === 1) streakMessage.textContent = 'Great start! Keep it going!';
        else if (data.streak < 7) streakMessage.textContent = 'You\'re on fire! 🔥';
        else if (data.streak < 30) streakMessage.textContent = 'Amazing streak! Keep it up! 🌟';
        else streakMessage.textContent = 'Incredible dedication! 🏆';
    }
}

// ---------------- Statistics ----------------
async function loadStatistics() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/journals/statistics/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayStatistics(data);
        }
    } catch (error) { console.error(error); }
}

function displayStatistics(data) {
    document.getElementById('totalJournals').textContent = data.total_journals;
    document.getElementById('recentJournals').textContent = data.recent_journals_7days;

    if (data.mood_distribution) renderMoodPieChart(data.mood_distribution);
    if (data.mood_trend) renderMoodTrendChart(data.mood_trend);
}

// ---------------- ApexCharts Pie ----------------
function renderMoodPieChart(moodData) {
    const labels = [];
    const series = [];
    const moodLabels = { very_happy: "Very Happy", happy: "Happy", neutral: "Neutral", sad: "Sad", very_sad: "Very Sad" };
    for (const [mood, count] of Object.entries(moodData)) {
        if (count > 0) {
            labels.push(moodLabels[mood] || mood);
            series.push(count);
        }
    }

    const options = {
        chart: { type: 'pie', height: 320 },
        series,
        labels,
        legend: { position: 'bottom' },
        responsive: [{ breakpoint: 768, options: { chart: { height: 260 } } }]
    };
    document.getElementById("moodDistribution").innerHTML = "";
    new ApexCharts(document.querySelector("#moodDistribution"), options).render();
}

// ---------------- ApexCharts Mood Trend ----------------
function renderMoodTrendChart(trendData) {
    const moodLabels = ["very_happy", "happy", "neutral", "sad", "very_sad"];
    const series = moodLabels.map(label => ({ name: label.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), data: trendData[label] }));
    const options = {
        chart: { type: 'line', height: 320, toolbar: { show: true } },
        series,
        xaxis: { categories: trendData.dates },
        yaxis: { min: 0, title: { text: "Count" } },
        legend: { position: 'bottom' },
        stroke: { curve: 'smooth' },
        markers: { size: 4 },
        tooltip: { shared: true, intersect: false },
        responsive: [{ breakpoint: 768, options: { chart: { height: 260 } } }]
    };
    document.getElementById("moodTrend").innerHTML = "";
    new ApexCharts(document.querySelector("#moodTrend"), options).render();
}

// ---------------- Run ----------------
checkAuth();
renderCalendar();
setDailyQuote();
loadStreak();
loadStatistics();
