from rest_framework import generics, permissions
from .models import Journal, Prompt, Template, Feedback
from .serializers import JournalSerializer, PromptSerializer, TemplateSerializer, FeedbackSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count
from django.conf import settings
import google.generativeai as genai
import random

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
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


# ---------------- User Statistics & Streak ----------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_streak(request):
    """
    Calculate user's journaling streak
    """
    user_profile = request.user.userprofile
    journals = Journal.objects.filter(user=user_profile).order_by('-created_at')

    if not journals.exists():
        return Response({'streak': 0})

    streak = 0
    today = timezone.now().date()

    # Get unique dates user has journaled
    journal_dates = set()
    for journal in journals:
        journal_dates.add(journal.created_at.date())

    # Check if user wrote today or yesterday
    if today in journal_dates:
        streak = 1
        check_date = today - timedelta(days=1)
    elif (today - timedelta(days=1)) in journal_dates:
        streak = 1
        check_date = today - timedelta(days=2)
    else:
        # Streak is broken
        return Response({'streak': 0})

    # Count consecutive days backwards
    while check_date in journal_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return Response({'streak': streak})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    """
    Get user's journal statistics
    """
    user_profile = request.user.userprofile

    # Total journals
    total_journals = Journal.objects.filter(user=user_profile).count()

    # Recent journals (last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_journals = Journal.objects.filter(
        user=user_profile,
        created_at__gte=seven_days_ago
    ).count()

    # Mood distribution (based on simple sentiment analysis)
    mood_distribution = {
        'very_happy': 0,
        'happy': 0,
        'neutral': 0,
        'sad': 0,
        'very_sad': 0
    }

    journals = Journal.objects.filter(user=user_profile)
    for journal in journals:
        content_lower = journal.content.lower()

        # Simple sentiment detection
        if any(word in content_lower for word in ['amazing', 'excellent', 'wonderful', 'fantastic', 'awesome']):
            mood_distribution['very_happy'] += 1
        elif any(word in content_lower for word in ['happy', 'good', 'great', 'thankful', 'grateful', 'blessed']):
            mood_distribution['happy'] += 1
        elif any(word in content_lower for word in ['terrible', 'awful', 'worst', 'hopeless', 'hate']):
            mood_distribution['very_sad'] += 1
        elif any(word in content_lower for word in ['sad', 'upset', 'disappointed', 'worried', 'anxious', 'stress']):
            mood_distribution['sad'] += 1
        else:
            mood_distribution['neutral'] += 1

    # Mood trend (last 7 days)
    mood_trend = {
        'dates': [],
        'very_happy': [],
        'happy': [],
        'neutral': [],
        'sad': [],
        'very_sad': []
    }

    for i in range(6, -1, -1):
        date = timezone.now().date() - timedelta(days=i)
        mood_trend['dates'].append(date.strftime('%b %d'))

        # Count journals for this date
        day_journals = Journal.objects.filter(
            user=user_profile,
            created_at__date=date
        )

        # Initialize counts
        day_moods = {
            'very_happy': 0,
            'happy': 0,
            'neutral': 0,
            'sad': 0,
            'very_sad': 0
        }

        # Analyze each journal
        for journal in day_journals:
            content_lower = journal.content.lower()

            if any(word in content_lower for word in ['amazing', 'excellent', 'wonderful', 'fantastic', 'awesome']):
                day_moods['very_happy'] += 1
            elif any(word in content_lower for word in ['happy', 'good', 'great', 'thankful', 'grateful', 'blessed']):
                day_moods['happy'] += 1
            elif any(word in content_lower for word in ['terrible', 'awful', 'worst', 'hopeless', 'hate']):
                day_moods['very_sad'] += 1
            elif any(
                    word in content_lower for word in ['sad', 'upset', 'disappointed', 'worried', 'anxious', 'stress']):
                day_moods['sad'] += 1
            else:
                day_moods['neutral'] += 1

        # Add to trend
        for mood in ['very_happy', 'happy', 'neutral', 'sad', 'very_sad']:
            mood_trend[mood].append(day_moods[mood])

    return Response({
        'total_journals': total_journals,
        'recent_journals_7days': recent_journals,
        'mood_distribution': mood_distribution,
        'mood_trend': mood_trend
    })


