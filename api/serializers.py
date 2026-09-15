from rest_framework import serializers
from .models import StudentProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    completed_modules = serializers.SerializerMethodField()
    weak_topics = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = '__all__'

    def get_completed_modules(self, obj):
        return obj.get_completed_modules()

    def get_weak_topics(self, obj):
        return obj.get_weak_topics()