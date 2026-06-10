from django.contrib import admin
from .models import Vote, TransactionVote

admin.site.register(Vote)
admin.site.register(TransactionVote)