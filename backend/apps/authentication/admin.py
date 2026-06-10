from django.contrib import admin
from .models import Utilisateur, Etudiant, Administrateur, Visage

admin.site.register(Utilisateur)
admin.site.register(Etudiant)
admin.site.register(Administrateur)
admin.site.register(Visage)