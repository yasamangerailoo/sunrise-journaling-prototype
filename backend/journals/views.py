from rest_framework import generics, permissions
from .models import Journal, Prompt, Template, Feedback
from .serializers import JournalSerializer, PromptSerializer, TemplateSerializer, FeedbackSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.db.models import Count


class PromptListCreateView(generics.ListCreateAPIView):
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer
    permission_classes = [permissions.IsAuthenticated]


class TemplateListCreateView(generics.ListCreateAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class JournalListCreateView(generics.ListCreateAPIView):
    serializer_class = JournalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Journal.objects.filter(user=self.request.user.userprofile)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user.userprofile)


class JournalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JournalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Journal.objects.filter(user=self.request.user.userprofile)


class FeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(journal__user=self.request.user.userprofile)

    def perform_create(self, serializer):
        serializer.save()


# ---------------- Admin Template Management ----------------

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_template(request):
    """
    Create a new template with prompts
    Only accessible by admin users
    """
    title = request.data.get('title')
    description = request.data.get('description', '')
    prompts = request.data.get('prompts', [])

    if not title:
        return Response({'error': 'Title is required'}, status=400)

    template = Template.objects.create(
        title=title,
        description=description,
        is_active=True
    )

    for index, prompt_text in enumerate(prompts):
        if prompt_text.strip():
            Prompt.objects.create(
                text=prompt_text,
                order=index + 1,
                template=template
            )

    serializer = TemplateSerializer(template)
    return Response(serializer.data, status=201)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_template(request, template_id):
    """
    Update a template
    Only accessible by admin users
    """
    try:
        template = Template.objects.get(id=template_id)

        template.title = request.data.get('title', template.title)
        template.description = request.data.get('description', template.description)
        template.is_active = request.data.get('is_active', template.is_active)
        template.save()

        serializer = TemplateSerializer(template)
        return Response(serializer.data)
    except Template.DoesNotExist:
        return Response({'error': 'Template not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_template(request, template_id):
    """
    Delete a template
    Only accessible by admin users
    """
    try:
        template = Template.objects.get(id=template_id)
        template.delete()
        return Response({'success': True, 'message': 'Template deleted'})
    except Template.DoesNotExist:
        return Response({'error': 'Template not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_add_prompt(request, template_id):
    """
    Add a prompt to a template
    Only accessible by admin users
    """
    try:
        template = Template.objects.get(id=template_id)

        text = request.data.get('text')
        order = request.data.get('order')

        if not text:
            return Response({'error': 'Text is required'}, status=400)

        if not order:
            max_order = Prompt.objects.filter(template=template).count()
            order = max_order + 1

        prompt = Prompt.objects.create(
            text=text,
            order=order,
            template=template
        )

        serializer = PromptSerializer(prompt)
        return Response(serializer.data, status=201)
    except Template.DoesNotExist:
        return Response({'error': 'Template not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_prompt(request, prompt_id):
    """
    Delete a prompt
    Only accessible by admin users
    """
    try:
        prompt = Prompt.objects.get(id=prompt_id)
        prompt.delete()
        return Response({'success': True, 'message': 'Prompt deleted'})
    except Prompt.DoesNotExist:
        return Response({'error': 'Prompt not found'}, status=404)


# ---------------- NEW: User Statistics & Streak ----------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_streak(request):
    """
    Calculate user's current journal writing streak
    """
    user_profile = request.user.userprofile
    journals = Journal.objects.filter(user=user_profile).order_by('-created_at')

    if not journals.exists():
        return Response({
            'streak': 0,
            'last_journal_date': None,
            'total_journals': 0
        })

    # Calculate streak
    today = datetime.now().date()
    streak = 0
    current_date = today

    # Get unique journal dates
    journal_dates = set(j.created_at.date() for j in journals)

    # Check if user wrote today or yesterday to start the streak
    if today in journal_dates:
        streak = 1
        current_date = today - timedelta(days=1)
    elif (today - timedelta(days=1)) in journal_dates:
        streak = 1
        current_date = today - timedelta(days=2)
    else:
        # Streak is broken
        return Response({
            'streak': 0,
            'last_journal_date': journals.first().created_at.date().isoformat(),
            'total_journals': journals.count()
        })

    # Count consecutive days
    while current_date in journal_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return Response({
        'streak': streak,
        'last_journal_date': journals.first().created_at.date().isoformat(),
        'total_journals': journals.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_statistics(request):
    """
    Get comprehensive statistics for the user
    """
    user_profile = request.user.userprofile
    journals = Journal.objects.filter(user=user_profile)

    # Total journals
    total_journals = journals.count()

    # Mood distribution
    mood_distribution = journals.values('mood').annotate(count=Count('mood'))
    mood_stats = {item['mood']: item['count'] for item in mood_distribution if item['mood']}

    # Recent journals (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_journals = journals.filter(created_at__gte=seven_days_ago).count()

    # Average content length
    if total_journals > 0:
        total_length = sum(len(j.content) for j in journals)
        avg_length = total_length // total_journals
    else:
        avg_length = 0

    # Most used template
    template_usage = journals.exclude(template=None).values('template__title').annotate(
        count=Count('template')
    ).order_by('-count').first()

    most_used_template = template_usage['template__title'] if template_usage else None

    return Response({
        'total_journals': total_journals,
        'recent_journals_7days': recent_journals,
        'mood_distribution': mood_stats,
        'average_content_length': avg_length,
        'most_used_template': most_used_template
    })