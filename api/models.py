from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='studentprofile')
    target_topic = models.CharField(max_length=255, blank=True, null=True, default='Python Basics & Syntax')
    skill_level = models.CharField(max_length=50, blank=True, null=True, default='1')
    current_state = models.CharField(max_length=50, default='TEACHING')
    completed_topics_csv = models.TextField(blank=True, default='')
    weak_topics_csv = models.TextField(blank=True, default='')

    def get_completed_modules(self):
        if not self.completed_topics_csv:
            return []
        return [t.strip() for t in self.completed_topics_csv.split('||') if t.strip()]

    def set_completed_modules(self, modules):
        self.completed_topics_csv = '||'.join(modules)

    def get_weak_topics(self):
        if not self.weak_topics_csv:
            return []
        return [t.strip() for t in self.weak_topics_csv.split('||') if t.strip()]

    def set_weak_topics(self, topics):
        self.weak_topics_csv = '||'.join(topics)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_message = models.TextField()
    ai_response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


@receiver(post_save, sender=User)
def create_student_profile(sender, instance, created, **kwargs):
    if created:
        StudentProfile.objects.create(user=instance)