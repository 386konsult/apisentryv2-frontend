from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # API Endpoints
    path('endpoints/', views.APIEndpointListCreateView.as_view(), name='endpoint-list'),
    path('endpoints/<int:pk>/', views.APIEndpointDetailView.as_view(), name='endpoint-detail'),
    
    # WAF Rules
    path('waf-rules/', views.WAFRuleListCreateView.as_view(), name='waf-rule-list'),
    path('waf-rules/<int:pk>/', views.WAFRuleDetailView.as_view(), name='waf-rule-detail'),
    
    # Threat Logs
    path('threat-logs/', views.ThreatLogListView.as_view(), name='threat-log-list'),
    path('threat-logs/<int:pk>/', views.ThreatLogDetailView.as_view(), name='threat-log-detail'),
    path('threat-logs/create/', views.create_threat_log, name='create-threat-log'),
    
    # Dashboard Data
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/traffic/', views.TrafficDataView.as_view(), name='traffic-data'),
    path('dashboard/threat-types/', views.ThreatTypeDataView.as_view(), name='threat-type-data'),
    path('dashboard/endpoint-status/', views.EndpointStatusView.as_view(), name='endpoint-status'),
    
    # Users
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
] 