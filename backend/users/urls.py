from django.urls import path
from .views import (
    UserProfileListCreateView,
    UserProfileDetailView,
    RegisterView,
    LoginView,
    LogoutView,
    admin_stats,
    admin_users_list,
    admin_toggle_user
)

urlpatterns = [
    # user profile
    path('profiles/', UserProfileListCreateView.as_view(), name='userprofile-list'),
    path('profiles/<int:pk>/', UserProfileDetailView.as_view(), name='userprofile-detail'),

    # authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # admin
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/users/', admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/toggle/', admin_toggle_user, name='admin-toggle-user'),
]