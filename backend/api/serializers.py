from rest_framework import serializers
from .models import APIEndpoint, WAFRule, ThreatLog, APIMetrics


class APIEndpointSerializer(serializers.ModelSerializer):
    """Serializer for APIEndpoint model."""
    
    class Meta:
        model = APIEndpoint
        fields = ['id', 'name', 'path', 'method', 'description', 'status', 'is_protected',
                 'request_count', 'avg_response_time', 'error_rate', 'created_at', 
                 'updated_at', 'last_accessed']
        read_only_fields = ['id', 'request_count', 'avg_response_time', 'error_rate', 
                           'created_at', 'updated_at', 'last_accessed']


class WAFRuleSerializer(serializers.ModelSerializer):
    """Serializer for WAFRule model."""
    
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    endpoint_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WAFRule
        fields = ['id', 'name', 'description', 'rule_type', 'severity', 'pattern', 
                 'is_active', 'action', 'trigger_count', 'created_by_email', 'endpoint_count',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'trigger_count', 'created_at', 'updated_at']
    
    def get_endpoint_count(self, obj):
        return obj.endpoints.count()


class WAFRuleDetailSerializer(serializers.ModelSerializer):
    """Detailed WAF rule serializer with endpoints."""
    
    endpoints = APIEndpointSerializer(many=True, read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = WAFRule
        fields = ['id', 'name', 'description', 'rule_type', 'severity', 'pattern', 
                 'is_active', 'action', 'endpoints', 'trigger_count', 'created_by_email',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'trigger_count', 'created_at', 'updated_at']


class ThreatLogSerializer(serializers.ModelSerializer):
    """Serializer for ThreatLog model."""
    
    endpoint_path = serializers.CharField(source='endpoint.path', read_only=True)
    waf_rule_name = serializers.CharField(source='waf_rule.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ThreatLog
        fields = ['id', 'threat_type', 'status', 'severity', 'source_ip', 'user_agent',
                 'request_path', 'request_method', 'response_code', 'response_time',
                 'endpoint_path', 'waf_rule_name', 'user_email', 'details', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ThreatLogDetailSerializer(serializers.ModelSerializer):
    """Detailed threat log serializer."""
    
    endpoint = APIEndpointSerializer(read_only=True)
    waf_rule = WAFRuleSerializer(read_only=True)
    user = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ThreatLog
        fields = ['id', 'threat_type', 'status', 'severity', 'source_ip', 'user_agent',
                 'request_path', 'request_method', 'request_headers', 'request_body',
                 'response_code', 'response_time', 'endpoint', 'waf_rule', 'user',
                 'details', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class APIMetricsSerializer(serializers.ModelSerializer):
    """Serializer for APIMetrics model."""
    
    endpoint_path = serializers.CharField(source='endpoint.path', read_only=True)
    
    class Meta:
        model = APIMetrics
        fields = ['id', 'endpoint_path', 'date', 'hour', 'total_requests', 'successful_requests',
                 'failed_requests', 'avg_response_time', 'min_response_time', 'max_response_time',
                 'blocked_requests', 'threat_count', 'error_4xx_count', 'error_5xx_count',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    
    total_requests = serializers.IntegerField()
    blocked_threats = serializers.IntegerField()
    clean_requests = serializers.IntegerField()
    active_endpoints = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    threat_types = serializers.DictField()
    recent_threats = ThreatLogSerializer(many=True)


class TrafficDataSerializer(serializers.Serializer):
    """Serializer for traffic data."""
    
    name = serializers.CharField()
    requests = serializers.IntegerField()
    blocked = serializers.IntegerField()
    allowed = serializers.IntegerField()


class ThreatTypeDataSerializer(serializers.Serializer):
    """Serializer for threat type data."""
    
    name = serializers.CharField()
    value = serializers.IntegerField()
    color = serializers.CharField()


class EndpointStatusSerializer(serializers.Serializer):
    """Serializer for endpoint status summary."""
    
    endpoint = APIEndpointSerializer()
    status = serializers.CharField()
    request_count = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    last_accessed = serializers.DateTimeField()
    protection = serializers.BooleanField()
    rules_applied = serializers.IntegerField() 