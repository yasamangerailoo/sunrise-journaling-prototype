from django.urls import path
from .views import (
    PromptListCreateView,
    TemplateListCreateView,
    JournalListCreateView,
    JournalDetailView,
    FeedbackListCreateView,
    admin_create_template,
    admin_update_template,
    admin_delete_template,
    admin_add_prompt,
    admin_delete_prompt,
    get_user_streak,  # جدید
    get_user_statistics  # جدید
)

urlpatterns = [
    # User endpoints
    path('prompts/', PromptListCreateView.as_view(), name='prompt-list'),
    path('templates/', TemplateListCreateView.as_view(), name='template-list'),
    path('journals/', JournalListCreateView.as_view(), name='journal-list'),
    path('journals/<int:pk>/', JournalDetailView.as_view(), name='journal-detail'),
    path('feedbacks/', FeedbackListCreateView.as_view(), name='feedback-list-create'),

    # Admin template management
    path('admin/templates/create/', admin_create_template, name='admin-create-template'),
    path('admin/templates/<int:template_id>/update/', admin_update_template, name='admin-update-template'),
    path('admin/templates/<int:template_id>/delete/', admin_delete_template, name='admin-delete-template'),
    path('admin/templates/<int:template_id>/prompts/add/', admin_add_prompt, name='admin-add-prompt'),
    path('admin/prompts/<int:prompt_id>/delete/', admin_delete_prompt, name='admin-delete-prompt'),

    # Statistics & Streak (جدید)
    path('streak/', get_user_streak, name='user-streak'),
    path('statistics/', get_user_statistics, name='user-statistics'),
]