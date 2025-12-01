# Security Report API Response Format

This document describes the expected API response format for the `SecurityReportView` component.

## Endpoint
`GET /analysis-runs/<uuid:analysis_run_id>/security-report/`

## Expected Response Format

```json
{
  "repository": "string",
  "branch": "string",
  "scanId": "string",
  "generatedAt": "ISO 8601 datetime string",
  "totalFilesScanned": 1248,
  "totalFindings": 76,
  "criticalFindings": 3,
  "highFindings": 7,
  "mediumFindings": 21,
  "lowFindings": 45,
  "owaspFindings": {
    "A01": 11,
    "A02": 4,
    "A03": 7,
    "A04": 3,
    "A05": 9,
    "A06": 5,
    "A07": 6,
    "A08": 4,
    "A09": 3,
    "A10": 2
  },
  "severityTrend": {
    "criticalHigh": [16, 15, 13, 12, 10],
    "mediumLow": [80, 72, 69, 62, 66]
  },
  "dependencies": {
    "total": 134,
    "withCVEs": 9,
    "outdated": 4
  },
  "compliance": {
    "owaspAsvs": 82,
    "soc2": 74,
    "iso27001": 69,
    "pciDss": 63,
    "gdpr": 76,
    "custom": 64
  },
  "frameworks": "Express, Django, React",
  "languages": "TypeScript, Python, JavaScript",
  "estimated_lines_of_code": "85,000+",
  "estimated_files_scanned": "1,200+",
  "exclusions": "Test fixtures, vendor directories, generated code",
  "custom_compliance_mapping": "SOC 2, ISO 27001, PCI DSS (partial)",
  "owasp_top3_mapping": [
    {
      "code": "A01",
      "title": "Broken Access Control",
      "description": "Multiple instances of missing authorization checks in API endpoints",
      "count": 11
    },
    {
      "code": "A03",
      "title": "Injection",
      "description": "SQL injection vulnerabilities detected in database query construction",
      "count": 7
    },
    {
      "code": "A05",
      "title": "Security Misconfiguration",
      "description": "Default credentials and insecure configuration settings found",
      "count": 9
    }
  ],
  "security_risks": [
    {
      "title": "Hardcoded API Keys",
      "count": 2
    },
    {
      "title": "Weak Password Policies",
      "count": 5
    },
    {
      "title": "Missing HTTPS Enforcement",
      "count": 3
    }
  ],
  "performance_risks": [
    {
      "title": "N+1 Query Pattern Detected"
    },
    {
      "title": "Large File Uploads Without Streaming"
    },
    {
      "title": "Missing Database Indexes"
    }
  ],
  "good_practices": [
    "Parameterized queries used consistently",
    "Input validation implemented at API boundaries",
    "Error handling prevents information leakage",
    "Logging framework properly configured",
    "Dependency versions are up to date"
  ],
  "commit_trend_description": "Security findings have decreased over the last 4 scans, with critical and high-severity issues showing a downward trend from 16 to 10. Medium and low-severity findings have also improved from 80 to 66.",
  "issues_by_category": [
    {
      "title": "SQL Injection in User Authentication",
      "count": 5,
      "severity": "Critical",
      "file": "src/api/auth.py",
      "line": 142,
      "category": "Injection",
      "description": "Direct string concatenation in SQL query allows SQL injection",
      "code": "query = f\"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'\"",
      "recommendation": "Use parameterized queries or an ORM to prevent SQL injection"
    },
    {
      "title": "Missing Authorization Check",
      "count": 8,
      "severity": "High",
      "file": "src/api/users.py",
      "line": 89,
      "category": "Access Control",
      "description": "Endpoint allows access to user data without verifying user permissions",
      "code": "def get_user_data(user_id):\n    return db.query(User).filter(User.id == user_id).first()",
      "recommendation": "Add authorization check to verify the requesting user has permission to access this data"
    },
    {
      "title": "Weak Password Hashing",
      "count": 3,
      "severity": "Medium",
      "file": "src/utils/crypto.py",
      "line": 45,
      "category": "Cryptography",
      "description": "Using MD5 for password hashing which is cryptographically broken",
      "code": "hashed = hashlib.md5(password.encode()).hexdigest()",
      "recommendation": "Use bcrypt, argon2, or PBKDF2 with sufficient iterations for password hashing"
    }
  ],
  "top_5_risks": [
    {
      "title": "SQL Injection in authentication endpoint"
    },
    {
      "title": "Missing rate limiting on API endpoints"
    },
    {
      "title": "Hardcoded credentials in configuration files"
    },
    {
      "title": "Insecure session management"
    },
    {
      "title": "Missing input validation on user uploads"
    }
  ],
  "immediate_remediation_timeline": [
    {
      "title": "Fix SQL injection vulnerabilities in authentication flow"
    },
    {
      "title": "Remove hardcoded credentials and implement secret management"
    },
    {
      "title": "Add rate limiting to all public-facing API endpoints"
    },
    {
      "title": "Implement proper authorization checks on user data endpoints"
    }
  ]
}
```

