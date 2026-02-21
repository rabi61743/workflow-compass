# Migration for enhanced organizational hierarchy

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0003_alter_office_options_office_depth_office_email_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add new fields to Designation
        migrations.AddField(
            model_name='designation',
            name='can_approve',
            field=models.BooleanField(default=False, help_text='Whether this designation can approve documents'),
        ),
        migrations.AddField(
            model_name='designation',
            name='can_dispatch',
            field=models.BooleanField(default=False, help_text='Whether this designation can dispatch Chalani'),
        ),
        migrations.AddField(
            model_name='designation',
            name='is_global',
            field=models.BooleanField(default=False, help_text='If True, designation applies across all offices'),
        ),
        # Make designation.office nullable for global designations
        migrations.AlterField(
            model_name='designation',
            name='office',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='designations',
                to='organization.office',
            ),
        ),
        # Add indexes to Office
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['path'], name='org_office_path_idx'),
        ),
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['parent', 'is_active'], name='org_office_parent_active_idx'),
        ),
        migrations.AddIndex(
            model_name='office',
            index=models.Index(fields=['type', 'is_active'], name='org_office_type_active_idx'),
        ),
        # Create UserOfficeAssignment model
        migrations.CreateModel(
            name='UserOfficeAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('assignment_type', models.CharField(
                    choices=[
                        ('primary', 'Primary Assignment'),
                        ('secondary', 'Secondary Assignment'),
                        ('deputation', 'Deputation'),
                        ('acting', 'Acting/Temporary'),
                    ],
                    default='primary',
                    max_length=20,
                )),
                ('is_office_head', models.BooleanField(default=False)),
                ('start_date', models.DateField(auto_now_add=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('designation', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='assignments',
                    to='organization.designation',
                )),
                ('office', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='user_assignments',
                    to='organization.office',
                )),
                ('reporting_to', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='direct_reports',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='office_assignments',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'User Office Assignment',
                'verbose_name_plural': 'User Office Assignments',
                'db_table': 'user_office_assignments',
                'ordering': ['assignment_type', 'office__name'],
                'unique_together': {('user', 'office', 'assignment_type')},
            },
        ),
        # Create ReportingStructure model
        migrations.CreateModel(
            name='ReportingStructure',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('is_primary', models.BooleanField(default=True)),
                ('effective_from', models.DateField(auto_now_add=True)),
                ('effective_to', models.DateField(blank=True, null=True)),
                ('subordinate', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reporting_to_relations',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('supervisor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='supervising_relations',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Reporting Structure',
                'verbose_name_plural': 'Reporting Structures',
                'db_table': 'reporting_structures',
                'unique_together': {('subordinate', 'supervisor')},
            },
        ),
    ]
