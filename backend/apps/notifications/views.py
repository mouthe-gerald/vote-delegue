from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Notification

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.all()[:20]
        data = [{
            'id':      str(n.id),
            'type':    n.type,
            'message': n.message,
            'lu':      n.lu,
            'date':    n.date_creation.strftime('%d/%m/%Y %H:%M'),
        } for n in notifications]
        non_lues = Notification.objects.filter(lu=False).count()
        return Response({'notifications': data, 'non_lues': non_lues})

    def post(self, request):
        # Marquer toutes comme lues
        Notification.objects.filter(lu=False).update(lu=True)
        return Response({'message': 'Notifications marquées comme lues.'})

