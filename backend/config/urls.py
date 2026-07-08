from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',         include('apps.authentication.urls')),
    path('api/elections/',    include('apps.elections.urls')),
    path('api/candidatures/', include('apps.candidatures.urls')),
    path('api/votes/',        include('apps.votes.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/resultats/',    include('apps.resultats.urls')),
    path('api/face/',         include('apps.reconnaissance_faciale.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)