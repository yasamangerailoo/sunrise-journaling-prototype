from django.urls import path
from .views import UserProfileListCreateView, UserProfileDetailView

urlpatterns = [
    path('profiles/', UserProfileListCreateView.as_view(), name='userprofile-list'),
    path('profiles/<int:pk>/', UserProfileDetailView.as_view(), name='userprofile-detail'),
]
