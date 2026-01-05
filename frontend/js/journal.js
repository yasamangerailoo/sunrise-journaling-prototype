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

// ============ NEW: Get selected mood ============
function getSelectedMood() {
    const moodRadios = document.getElementsByName('mood');
    for (const radio of moodRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return null; // No mood selected
}

// Save Simple Journal
async function saveSimpleJournal() {
    if (!checkAuth()) return;

    const content = document.getElementById('journalContent').value;
    const mood = getSelectedMood(); // NEW: Get mood

    // Validation
    if (!content || content.trim() === '') {
        alert('Please write something before saving!');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/journals/journals/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                content: content,
                template: null,  // Simple journal doesn't use template
                mood: mood       // NEW: Include mood
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Generate and save feedback
            const feedback = generateFeedback(content, null);
            await saveFeedback(data.id, feedback);
            
            alert('Journal saved successfully! 🎉');
            window.location.href = 'journal-history.html';
        } else {
            alert('Error saving journal: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Load Journal History
async function loadJournalHistory() {
    if (!checkAuth()) return;

    const token = localStorage.getItem('token');
    const listContainer = document.getElementById('journalList');

    // Show loading
    listContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading your journals...</p>';

    try {
        const response = await fetch(`${API_URL}/journals/journals/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            if (data.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">You haven\'t written any journals yet. Start writing!</p>';
            } else {
                displayJournals(data);
            }
        } else {
            listContainer.innerHTML = '<p style="text-align:center; color: red;">Error loading journals</p>';
        }
    } catch (error) {
        listContainer.innerHTML = '<p style="text-align:center; color: red;">Server connection error</p>';
    }
}

// Display Journals in the list
function displayJournals(journals) {
    const listContainer = document.getElementById('journalList');
    
    // Sort by newest first
    journals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    let html = '';
    
    // NEW: Mood emoji mapping
    const moodEmojis = {
        'very_happy': '😊',
        'happy': '😀',
        'neutral': '😐',
        'sad': '😞',
        'very_sad': '😢'
    };
    
    journals.forEach(journal => {
        const date = new Date(journal.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        // Get preview (first 100 characters)
        const preview = journal.content.substring(0, 100) + (journal.content.length > 100 ? '...' : '');
        
        // NEW: Get mood emoji
        const moodEmoji = journal.mood ? moodEmojis[journal.mood] : '';
        
        html += `
            <div class="journal-item" onclick="viewJournal(${journal.id})">
                <div class="journal-date">${moodEmoji} ${formattedDate}</div>
                <div class="journal-preview">${preview}</div>
                <div class="journal-arrow">→</div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

// View a specific journal
function viewJournal(journalId) {
    localStorage.setItem('currentJournalId', journalId);
    window.location.href = 'journal-view.html';
}

// Load and display a single journal
async function loadSingleJournal() {
    if (!checkAuth()) return;

    const journalId = localStorage.getItem('currentJournalId');
    
    if (!journalId) {
        alert('No journal selected!');
        window.location.href = 'journal-history.html';
        return;
    }

    const token = localStorage.getItem('token');
    const contentContainer = document.getElementById('journalContent');
    const dateContainer = document.getElementById('journalDate');

    // Show loading
    contentContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading...</p>';

    try {
        const response = await fetch(`${API_URL}/journals/journals/${journalId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Display date
            const date = new Date(data.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // NEW: Add mood emoji to date
            const moodEmojis = {
                'very_happy': '😊',
                'happy': '😀',
                'neutral': '😐',
                'sad': '😞',
                'very_sad': '😢'
            };
            const moodEmoji = data.mood ? moodEmojis[data.mood] + ' ' : '';
            
            dateContainer.textContent = moodEmoji + formattedDate;

            // Display content
            contentContainer.innerHTML = `<p>${data.content.replace(/\n/g, '<br>')}</p>`;
        } else {
            contentContainer.innerHTML = '<p style="color: red;">Error loading journal</p>';
        }
    } catch (error) {
        contentContainer.innerHTML = '<p style="color: red;">Server connection error</p>';
    }
}

// Load Templates List
async function loadTemplates() {
    if (!checkAuth()) return;

    const token = localStorage.getItem('token');
    const templateContainer = document.getElementById('templateList');

    // Show loading
    templateContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading templates...</p>';

    try {
        const response = await fetch(`${API_URL}/journals/templates/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            if (data.length === 0) {
                templateContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">No templates available yet.</p>';
            } else {
                displayTemplates(data);
            }
        } else {
            templateContainer.innerHTML = '<p style="text-align:center; color: red;">Error loading templates</p>';
        }
    } catch (error) {
        templateContainer.innerHTML = '<p style="text-align:center; color: red;">Server connection error</p>';
    }
}

// Display Templates
function displayTemplates(templates) {
    const templateContainer = document.getElementById('templateList');
    
    let html = '';
    
    templates.forEach(template => {
        if (template.is_active) {
            html += `
                <div class="template-card" onclick="selectTemplate(${template.id})">
                    <h3>${template.title}</h3>
                    <p>${template.description || 'No description available'}</p>
                    <button class="use-template-btn">Use This Template</button>
                </div>
            `;
        }
    });
    
    templateContainer.innerHTML = html;
}

// Select a template and redirect to writing page
function selectTemplate(templateId) {
    localStorage.setItem('selectedTemplateId', templateId);
    window.location.href = 'template-journal.html';
}

// Load Template and Display Prompts
async function loadTemplateForWriting() {
    if (!checkAuth()) return;

    const templateId = localStorage.getItem('selectedTemplateId');
    
    if (!templateId) {
        alert('No template selected!');
        window.location.href = 'jornal-templates.html';
        return;
    }

    const token = localStorage.getItem('token');
    const templateNameElement = document.getElementById('templateName');
    const promptsContainer = document.getElementById('promptsContainer');

    // Show loading
    promptsContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading prompts...</p>';

    try {
        const response = await fetch(`${API_URL}/journals/templates/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const templates = await response.json();

        if (response.ok) {
            const template = templates.find(t => t.id === parseInt(templateId));
            
            if (template) {
                templateNameElement.textContent = template.title;
                
                if (template.prompts && template.prompts.length > 0) {
                    displayPrompts(template.prompts);
                } else {
                    promptsContainer.innerHTML = '<p style="color: var(--muted);">This template has no prompts yet.</p>';
                }
            } else {
                promptsContainer.innerHTML = '<p style="color: red;">Template not found</p>';
            }
        } else {
            promptsContainer.innerHTML = '<p style="color: red;">Error loading template</p>';
        }
    } catch (error) {
        promptsContainer.innerHTML = '<p style="color: red;">Server connection error</p>';
    }
}

// Display Prompts for Writing
function displayPrompts(prompts) {
    const promptsContainer = document.getElementById('promptsContainer');
    
    // Sort prompts by order
    prompts.sort((a, b) => a.order - b.order);
    
    let html = '';
    
    prompts.forEach(prompt => {
        html += `
            <div class="prompt-item">
                <label class="prompt-question">${prompt.text}</label>
                <textarea 
                    class="prompt-answer" 
                    data-prompt-id="${prompt.id}"
                    rows="4" 
                    placeholder="Write your answer here..."></textarea>
            </div>
        `;
    });
    
    promptsContainer.innerHTML = html;
}

// Save Template-based Journal
async function saveTemplateJournal() {
    if (!checkAuth()) return;

    const templateId = localStorage.getItem('selectedTemplateId');
    const token = localStorage.getItem('token');
    const mood = getSelectedMood(); // NEW: Get mood

    // Get all answers
    const answerElements = document.querySelectorAll('.prompt-answer');
    const allAnswers = [];
    let hasEmptyAnswer = false;

    answerElements.forEach(textarea => {
        const promptId = textarea.dataset.promptId;
        const answer = textarea.value.trim();
        
        if (!answer) {
            hasEmptyAnswer = true;
        }
        
        allAnswers.push({
            prompt_id: promptId,
            answer: answer
        });
    });

    // Validation
    if (hasEmptyAnswer) {
        const confirm = window.confirm('Some prompts are not answered. Continue anyway?');
        if (!confirm) return;
    }

    // Combine all answers into content
    let content = '';
    answerElements.forEach((textarea, index) => {
        const question = textarea.parentElement.querySelector('.prompt-question').textContent;
        const answer = textarea.value.trim();
        content += `${question}\n${answer}\n\n`;
    });

    try {
        const response = await fetch(`${API_URL}/journals/journals/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                content: content,
                template: templateId,
                mood: mood  // NEW: Include mood
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Generate and save feedback
            const feedback = generateFeedback(content, templateId);
            await saveFeedback(data.id, feedback);
            
            alert('Journal saved successfully! 🎉');
            window.location.href = 'journal-history.html';
        } else {
            alert('Error saving journal: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Generate Smart Feedback
function generateFeedback(content, templateId) {
    // Positive keywords
    const positiveWords = ['happy', 'grateful', 'great', 'good', 'love', 'amazing', 'wonderful', 
                          'excellent', 'beautiful', 'joy', 'blessed', 'thankful', 'appreciate', 
                          'excited', 'accomplished', 'proud', 'peaceful', 'hopeful'];
    
    // Negative keywords
    const negativeWords = ['stress', 'sad', 'worried', 'angry', 'anxious', 'frustrated', 
                          'disappointed', 'tired', 'upset', 'afraid', 'difficult', 'hard', 
                          'struggle', 'problem', 'issue', 'bad'];

    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    
    // Count positive and negative words
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
        if (contentLower.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
        if (contentLower.includes(word)) negativeCount++;
    });

    // Generate feedback based on analysis
    let feedbacks = [];

    // Based on sentiment
    if (positiveCount > negativeCount + 2) {
        feedbacks = [
            "Your positivity is contagious! Keep spreading that good energy! ✨",
            "What a beautiful outlook on life! Your grateful heart shines through. 🌟",
            "Love the positive vibes in your writing! Keep it up! 💫",
            "Your optimism is inspiring! The world needs more of this energy. 🌈",
            "Such uplifting thoughts! Thank you for sharing your joy. 😊"
        ];
    } else if (negativeCount > positiveCount + 2) {
        feedbacks = [
            "Thank you for being honest about your feelings. Remember, tough times don't last. 🌅",
            "It's okay to feel this way. Writing about it is a brave first step. 💪",
            "Your feelings are valid. Tomorrow brings new possibilities. 🌱",
            "Acknowledging difficult emotions takes courage. You're doing great. 🌻",
            "Every storm passes. Keep expressing yourself - it helps. 🌤️"
        ];
    } else {
        feedbacks = [
            "Great reflection! You're making progress on your self-awareness journey. 📝",
            "Balanced perspective! Keep exploring your thoughts and feelings. 🧭",
            "Thoughtful entry! Your introspection is valuable. 💭",
            "Nice work documenting your day. Consistency is key! 📖",
            "You're building a great journaling habit! Keep going. 🎯"
        ];
    }

    // Based on length
    if (wordCount < 30) {
        feedbacks.push("Brief but meaningful! Consider expanding your thoughts next time. 📝");
        feedbacks.push("Short and sweet! Try writing a bit more to deepen your reflection. ✍️");
    } else if (wordCount > 200) {
        feedbacks.push("Wow, such detailed reflection! You've really opened up. 📚");
        feedbacks.push("Impressive depth! Your commitment to journaling shows. 🌟");
    }

    // Based on template (if used)
    if (templateId) {
        feedbacks.push("Great job using a template! Structured reflection can be very powerful. 📋");
        feedbacks.push("Love how you followed the prompts! Keep exploring with templates. 🎯");
    }

    // Return a random feedback from the generated options
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

// Save Feedback to Database
async function saveFeedback(journalId, feedbackContent) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/feedbacks/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                journal: journalId,
                content: feedbackContent,
                rating: 5
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error saving feedback:', error);
        return false;
    }
}

// Load Feedback for a Journal
async function loadJournalFeedback() {
    if (!checkAuth()) return;

    const journalId = localStorage.getItem('currentJournalId');
    
    if (!journalId) {
        alert('No journal selected!');
        window.location.href = 'journal-history.html';
        return;
    }

    const token = localStorage.getItem('token');
    const feedbackContainer = document.getElementById('feedbackContent');
    const journalDateContainer = document.getElementById('feedbackJournalDate');

    feedbackContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading feedback...</p>';

    try {
        // Get the journal first
        const journalResponse = await fetch(`${API_URL}/journals/journals/${journalId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const journal = await journalResponse.json();

        if (journalResponse.ok) {
            // Display journal date
            const date = new Date(journal.created_at);
            journalDateContainer.textContent = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Get feedbacks
            const feedbackResponse = await fetch(`${API_URL}/journals/feedbacks/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            const feedbacks = await feedbackResponse.json();

            if (feedbackResponse.ok) {
                // Find feedback for this journal
                const journalFeedback = feedbacks.find(f => f.journal === parseInt(journalId));

                if (journalFeedback) {
                    feedbackContainer.innerHTML = `
                        <div style="font-size: 18px; line-height: 1.8; color: var(--text);">
                            ${journalFeedback.content}
                        </div>
                    `;
                } else {
                    feedbackContainer.innerHTML = '<p style="color: var(--muted);">No feedback available for this journal yet.</p>';
                }
            }
        }
    } catch (error) {
        feedbackContainer.innerHTML = '<p style="color: red;">Error loading feedback</p>';
    }
}

// Run auth check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}