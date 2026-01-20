from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserRole, Permission, PasswordResetToken


class UserRoleInline(admin.TabularInline):
    model = UserRole
    extra = 1
    fk_name = 'user'


class PermissionInline(admin.TabularInline):
    model = Permission
    extra = 1


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'designation', 'office', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_staff', 'office')
    search_fields = ('email', 'name', 'designation')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'designation', 'avatar')}),
        ('Organization', {'fields': ('office',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    
    inlines = [UserRoleInline, PermissionInline]


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_at', 'assigned_by')
    list_filter = ('role',)
    search_fields = ('user__email', 'user__name')


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'module', 'action')
    list_filter = ('module', 'action')
    search_fields = ('user__email', 'user__name')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'used_at', 'is_valid_display')
    list_filter = ('created_at', 'used_at')
    search_fields = ('user__email', 'user__name')
    readonly_fields = ('token', 'created_at', 'used_at')
    
    def is_valid_display(self, obj):
        return obj.is_valid()
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Valid'
