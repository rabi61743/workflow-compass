from django.contrib import admin
from .models import Office, Designation


class DesignationInline(admin.TabularInline):
    model = Designation
    extra = 1


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'parent', 'head', 'is_active')
    list_filter = ('type', 'is_active')
    search_fields = ('code', 'name', 'location')
    inlines = [DesignationInline]


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('name', 'office', 'level', 'is_active')
    list_filter = ('office', 'is_active')
    search_fields = ('name', 'office__name')
