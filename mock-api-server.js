const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Mock data for code review scans
let scanReports = [
  {
    id: "1",
    scanId: "SCAN-2024-001",
    status: "completed",
    startTime: "2024-01-15T10:00:00Z",
    endTime: "2024-01-15T10:45:00Z",
    totalRepositories: 5,
    scannedRepositories: 5,
    openFindings: 12,
    resolvedFindings: 8,
    averageScore: 78,
    repositories: [
      {
        name: "api-gateway",
        status: "completed",
        score: 92,
        openFindings: 2,
        resolvedFindings: 1,
        lastScan: "2024-01-15",
        risk: "Low",
        findings: [
          {
            id: "1",
            title: "SQL Injection Vulnerability",
            description: "Potential SQL injection vulnerability detected in user input handling",
            severity: "High",
            status: "Open",
            category: "Injection",
            file: "src/auth/service.py",
            line: 45,
            cwe: "CWE-89",
            recommendation: "Use parameterized queries or ORM to prevent SQL injection",
            createdAt: "2024-01-15T10:30:00Z"
          }
        ],
        totalLines: 15420,
        scannedLines: 15420,
        languages: ["Python", "JavaScript", "HTML"],
        contributors: 8
      },
      {
        name: "frontend-app",
        status: "completed",
        score: 78,
        openFindings: 5,
        resolvedFindings: 3,
        lastScan: "2024-01-15",
        risk: "Medium",
        findings: [],
        totalLines: 12340,
        scannedLines: 12340,
        languages: ["TypeScript", "React", "CSS"],
        contributors: 6
      }
    ]
  },
  {
    id: "2",
    scanId: "SCAN-2024-002",
    status: "in_progress",
    startTime: "2024-01-16T09:00:00Z",
    totalRepositories: 5,
    scannedRepositories: 2,
    openFindings: 0,
    resolvedFindings: 0,
    averageScore: 0,
    repositories: [
      {
        name: "api-gateway",
        status: "completed",
        score: 92,
        openFindings: 2,
        resolvedFindings: 1,
        lastScan: "2024-01-16",
        risk: "Low",
        findings: [],
        totalLines: 15420,
        scannedLines: 15420,
        languages: ["Python", "JavaScript", "HTML"],
        contributors: 8
      },
      {
        name: "frontend-app",
        status: "completed",
        score: 78,
        openFindings: 5,
        resolvedFindings: 3,
        lastScan: "2024-01-16",
        risk: "Medium",
        findings: [],
        totalLines: 12340,
        scannedLines: 12340,
        languages: ["TypeScript", "React", "CSS"],
        contributors: 6
      }
    ]
  }
];

let currentScanId = 3;

// Code Review API endpoints
app.post('/api/v1/code-review/start-scan/', (req, res) => {
  const scanId = `SCAN-2024-${String(currentScanId).padStart(3, '0')}`;
  currentScanId++;
  
  const newScan = {
    id: String(currentScanId - 1),
    scanId: scanId,
    status: "in_progress",
    startTime: new Date().toISOString(),
    totalRepositories: 5,
    scannedRepositories: 0,
    openFindings: 0,
    resolvedFindings: 0,
    averageScore: 0,
    repositories: [
      {
        name: "api-gateway",
        status: "pending",
        score: 0,
        openFindings: 0,
        resolvedFindings: 0,
        lastScan: "",
        risk: "Low",
        findings: [],
        totalLines: 15420,
        scannedLines: 0,
        languages: ["Python", "JavaScript", "HTML"],
        contributors: 8
      },
      {
        name: "frontend-app",
        status: "pending",
        score: 0,
        openFindings: 0,
        resolvedFindings: 0,
        lastScan: "",
        risk: "Low",
        findings: [],
        totalLines: 12340,
        scannedLines: 0,
        languages: ["TypeScript", "React", "CSS"],
        contributors: 6
      }
    ]
  };
  
  scanReports.unshift(newScan);
  
  res.json({
    scanId: scanId,
    message: "Code review scan started successfully"
  });
});

app.get('/api/v1/code-review/scan-reports/', (req, res) => {
  res.json({
    results: scanReports
  });
});

