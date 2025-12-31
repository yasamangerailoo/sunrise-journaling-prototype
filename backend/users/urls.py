from django.urls import path
from .views import RegisterView, LoginView, LogoutView
from .views import (
    UserProfileListCreateView,
    UserProfileDetailView,
    RegisterView,
    LoginView,
)

urlpatterns = [
    # user profile
    path('profiles/', UserProfileListCreateView.as_view(), name='userprofile-list'),
    path('profiles/<int:pk>/', UserProfileDetailView.as_view(), name='userprofile-detail'),
    # authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view()),

]

