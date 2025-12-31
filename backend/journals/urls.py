from django.urls import path
from .views import PromptListCreateView, TemplateListCreateView, JournalListCreateView, JournalDetailView
from .views import FeedbackListCreateView
urlpatterns = [
    path('prompts/', PromptListCreateView.as_view(), name='prompt-list'),
    path('templates/', TemplateListCreateView.as_view(), name='template-list'),
    path('journals/', JournalListCreateView.as_view(), name='journal-list'),
    path('journals/<int:pk>/', JournalDetailView.as_view(), name='journal-detail'),
    path('feedbacks/', FeedbackListCreateView.as_view(), name='feedback-list-create'),
]
