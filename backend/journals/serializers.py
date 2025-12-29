from rest_framework import serializers
from .models import Journal, Prompt, Template
from users.serializers import UserProfileSerializer

class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ['id', 'text']

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'title', 'description']

class JournalSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    prompts = PromptSerializer(many=True, read_only=True)
    template = TemplateSerializer(read_only=True)

    class Meta:
        model = Journal
        fields = ['id', 'user', 'template', 'prompts', 'content', 'created_at', 'updated_at']
