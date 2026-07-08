from django.db import models
import uuid

class Notification(models.Model):
    TYPE_CHOICES = [
        ('CANDIDATURE', 'Nouvelle candidature'),
        ('VOTE',        'Nouveau vote'),
        ('INSCRIPTION', 'Nouvel étudiant inscrit'),
    ]
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type          = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message       = models.TextField()
    lu            = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.type} - {self.message[:50]}"
