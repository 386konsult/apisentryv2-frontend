from django.db import models
from django.utils import timezone
from accounts.models import User
from api.models import APIEndpoint, ThreatLog


class SystemAlert(models.Model):
    """System alerts and notifications."""
    
    ALERT_TYPE_CHOICES = [
        ('security', 'Security Alert'),
        ('performance', 'Performance Alert'),
        ('availability', 'Availability Alert'),
        ('error', 'Error Alert'),
        ('warning', 'Warning'),
        ('info', 'Information'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Associated data
    endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE, null=True, blank=True, related_name='alerts')
    threat_log = models.ForeignKey(ThreatLog, on_delete=models.CASCADE, null=True, blank=True, related_name='alerts')
    
    # Metadata
    metadata = models.JSONField(default=dict)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"


class DashboardWidget(models.Model):
    """Dashboard widgets configuration for users."""
    
    WIDGET_TYPE_CHOICES = [
        ('chart', 'Chart'),
        ('metric', 'Metric'),
        ('table', 'Table'),
        ('alert', 'Alert Feed'),
        ('map', 'Geographic Map'),
    ]
    
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPE_CHOICES)
    configuration = models.JSONField(default=dict)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_widgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_widgets'
        ordering = ['position']
    
    def __str__(self):
        return f"{self.name} for {self.user.email}"


class SystemMetrics(models.Model):
    """System-wide performance and security metrics."""
    
    date = models.DateField()
    hour = models.PositiveIntegerField(default=0)  # 0-23
    
    # Request metrics
    total_requests = models.PositiveIntegerField(default=0)
    successful_requests = models.PositiveIntegerField(default=0)
    failed_requests = models.PositiveIntegerField(default=0)
    
    # Security metrics
    total_threats = models.PositiveIntegerField(default=0)
    blocked_threats = models.PositiveIntegerField(default=0)
    allowed_threats = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    avg_response_time = models.FloatField(default=0.0)
    p95_response_time = models.FloatField(default=0.0)
    p99_response_time = models.FloatField(default=0.0)
    
    # Error metrics
    error_4xx_count = models.PositiveIntegerField(default=0)
    error_5xx_count = models.PositiveIntegerField(default=0)
    
    # Active endpoints
    active_endpoints = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_metrics'
        unique_together = ['date', 'hour']
        ordering = ['-date', '-hour']
    
    def __str__(self):
        return f"System metrics for {self.date} {self.hour}:00"


class UserSession(models.Model):
    """User session tracking for security monitoring."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    
    login_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-login_time']
    
    def __str__(self):
        return f"Session for {self.user.email} from {self.ip_address}"


class SecurityEvent(models.Model):
    """Security events for audit trail."""
    
    EVENT_TYPE_CHOICES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('failed_login', 'Failed Login'),
        ('password_change', 'Password Change'),
        ('profile_update', 'Profile Update'),
        ('rule_creation', 'WAF Rule Creation'),
        ('rule_update', 'WAF Rule Update'),
        ('rule_deletion', 'WAF Rule Deletion'),
        ('endpoint_add', 'Endpoint Added'),
        ('endpoint_update', 'Endpoint Updated'),
        ('endpoint_delete', 'Endpoint Deleted'),
        ('alert_acknowledge', 'Alert Acknowledged'),
        ('alert_resolve', 'Alert Resolved'),
    ]
    
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    
    # Event details
    details = models.JSONField(default=dict)
    metadata = models.JSONField(default=dict)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['event_type']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} by {self.user.email} at {self.timestamp}"
