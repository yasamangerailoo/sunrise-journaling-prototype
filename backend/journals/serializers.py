from rest_framework import serializers
from .models import Journal, Prompt, Template,JournalAnswer
from users.serializers import UserProfileSerializer
from .models import Feedback

class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ['id', 'text', 'order', 'template', 'created_at']


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'title', 'description', 'is_active', 'created_at', 'prompts']

class JournalAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalAnswer
        fields = ['id', 'journal', 'prompt', 'answer_text']
class JournalSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    prompts = PromptSerializer(many=True, read_only=True)
    template = TemplateSerializer(read_only=True)

    class Meta:
        model = Journal
        fields = ['id', 'user', 'template', 'prompts', 'content', 'created_at', 'updated_at']
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'journal', 'content', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at']