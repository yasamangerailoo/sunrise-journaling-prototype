from rest_framework import generics, permissions
from .models import Journal, Prompt, Template,Feedback
from .serializers import JournalSerializer, PromptSerializer, TemplateSerializer,FeedbackSerializer



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
        # فقط Feedback های جورنال های کاربر جاری
        return Feedback.objects.filter(journal__user=self.request.user.userprofile)

    def perform_create(self, serializer):
        serializer.save()