from django.contrib import admin
from .models import ChalaniLetter, ChalaniRecipient, LetterTemplate


class ChalaniRecipientInline(admin.TabularInline):
    model = ChalaniRecipient
    extra = 1


@admin.register(ChalaniLetter)
class ChalaniLetterAdmin(admin.ModelAdmin):
    list_display = ('chalani_number', 'subject', 'receiver_name', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'receiver_type', 'fiscal_year')
    search_fields = ('chalani_number', 'subject', 'receiver_name', 'receiver_org')
    date_hierarchy = 'created_at'
    inlines = [ChalaniRecipientInline]


@admin.register(LetterTemplate)
class LetterTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active', 'created_at')
    list_filter = ('is_active', 'category')
    search_fields = ('name', 'content')
