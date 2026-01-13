from django.contrib import admin
from .models import DartaLetter, DartaRecipient, DocumentType


class DartaRecipientInline(admin.TabularInline):
    model = DartaRecipient
    extra = 1


@admin.register(DartaLetter)
class DartaLetterAdmin(admin.ModelAdmin):
    list_display = ('darta_number', 'subject', 'sender_name', 'status', 'priority', 'current_handler', 'created_at')
    list_filter = ('status', 'priority', 'confidentiality', 'fiscal_year')
    search_fields = ('darta_number', 'subject', 'sender_name', 'sender_org')
    date_hierarchy = 'created_at'
    inlines = [DartaRecipientInline]


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')
