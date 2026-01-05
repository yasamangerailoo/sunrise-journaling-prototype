from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import UserProfile
from .serializers import UserProfileSerializer, RegisterSerializer
from journals.models import Journal, Template


# ---------------- UserProfile Views ----------------

class UserProfileListCreateView(generics.ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class UserProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


# ---------------- Auth Views ----------------

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username,
            "is_staff": user.is_staff  # اضافه شد برای تشخیص admin
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # حذف توکن برای لاگ اوت واقعی
        request.user.auth_token.delete()
        return Response({"detail": "Successfully logged out"})


class TokenRefreshViewCustom(TokenRefreshView):
    permission_classes = [AllowAny]


# ---------------- Admin Views ----------------

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """
    Get statistics for admin dashboard
    Only accessible by admin users
    """
    total_users = User.objects.count()
    total_journals = Journal.objects.count()
    total_templates = Template.objects.filter(is_active=True).count()

    return Response({
        'total_users': total_users,
        'total_journals': total_journals,
        'total_templates': total_templates,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    """
    Get list of all users with their journal count
    Only accessible by admin users
    """
    users = User.objects.all()

    users_data = []
    for user in users:
        # Get journal count for this user
        journal_count = 0
        if hasattr(user, 'userprofile'):
            journal_count = Journal.objects.filter(user=user.userprofile).count()

        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined,
            'journal_count': journal_count,
        })

    return Response(users_data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_toggle_user(request, user_id):
    """
    Enable or disable a user
    Only accessible by admin users
    """
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()

        return Response({
            'success': True,
            'user_id': user.id,
            'is_active': user.is_active,
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=404)