# ---------------- AI Writing Assistant ----------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_writing_assistant(request):
    """
    AI Writing Assistant - Smart Mock Response
    Provides intelligent journaling suggestions without external API
    """
    prompt_text = request.data.get('prompt', '')
    current_content = request.data.get('current_content', '')

    if not prompt_text:
        return Response({'error': 'Prompt is required'}, status=400)

    prompt_lower = prompt_text.lower()
    content_lower = current_content.lower()

    # Analyze content length and mood
    word_count = len(current_content.split())

    # Detect mood from content
    positive_words = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excited', 'grateful', 'thankful', 'blessed']
    negative_words = ['sad', 'upset', 'worried', 'anxious', 'stressed', 'difficult', 'hard', 'struggle']

    has_positive = any(word in content_lower for word in positive_words)
    has_negative = any(word in content_lower for word in negative_words)

    # Response categories
    responses = {
        'continue_positive': [
            "That's wonderful! What made this moment particularly special for you? Try capturing the specific details that brought you joy.",
            "I love the positive energy here! Can you explore what this experience teaches you about what matters most to you?",
            "Beautiful reflection! How might you recreate or build on this positive experience in the future?"
        ],
        'continue_negative': [
            "I hear you. It takes courage to write about difficult feelings. What do you need most right now to support yourself?",
            "Thank you for being honest about this challenge. What small step could help you move through this moment?",
            "Processing hard emotions is important. What would you say to a friend going through something similar?"
        ],
        'continue_neutral': [
            "That's a solid start! What emotions are beneath the surface of what you've written? Try digging a little deeper.",
            "Good foundation. What questions does this moment raise for you about yourself or your life?",
            "Nice work getting started. What's one thing about this experience that surprised you?"
        ],
        'expand_short': [
            "You're off to a great start! Try using your senses - what did you see, hear, smell, or feel in that moment?",
            "Let's build on this. Who was there? What was the environment like? Paint the scene for me.",
            "Good beginning! Now dig deeper - what was going through your mind at that exact time?"
        ],
        'expand_detailed': [
            "You've shared a lot already. What underlying theme or pattern do you notice across what you've written?",
            "Great detail! Now zoom out - how does this fit into the bigger picture of your week or month?",
            "Rich reflection here. What would future-you want to remember most about this moment?"
        ],
        'detail_requests': [
            "Try the 5 senses technique: What did you see, hear, smell, taste, and touch? Sensory details bring journals alive.",
            "Add specifics! Instead of 'it was nice,' try 'the warm sunlight on my face made me smile.' Show, don't tell.",
            "Who, what, when, where, why? Answer these classic questions to add layers to your entry."
        ],
        'reflect_deeper': [
            "Excellent question! Try this: What would you tell your past self about this experience? What did you learn?",
            "Reflection prompt: If you had to find one gift or lesson in this experience, what would it be?",
            "Looking back from one year in the future, what will you remember most about today and why?"
        ],
        'stuck_prompts': [
            "Feeling stuck? Try 'Today I noticed...' or 'Right now I'm feeling...' to break the ice.",
            "Start simple: What's one word that describes your day? Now write why you chose that word.",
            "Stream of consciousness can help! Just write whatever comes to mind for 2 minutes without stopping."
        ],
        'gratitude': [
            "Gratitude is powerful! Who or what contributed to this positive moment? How can you express appreciation?",
            "Beautiful. What made you notice this particular thing to be grateful for today?",
            "Love this grateful energy! How does acknowledging this gratitude shift your perspective right now?"
        ],
        'goals_future': [
            "Great to think ahead! Break it down: What's one tiny step you can take tomorrow toward this goal?",
            "Smart to journal about goals. What obstacles might you face, and how will you overcome them?",
            "Vision is important! Now make it concrete: What does success look like, and how will you know you've achieved it?"
        ]
    }

    # Smart response selection based on prompt and content
    suggestion = ""

    # Detect specific request types
    if any(word in prompt_lower for word in ['continue', '1', 'keep writing', 'go on']):
        if has_positive:
            suggestion = random.choice(responses['continue_positive'])
        elif has_negative:
            suggestion = random.choice(responses['continue_negative'])
        else:
            suggestion = random.choice(responses['continue_neutral'])

    elif any(word in prompt_lower for word in ['expand', '2', 'more', 'elaborate']):
        if word_count < 50:
            suggestion = random.choice(responses['expand_short'])
        else:
            suggestion = random.choice(responses['expand_detailed'])

    elif any(word in prompt_lower for word in ['detail', '3', 'specific', 'describe']):
        suggestion = random.choice(responses['detail_requests'])

    elif any(word in prompt_lower for word in ['reflect', '4', 'deeper', 'meaning', 'learn']):
        suggestion = random.choice(responses['reflect_deeper'])

    elif any(word in prompt_lower for word in ['stuck', 'help', 'start', 'begin', 'blank']):
        suggestion = random.choice(responses['stuck_prompts'])

    elif any(word in prompt_lower for word in ['grateful', 'gratitude', 'thankful', 'appreciate']):
        suggestion = random.choice(responses['gratitude'])

    elif any(word in prompt_lower for word in ['goal', 'future', 'plan', 'tomorrow', 'next']):
        suggestion = random.choice(responses['goals_future'])

    else:
        # Default intelligent response
        if word_count < 20:
            suggestion = "Great start! Try expanding with specific details: Who was involved? What exactly happened? How did it make you feel?"
        elif has_negative:
            suggestion = "I appreciate your honesty about these difficult feelings. What support do you need right now, and what small action might help?"
        elif has_positive:
            suggestion = "Wonderful energy in your writing! What made this moment stand out, and how can you create more moments like this?"
        else:
            suggestion = "You're doing great! Try digging deeper: What's one emotion beneath the surface? What does this moment tell you about your values?"

    return Response({
        'success': True,
        'suggestion': suggestion
    })


