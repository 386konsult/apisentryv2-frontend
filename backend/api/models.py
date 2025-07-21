from django.db import models
from django.utils import timezone
from accounts.models import User


class APIEndpoint(models.Model):
    """Model for API endpoints being monitored."""
    
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE'),
        ('PATCH', 'PATCH'),
        ('HEAD', 'HEAD'),
        ('OPTIONS', 'OPTIONS'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
    ]
    
    name = models.CharField(max_length=200)
    path = models.CharField(max_length=500, unique=True)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_protected = models.BooleanField(default=True)
    
    # Performance metrics
    request_count = models.PositiveIntegerField(default=0)
    avg_response_time = models.FloatField(default=0.0)
    error_rate = models.FloatField(default=0.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'api_endpoints'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.method} {self.path}"


class WAFRule(models.Model):
    """Web Application Firewall rules."""
    
    RULE_TYPE_CHOICES = [
        ('sql_injection', 'SQL Injection'),
        ('xss', 'Cross-Site Scripting'),
        ('csrf', 'CSRF Attack'),
        ('brute_force', 'Brute Force'),
        ('file_upload', 'Malicious File Upload'),
        ('rate_limit', 'Rate Limiting'),
        ('custom', 'Custom Rule'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    
    # Rule configuration
    pattern = models.TextField(help_text="Regex pattern or rule definition")
    is_active = models.BooleanField(default=True)
    action = models.CharField(max_length=20, choices=[
        ('block', 'Block'),
        ('log', 'Log Only'),
        ('redirect', 'Redirect'),
    ], default='block')
    
    # Associated endpoints
    endpoints = models.ManyToManyField(APIEndpoint, blank=True, related_name='waf_rules')
    
    # Statistics
    trigger_count = models.PositiveIntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'waf_rules'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"


class ThreatLog(models.Model):
    """Log of security threats and attacks."""
    
    THREAT_TYPE_CHOICES = [
        ('sql_injection', 'SQL Injection'),
        ('xss', 'Cross-Site Scripting'),
        ('csrf', 'CSRF Attack'),
        ('brute_force', 'Brute Force'),
        ('file_upload', 'Malicious File Upload'),
        ('ddos', 'DDoS Attack'),
        ('bot', 'Bot Traffic'),
        ('suspicious', 'Suspicious Activity'),
    ]
    
    STATUS_CHOICES = [
        ('blocked', 'Blocked'),
        ('allowed', 'Allowed'),
        ('quarantined', 'Quarantined'),
        ('investigating', 'Under Investigation'),
    ]
    
    # Threat details
    threat_type = models.CharField(max_length=20, choices=THREAT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='blocked')
    severity = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ], default='medium')
    
    # Request details
    source_ip = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    request_path = models.CharField(max_length=500)
    request_method = models.CharField(max_length=10)
    request_headers = models.JSONField(default=dict)
    request_body = models.TextField(blank=True, null=True)
    
    # Response details
    response_code = models.PositiveIntegerField(null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)
    
    # Associated data
    endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE, related_name='threat_logs')
    waf_rule = models.ForeignKey(WAFRule, on_delete=models.SET_NULL, null=True, blank=True, related_name='triggered_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='threat_logs')
    
    # Additional info
    details = models.JSONField(default=dict)
    notes = models.TextField(blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'threat_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['source_ip']),
            models.Index(fields=['threat_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.threat_type} from {self.source_ip} at {self.timestamp}"


class APIMetrics(models.Model):
    """API performance and security metrics."""
    
    endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField()
    hour = models.PositiveIntegerField(default=0)  # 0-23
    
    # Request metrics
    total_requests = models.PositiveIntegerField(default=0)
    successful_requests = models.PositiveIntegerField(default=0)
    failed_requests = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    avg_response_time = models.FloatField(default=0.0)
    min_response_time = models.FloatField(default=0.0)
    max_response_time = models.FloatField(default=0.0)
    
    # Security metrics
    blocked_requests = models.PositiveIntegerField(default=0)
    threat_count = models.PositiveIntegerField(default=0)
    
    # Error metrics
    error_4xx_count = models.PositiveIntegerField(default=0)
    error_5xx_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_metrics'
        unique_together = ['endpoint', 'date', 'hour']
        ordering = ['-date', '-hour']
    
    def __str__(self):
        return f"{self.endpoint.path} - {self.date} {self.hour}:00"
