from django.contrib import admin
from .models import WorkflowStep, FileTracker, Attachment, AuditLog


@admin.register(WorkflowStep)
class WorkflowStepAdmin(admin.ModelAdmin):
    list_display = ('action', 'from_user', 'to_user', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('from_user__email', 'to_user__email', 'remarks')
    date_hierarchy = 'timestamp'


@admin.register(FileTracker)
class FileTrackerAdmin(admin.ModelAdmin):
    list_display = ('file_number', 'title', 'current_handler', 'office', 'is_active', 'created_at')
    list_filter = ('is_active', 'office')
    search_fields = ('file_number', 'title')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'file_type', 'file_size', 'uploaded_by', 'uploaded_at')
    list_filter = ('file_type', 'uploaded_at')
    search_fields = ('name',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'action', 'module', 'ip_address', 'timestamp')
    list_filter = ('action', 'module', 'timestamp')
    search_fields = ('user_email', 'action', 'details')
    date_hierarchy = 'timestamp'
    readonly_fields = ('user', 'user_email', 'action', 'module', 'details', 'ip_address', 'user_agent', 'timestamp')
