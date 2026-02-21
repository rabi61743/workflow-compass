from django.contrib import admin
from .models import Office, Designation, UserOfficeAssignment, ReportingStructure


class DesignationInline(admin.TabularInline):
    model = Designation
    extra = 1


class UserOfficeAssignmentInline(admin.TabularInline):
    model = UserOfficeAssignment
    extra = 1
    autocomplete_fields = ['user', 'designation', 'reporting_to']


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'parent', 'head', 'depth', 'is_active')
    list_filter = ('type', 'is_active', 'depth')
    search_fields = ('code', 'name', 'name_nepali', 'location')
    inlines = [DesignationInline, UserOfficeAssignmentInline]
    readonly_fields = ('path', 'depth', 'created_at', 'updated_at')


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('name', 'office', 'level', 'can_approve', 'can_dispatch', 'is_global', 'is_active')
    list_filter = ('office', 'is_active', 'can_approve', 'is_global')
    search_fields = ('name', 'name_nepali', 'office__name')


@admin.register(UserOfficeAssignment)
class UserOfficeAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'office', 'designation', 'assignment_type', 'is_office_head', 'is_active')
    list_filter = ('assignment_type', 'is_office_head', 'is_active', 'office')
    search_fields = ('user__name', 'user__email', 'office__name')
    autocomplete_fields = ['user', 'office', 'designation', 'reporting_to']


@admin.register(ReportingStructure)
class ReportingStructureAdmin(admin.ModelAdmin):
    list_display = ('subordinate', 'supervisor', 'is_primary', 'effective_from', 'effective_to')
    list_filter = ('is_primary',)
    search_fields = ('subordinate__name', 'supervisor__name')
    autocomplete_fields = ['subordinate', 'supervisor']