# ---------------- AI Weekly Overview ----------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_weekly_overview(request):
    """
    Reads the user's journals from the last 7 days and asks Gemini for a short
    overview of what's been on their mind - recurring topics, worries, wins.
    """
    if not settings.GEMINI_API_KEY:
        return Response({
            'success': False,
            'error': 'AI service is not configured. Missing GEMINI_API_KEY.'
        }, status=503)

    user_profile = request.user.userprofile
    since = timezone.now() - timedelta(days=7)

    journals = Journal.objects.filter(
        user=user_profile,
        created_at__gte=since
    ).order_by('created_at')

    if not journals.exists():
        return Response({
            'success': False,
            'error': 'No journal entries found in the last 7 days. Write a few entries first!'
        })

    mood_labels = dict(Journal.MOOD_CHOICES)
    entries_text = ''
    for journal in journals:
        date_str = journal.created_at.strftime('%A, %b %d')
        mood_str = mood_labels.get(journal.mood, 'not specified')
        entries_text += f'--- {date_str} (mood: {mood_str}) ---\n{journal.content.strip()}\n\n'

    prompt = (
        "You are a thoughtful, warm journaling companion. Below are a user's private "
        "journal entries from the past week. Read them and write a short overview "
        "(4-6 sentences, second person, no bullet points, no markdown) that reflects back "
        "to them what seems to have been on their mind this week - recurring topics, people, "
        "worries, or wins. Be specific and reference real details from their entries, not "
        "generic advice. Do not diagnose or give medical or psychological advice. End with "
        "one gentle, open-ended question to encourage further reflection.\n\n"
        f"{entries_text}"
    )

    try:
        model = genai.GenerativeModel('gemini-3.6-flash')
        result = model.generate_content(prompt)
        overview_text = (result.text or '').strip()
        if not overview_text:
            raise ValueError('Empty response from AI model')
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Could not generate overview right now: {str(e)}'
        }, status=502)

    return Response({
        'success': True,
        'overview': overview_text,
        'journal_count': journals.count(),
        'period': {
            'from': since.date().isoformat(),
            'to': timezone.now().date().isoformat()
        }
    })