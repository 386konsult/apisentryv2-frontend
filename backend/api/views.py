from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import APIEndpoint, WAFRule, ThreatLog, APIMetrics
from .serializers import (
    APIEndpointSerializer, WAFRuleSerializer, WAFRuleDetailSerializer,
    ThreatLogSerializer, ThreatLogDetailSerializer, APIMetricsSerializer,
    DashboardStatsSerializer, TrafficDataSerializer, ThreatTypeDataSerializer,
    EndpointStatusSerializer
)
from monitoring.models import SystemMetrics, SystemAlert


class APIEndpointListCreateView(generics.ListCreateAPIView):
    """List and create API endpoints."""
    
    queryset = APIEndpoint.objects.all()
    serializer_class = APIEndpointSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_protected', 'method']
    search_fields = ['name', 'path', 'description']
    ordering_fields = ['created_at', 'updated_at', 'request_count', 'avg_response_time']
    ordering = ['-created_at']


class APIEndpointDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete API endpoints."""
    
    queryset = APIEndpoint.objects.all()
    serializer_class = APIEndpointSerializer
    permission_classes = [permissions.IsAuthenticated]


class WAFRuleListCreateView(generics.ListCreateAPIView):
    """List and create WAF rules."""
    
    queryset = WAFRule.objects.all()
    serializer_class = WAFRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rule_type', 'severity', 'is_active', 'action']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'trigger_count']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class WAFRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete WAF rules."""
    
    queryset = WAFRule.objects.all()
    serializer_class = WAFRuleDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class ThreatLogListView(generics.ListAPIView):
    """List threat logs with filtering and pagination."""
    
    queryset = ThreatLog.objects.all()
    serializer_class = ThreatLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['threat_type', 'status', 'severity', 'source_ip', 'endpoint']
    search_fields = ['request_path', 'user_agent', 'notes']
    ordering_fields = ['timestamp', 'severity', 'response_time']
    ordering = ['-timestamp']


class ThreatLogDetailView(generics.RetrieveAPIView):
    """Retrieve detailed threat log information."""
    
    queryset = ThreatLog.objects.all()
    serializer_class = ThreatLogDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get date range (last 7 days by default)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        # Calculate statistics
        total_requests = APIMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).aggregate(total=Sum('total_requests'))['total'] or 0
        
        blocked_threats = ThreatLog.objects.filter(
            timestamp__date__range=[start_date, end_date],
            status='blocked'
        ).count()
        
        clean_requests = total_requests - blocked_threats
        
        active_endpoints = APIEndpoint.objects.filter(status='active').count()
        
        avg_response_time = APIMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).aggregate(avg=Avg('avg_response_time'))['avg'] or 0.0
        
        error_rate = APIMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).aggregate(
            total=Sum('total_requests'),
            errors=Sum('failed_requests')
        )
        error_rate = (error_rate['errors'] or 0) / (error_rate['total'] or 1) * 100
        
        # Get threat types distribution
        threat_types = ThreatLog.objects.filter(
            timestamp__date__range=[start_date, end_date]
        ).values('threat_type').annotate(count=Count('id'))
        
        threat_types_dict = {}
        for threat in threat_types:
            threat_types_dict[threat['threat_type']] = threat['count']
        
        # Get recent threats
        recent_threats = ThreatLog.objects.filter(
            timestamp__date__range=[start_date, end_date]
        ).order_by('-timestamp')[:10]
        
        data = {
            'total_requests': total_requests,
            'blocked_threats': blocked_threats,
            'clean_requests': clean_requests,
            'active_endpoints': active_endpoints,
            'avg_response_time': round(avg_response_time, 2),
            'error_rate': round(error_rate, 2),
            'threat_types': threat_types_dict,
            'recent_threats': ThreatLogSerializer(recent_threats, many=True).data
        }
        
        return Response(data)


class TrafficDataView(APIView):
    """Get traffic data for charts."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get last 7 days of traffic data
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        traffic_data = []
        for i in range(7):
            date = start_date + timedelta(days=i)
            metrics = APIMetrics.objects.filter(date=date).aggregate(
                total_requests=Sum('total_requests'),
                blocked_requests=Sum('blocked_requests')
            )
            
            total = metrics['total_requests'] or 0
            blocked = metrics['blocked_requests'] or 0
            allowed = total - blocked
            
            traffic_data.append({
                'name': date.strftime('%a'),
                'requests': total,
                'blocked': blocked,
                'allowed': allowed
            })
        
        return Response(traffic_data)


class ThreatTypeDataView(APIView):
    """Get threat type distribution data."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get threat types from last 30 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        threat_types = ThreatLog.objects.filter(
            timestamp__date__range=[start_date, end_date]
        ).values('threat_type').annotate(count=Count('id'))
        
        colors = {
            'sql_injection': '#ef4444',
            'xss': '#f97316',
            'csrf': '#eab308',
            'brute_force': '#8b5cf6',
            'file_upload': '#06b6d4',
            'ddos': '#84cc16',
            'bot': '#f59e0b',
            'suspicious': '#ec4899'
        }
        
        threat_data = []
        for threat in threat_types:
            threat_data.append({
                'name': threat['threat_type'].replace('_', ' ').title(),
                'value': threat['count'],
                'color': colors.get(threat['threat_type'], '#6b7280')
            })
        
        return Response(threat_data)


class EndpointStatusView(APIView):
    """Get endpoint status summary."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        endpoints = APIEndpoint.objects.all()
        endpoint_status = []
        
        for endpoint in endpoints:
            # Calculate status based on error rate and response time
            if endpoint.error_rate > 5.0:
                status = 'error'
            elif endpoint.error_rate > 2.0 or endpoint.avg_response_time > 500:
                status = 'warning'
            else:
                status = 'healthy'
            
            endpoint_status.append({
                'endpoint': APIEndpointSerializer(endpoint).data,
                'status': status,
                'request_count': endpoint.request_count,
                'avg_response_time': endpoint.avg_response_time,
                'error_rate': endpoint.error_rate,
                'last_accessed': endpoint.last_accessed,
                'protection': endpoint.is_protected,
                'rules_applied': endpoint.waf_rules.count()
            })
        
        return Response(endpoint_status)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_threat_log(request):
    """Create a new threat log entry."""
    serializer = ThreatLogSerializer(data=request.data)
    if serializer.is_valid():
        threat_log = serializer.save()
        
        # Create system alert for high severity threats
        if threat_log.severity in ['high', 'critical']:
            SystemAlert.objects.create(
                title=f"High severity threat detected: {threat_log.threat_type}",
                message=f"Threat from {threat_log.source_ip} targeting {threat_log.request_path}",
                alert_type='security',
                severity=threat_log.severity,
                threat_log=threat_log
            )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# User management views
from accounts.models import User
from accounts.serializers import UserSerializer, UserDetailSerializer


class UserListView(generics.ListCreateAPIView):
    """List and create users."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete users."""
    
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