app.get('/api/v1/code-review/scan-reports/:reportId', (req, res) => {
  const report = scanReports.find(r => r.id === req.params.reportId);
  if (report) {
    res.json(report);
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

app.get('/api/v1/code-review/scan-status/:scanId', (req, res) => {
  const report = scanReports.find(r => r.scanId === req.params.scanId);
  if (report) {
    const progress = Math.round((report.scannedRepositories / report.totalRepositories) * 100);
    res.json({
      status: report.status,
      progress: progress,
      message: `Scanned ${report.scannedRepositories} of ${report.totalRepositories} repositories`
    });
  } else {
    res.status(404).json({ error: "Scan not found" });
  }
});

// Simulate scan progress
setInterval(() => {
  scanReports.forEach(report => {
    if (report.status === 'in_progress' && report.scannedRepositories < report.totalRepositories) {
      report.scannedRepositories++;
      
      // Update repository status
      const pendingRepo = report.repositories.find(r => r.status === 'pending');
      if (pendingRepo) {
        pendingRepo.status = 'scanning';
        pendingRepo.lastScan = new Date().toISOString().split('T')[0];
      }
      
      // If all repositories are scanned, mark as completed
      if (report.scannedRepositories === report.totalRepositories) {
        report.status = 'completed';
        report.endTime = new Date().toISOString();
        report.averageScore = Math.round(report.repositories.reduce((sum, repo) => sum + repo.score, 0) / report.repositories.length);
        report.openFindings = report.repositories.reduce((sum, repo) => sum + repo.openFindings, 0);
        report.resolvedFindings = report.repositories.reduce((sum, repo) => sum + repo.resolvedFindings, 0);
        
        // Update repository statuses
        report.repositories.forEach(repo => {
          if (repo.status === 'scanning') {
            repo.status = 'completed';
            repo.score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
            repo.openFindings = Math.floor(Math.random() * 5);
            repo.resolvedFindings = Math.floor(Math.random() * 3);
          }
        });
      }
    }
  });
}, 5000); // Update every 5 seconds

// GitHub endpoints for CodeReviewDashboard
app.get('/api/v1/github/repos/', (req, res) => {
  // Check if GitHub is authenticated (you can add a query parameter to simulate this)
  const isAuthenticated = req.query.authenticated === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({
      error: "GitHub profile not found. Please authenticate with GitHub first."
    });
  }
  
  res.json([
    {
      id: 1,
      name: "api-gateway",
      score: 92,
      openFindings: 2,
      resolvedFindings: 1,
      lastScan: "2024-01-15",
      risk: "Low",
      totalLines: 15420,
      scannedLines: 15420,
      languages: ["Python", "JavaScript", "HTML"],
      contributors: 8
    },
    {
      id: 2,
      name: "frontend-app",
      score: 78,
      openFindings: 5,
      resolvedFindings: 3,
      lastScan: "2024-01-15",
      risk: "Medium",
      totalLines: 12340,
      scannedLines: 12340,
      languages: ["TypeScript", "React", "CSS"],
      contributors: 6
    },
    {
      id: 3,
      name: "mobile-app",
      score: 65,
      openFindings: 8,
      resolvedFindings: 2,
      lastScan: "2024-01-14",
      risk: "High",
      totalLines: 8900,
      scannedLines: 8900,
      languages: ["Swift", "Kotlin"],
      contributors: 4
    }
  ]);
});

app.get('/api/v1/github/security-findings/', (req, res) => {
  // Check if GitHub is authenticated
  const isAuthenticated = req.query.authenticated === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({
      error: "GitHub profile not found. Please authenticate with GitHub first."
    });
  }
  
  res.json({
    issues: [
      {
        id: "1",
        file: "src/auth/service.py",
        line: 45,
        code: "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
        type: "SQL Injection",
        risk: "High",
        recommendation: "Use parameterized queries to prevent SQL injection",
        suggestedFix: "query = \"SELECT * FROM users WHERE id = %s\"\ncursor.execute(query, (user_id,))",
        cve: "CWE-89",
        assignedTo: "john.doe@company.com",
        status: "Open",
        repository: "api-gateway",
        createdAt: "2024-01-15T10:30:00Z",
        resolvedAt: null
      },
      {
        id: "2",
        file: "src/components/Login.tsx",
        line: 23,
        code: "const password = document.getElementById('password').value;",
        type: "XSS Vulnerability",
        risk: "Medium",
        recommendation: "Sanitize user input before rendering",
        suggestedFix: "const password = sanitizeInput(document.getElementById('password').value);",
        cve: "CWE-79",
        assignedTo: "jane.smith@company.com",
        status: "Open",
        repository: "frontend-app",
        createdAt: "2024-01-15T11:15:00Z",
        resolvedAt: null
      }
    ]
  });
});

app.get('/api/v1/github/review-stats/', (req, res) => {
  // Check if GitHub is authenticated
  const isAuthenticated = req.query.authenticated === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({
      error: "GitHub profile not found. Please authenticate with GitHub first."
    });
  }
  
  res.json({
    feedback_breakdown: [
      { name: "Positive", value: 45, color: "#10B981" },
      { name: "Neutral", value: 30, color: "#6B7280" },
      { name: "Critical", value: 15, color: "#EF4444" },
      { name: "Suggestions", value: 10, color: "#F59E0B" }
    ],
    tool_findings: [
      { name: "SonarQube", value: 25, color: "#3B82F6" },
      { name: "CodeQL", value: 20, color: "#8B5CF6" },
      { name: "Semgrep", value: 15, color: "#06B6D4" },
      { name: "Bandit", value: 10, color: "#84CC16" }
    ]
  });
});

app.post('/api/v1/github/scan-all/', (req, res) => {
  // Check if GitHub is authenticated
  const isAuthenticated = req.query.authenticated === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({
      error: "GitHub profile not found. Please authenticate with GitHub first."
    });
  }
  
  const scanId = `SCAN-${Date.now()}`;
  res.json({
    scanId: scanId,
    message: "GitHub scan started successfully"
  });
});

// Test endpoint to toggle GitHub authentication state
app.post('/api/v1/github/auth-toggle/', (req, res) => {
  res.json({
    message: "GitHub authentication state toggled. Add ?authenticated=true to any GitHub endpoint to simulate authenticated state."
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock API server is running' });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Code review endpoints:`);
  console.log(`  POST /api/v1/code-review/start-scan/`);
  console.log(`  GET  /api/v1/code-review/scan-reports/`);
  console.log(`  GET  /api/v1/code-review/scan-reports/:reportId`);
  console.log(`  GET  /api/v1/code-review/scan-status/:scanId`);
  console.log(`GitHub endpoints:`);
  console.log(`  GET  /api/v1/github/repos/`);
  console.log(`  GET  /api/v1/github/security-findings/`);
  console.log(`  GET  /api/v1/github/review-stats/`);
  console.log(`  POST /api/v1/github/scan-all/`);
  console.log(`  POST /api/v1/github/auth-toggle/`);
  console.log(`  Note: Add ?authenticated=true to GitHub endpoints to simulate authenticated state`);
}); 