from rest_framework import serializers
from .models import Journal, Prompt, Template, JournalAnswer, Feedback
from users.serializers import UserProfileSerializer


class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ['id', 'text', 'order', 'template', 'created_at']


class TemplateSerializer(serializers.ModelSerializer):
    prompts = PromptSerializer(many=True, read_only=True)  # این خط رو اضافه/تغییر بده

    class Meta:
        model = Template
        fields = ['id', 'title', 'description', 'is_active', 'created_at', 'prompts']


class JournalAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalAnswer
        fields = ['id', 'journal', 'prompt', 'answer_text']


class JournalSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    template = TemplateSerializer(read_only=True)

    class Meta:
        model = Journal
        fields = ['id', 'user', 'template', 'content','mood', 'created_at', 'updated_at']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'journal', 'content', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at']