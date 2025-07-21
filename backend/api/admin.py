from django.contrib import admin
from .models import APIEndpoint, WAFRule, ThreatLog, APIMetrics


@admin.register(APIEndpoint)
class APIEndpointAdmin(admin.ModelAdmin):
    list_display = ('name', 'path', 'method', 'status', 'is_protected', 'request_count', 'avg_response_time', 'error_rate', 'last_accessed')
    list_filter = ('status', 'is_protected', 'method', 'created_at')
    search_fields = ('name', 'path', 'description')
    readonly_fields = ('request_count', 'avg_response_time', 'error_rate', 'created_at', 'updated_at', 'last_accessed')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'path', 'method', 'description')
        }),
        ('Status & Protection', {
            'fields': ('status', 'is_protected')
        }),
        ('Performance Metrics', {
            'fields': ('request_count', 'avg_response_time', 'error_rate'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_accessed'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WAFRule)
class WAFRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'rule_type', 'severity', 'is_active', 'action', 'trigger_count', 'created_by', 'created_at')
    list_filter = ('rule_type', 'severity', 'is_active', 'action', 'created_at')
    search_fields = ('name', 'description', 'pattern')
    readonly_fields = ('trigger_count', 'created_at', 'updated_at')
    filter_horizontal = ('endpoints',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'rule_type', 'severity')
        }),
        ('Rule Configuration', {
            'fields': ('pattern', 'is_active', 'action')
        }),
        ('Associated Endpoints', {
            'fields': ('endpoints',)
        }),
        ('Statistics', {
            'fields': ('trigger_count',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ThreatLog)
class ThreatLogAdmin(admin.ModelAdmin):
    list_display = ('threat_type', 'status', 'severity', 'source_ip', 'request_path', 'request_method', 'response_code', 'timestamp')
    list_filter = ('threat_type', 'status', 'severity', 'timestamp', 'endpoint')
    search_fields = ('source_ip', 'request_path', 'user_agent', 'notes')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    fieldsets = (
        ('Threat Information', {
            'fields': ('threat_type', 'status', 'severity')
        }),
        ('Request Details', {
            'fields': ('source_ip', 'user_agent', 'request_path', 'request_method', 'request_headers', 'request_body')
        }),
        ('Response Details', {
            'fields': ('response_code', 'response_time')
        }),
        ('Associated Data', {
            'fields': ('endpoint', 'waf_rule', 'user')
        }),
        ('Additional Information', {
            'fields': ('details', 'notes', 'timestamp'),
            'classes': ('collapse',)
        }),
    )


@admin.register(APIMetrics)
class APIMetricsAdmin(admin.ModelAdmin):
    list_display = ('endpoint', 'date', 'hour', 'total_requests', 'successful_requests', 'failed_requests', 'avg_response_time')
    list_filter = ('date', 'endpoint', 'hour')
    search_fields = ('endpoint__name', 'endpoint__path')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-date', '-hour')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('endpoint', 'date', 'hour')
        }),
        ('Request Metrics', {
            'fields': ('total_requests', 'successful_requests', 'failed_requests')
        }),
        ('Performance Metrics', {
            'fields': ('avg_response_time', 'min_response_time', 'max_response_time')
        }),
        ('Security Metrics', {
            'fields': ('blocked_requests', 'threat_count')
        }),
        ('Error Metrics', {
            'fields': ('error_4xx_count', 'error_5xx_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