## Field Descriptions

### Required Fields

- **repository** (string): Name of the repository being scanned
- **branch** (string): Git branch that was scanned
- **scanId** (string): Unique identifier for this scan
- **generatedAt** (string): ISO 8601 datetime when the report was generated
- **totalFilesScanned** (number): Total number of files analyzed
- **totalFindings** (number): Total number of security findings
- **criticalFindings** (number): Count of critical severity findings
- **highFindings** (number): Count of high severity findings
- **mediumFindings** (number): Count of medium severity findings
- **lowFindings** (number): Count of low/info severity findings
- **owaspFindings** (object): Count of findings per OWASP Top 10 category (A01-A10)
- **severityTrend** (object): Historical trend data
  - **criticalHigh** (array): Array of 5 numbers representing critical+high findings over last 5 scans
  - **mediumLow** (array): Array of 5 numbers representing medium+low findings over last 5 scans
- **dependencies** (object): Dependency analysis results
  - **total** (number): Total dependencies (direct + transitive)
  - **withCVEs** (number): Dependencies with known CVEs
  - **outdated** (number): Outdated major versions
- **compliance** (object): Compliance framework scores (0-100)
  - **owaspAsvs** (number): OWASP ASVS compliance score
  - **soc2** (number): SOC 2 compliance score
  - **iso27001** (number): ISO 27001 compliance score
  - **pciDss** (number): PCI DSS compliance score
  - **gdpr** (number): GDPR compliance score
  - **custom** (number): Custom compliance framework score
- **owasp_top3_mapping** (array): Top 3 OWASP categories with details
  - **code** (string): OWASP category code (e.g., "A01")
  - **title** (string): Category title
  - **description** (string, optional): Description of findings in this category
  - **count** (number, optional): Number of findings in this category

### Optional Fields

- **frameworks** (string): Technologies/frameworks used (e.g., "Express, Django, React")
- **languages** (string): Programming languages detected (e.g., "TypeScript, Python, JavaScript")
- **estimated_lines_of_code** (string | number): Estimated lines of code
- **estimated_files_scanned** (string | number): Estimated number of files scanned
- **exclusions** (string): Description of what was excluded from scanning
- **custom_compliance_mapping** (string): Description of custom compliance mappings
- **security_risks** (array): List of security risks with counts
  - **title** (string): Risk title
  - **count** (number): Number of instances
- **performance_risks** (array): List of performance risks
  - **title** (string): Risk title
- **good_practices** (array): List of detected good practices (array of strings)
- **commit_trend_description** (string): Narrative description of commit/scan trends
- **issues_by_category** (array): Detailed issues grouped by category
  - **title** (string): Issue title
  - **count** (number): Number of instances
  - **severity** (string): "Critical" | "High" | "Medium" | "Low"
  - **file** (string, optional): File path where issue was found
  - **line** (number, optional): Line number
  - **category** (string, optional): Issue category
  - **description** (string, optional): Detailed description
  - **code** (string, optional): Code snippet showing the issue
  - **recommendation** (string, optional): Recommended fix
- **top_5_risks** (array): Top 5 risks to prioritize
  - **title** (string): Risk title
- **immediate_remediation_timeline** (array): Immediate actions (0-2 weeks)
  - **title** (string): Action title

## Notes

1. All numeric fields should be non-negative integers
2. Arrays should contain at least the minimum items shown in examples (component has fallbacks for empty arrays)
3. Dates should be in ISO 8601 format (e.g., "2025-01-15T12:00:00Z")
4. The component has fallback values for missing data, but providing complete data ensures accurate reporting
5. Severity trend arrays should contain exactly 5 numbers representing the last 5 scans
6. Compliance scores are percentages (0-100)

