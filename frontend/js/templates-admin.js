// API Configuration
const API_URL = 'http://127.0.0.1:8000/api';

// Load All Templates for Admin
async function loadAdminTemplates() {
    if (!checkAdminAuth()) return;

    const token = localStorage.getItem('token');
    const templatesContainer = document.getElementById('templatesList');

    templatesContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Loading templates...</p>';

    try {
        const response = await fetch(`${API_URL}/journals/templates/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const templates = await response.json();

        if (response.ok) {
            if (templates.length === 0) {
                templatesContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">No templates yet. Add your first template!</p>';
            } else {
                displayAdminTemplates(templates);
            }
        } else {
            templatesContainer.innerHTML = '<p style="color: red;">Error loading templates</p>';
        }
    } catch (error) {
        templatesContainer.innerHTML = '<p style="color: red;">Server connection error</p>';
    }
}

// Display Templates in Admin Panel
function displayAdminTemplates(templates) {
    const templatesContainer = document.getElementById('templatesList');
    
    let html = '';
    
    templates.forEach(template => {
        const prompts = template.prompts || [];
        const statusBadge = template.is_active 
            ? '<span style="background: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Active</span>'
            : '<span style="background: #f8d7da; color: #721c24; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Inactive</span>';
        
        html += `
            <div class="template-card">
                <div class="template-header">
                    <div class="template-info">
                        <h3>${template.title} ${statusBadge}</h3>
                        <p>${template.description || 'No description'}</p>
                    </div>
                    <div class="template-actions">
                        <button class="btn-edit" onclick="editTemplate(${template.id})">✏️ Edit</button>
                        <button class="btn-delete" onclick="deleteTemplate(${template.id})">🗑️ Delete</button>
                    </div>
                </div>
                
                ${prompts.length > 0 ? `
                    <div class="prompts-section">
                        <div class="prompts-title">📝 Prompts (${prompts.length}):</div>
                        ${prompts.sort((a, b) => a.order - b.order).map(prompt => `
                            <div class="prompt-item">
                                <span class="prompt-text">${prompt.order}. ${prompt.text}</span>
                                <button class="btn-delete-prompt" onclick="deletePrompt(${prompt.id}, ${template.id})" title="Delete prompt">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="color: var(--muted); font-size: 14px; margin-top: 10px;">No prompts yet</p>'}
            </div>
        `;
    });
    
    templatesContainer.innerHTML = html;
}

// Open Add Template Modal
function openAddTemplateModal() {
    document.getElementById('modalTitle').textContent = 'Add New Template';
    document.getElementById('templateTitle').value = '';
    document.getElementById('templateDescription').value = '';
    
    // Reset prompts editor
    document.getElementById('promptsEditor').innerHTML = `
        <div class="prompt-input-group">
            <input type="text" placeholder="Enter a prompt question..." class="prompt-field">
            <button class="btn-add-prompt-field" onclick="addPromptField()">➕</button>
        </div>
    `;
    
    document.getElementById('templateModal').classList.add('active');
}

// Close Template Modal
function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
}

// Add Prompt Field
function addPromptField() {
    const promptsEditor = document.getElementById('promptsEditor');
    
    const newField = document.createElement('div');
    newField.className = 'prompt-input-group';
    newField.innerHTML = `
        <input type="text" placeholder="Enter a prompt question..." class="prompt-field">
        <button class="btn-remove-prompt-field" onclick="this.parentElement.remove()">×</button>
    `;
    
    promptsEditor.appendChild(newField);
}

// Save Template
async function saveTemplate() {
    const title = document.getElementById('templateTitle').value.trim();
    const description = document.getElementById('templateDescription').value.trim();
    
    if (!title) {
        alert('Please enter a template title!');
        return;
    }
    
    // Collect prompts
    const promptFields = document.querySelectorAll('.prompt-field');
    const prompts = [];
    
    promptFields.forEach(field => {
        const text = field.value.trim();
        if (text) {
            prompts.push(text);
        }
    });
    
    if (prompts.length === 0) {
        const confirm = window.confirm('No prompts added. Create template anyway?');
        if (!confirm) return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/admin/templates/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                title: title,
                description: description,
                prompts: prompts
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Template created successfully! ✅');
            closeTemplateModal();
            loadAdminTemplates(); // Reload list
        } else {
            alert('Error creating template: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Delete Template
async function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone!')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/admin/templates/${templateId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`
            }
        });
        
        if (response.ok) {
            alert('Template deleted successfully!');
            loadAdminTemplates(); // Reload list
        } else {
            const data = await response.json();
            alert('Error deleting template: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Delete Prompt
async function deletePrompt(promptId, templateId) {
    if (!confirm('Are you sure you want to delete this prompt?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/journals/admin/prompts/${promptId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`
            }
        });
        
        if (response.ok) {
            alert('Prompt deleted successfully!');
            loadAdminTemplates(); // Reload list
        } else {
            const data = await response.json();
            alert('Error deleting prompt: ' + JSON.stringify(data));
        }
    } catch (error) {
        alert('Server connection error: ' + error);
    }
}

// Edit Template (simplified - just toggle active status for now)
async function editTemplate(templateId) {
    alert('Edit feature: You can toggle template status or add more prompts. Full edit will be added if needed!');
    
    // For now, just a placeholder
    // You can extend this later to open a modal with template data
}