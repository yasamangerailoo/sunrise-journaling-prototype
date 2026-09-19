from django.db import models
from users.models import UserProfile

class Template(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Prompt(models.Model):
    text = models.TextField()
    order = models.PositiveIntegerField()
    template = models.ForeignKey('Template', related_name='prompts', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]

class Journal(models.Model):
    MOOD_CHOICES = [
        ('very_happy', '😊 Very Happy'),
        ('happy', '😀 Happy'),
        ('neutral', '😐 Neutral'),
        ('sad', '😞 Sad'),
        ('very_sad', '😢 Very Sad'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    template = models.ForeignKey(Template, null=True, blank=True, on_delete=models.SET_NULL)
    content = models.TextField()
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, null=True, blank=True)  # فیلد جدید
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Journal by {self.user.user.username} on {self.created_at.strftime('%Y-%m-%d')}"


class JournalAnswer(models.Model):
    journal = models.ForeignKey(Journal, related_name='answers', on_delete=models.CASCADE)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE)
    answer_text = models.TextField()

    def __str__(self):
        return f"Answer to {self.prompt.text[:20]} for journal {self.journal.id}"


class Feedback(models.Model):
    journal = models.ForeignKey(Journal, related_name='feedbacks', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.PositiveIntegerField(default=0)  # اختیاری: اگر بخوای نمره یا امتیاز هم داشته باشه

    def __str__(self):
        return f"Feedback for Journal {self.journal.id} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"