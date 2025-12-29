from django.shortcuts import render

from rest_framework import generics
from .models import Journal, Prompt, Template
from .serializers import JournalSerializer, PromptSerializer, TemplateSerializer

class PromptListCreateView(generics.ListCreateAPIView):
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer

class TemplateListCreateView(generics.ListCreateAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

class JournalListCreateView(generics.ListCreateAPIView):
    queryset = Journal.objects.all()
    serializer_class = JournalSerializer

class JournalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Journal.objects.all()
    serializer_class = JournalSerializer

