import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Shield, FileText, Code, Filter, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

const SecurityDashboard = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedFramework, setSelectedFramework] = useState('ALL');
  const [backendVulnerabilities, setBackendVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);


  // Use backend vulnerabilities if available, otherwise fall back to mock data
  const vulnerabilities = backendVulnerabilities;

  useEffect(() => {
    const fetchVulnerabilities = async () => {
      if (!repoName) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        // Get platform ID from localStorage
        const platformId = localStorage.getItem('selected_platform_id');
        if (!platformId) {
          console.log("No platform selected, skipping API call");
          return;
        }

        // Fetch repository list to get full_name and html_url
        const reposResponse = await fetch(
          `${API_BASE_URL}/github/repos/?page=1&page_size=100&platform_id=${platformId}`,
          { headers }
        );
        
        if (!reposResponse.ok) {
          console.log("Failed to fetch repository list:", reposResponse.status, reposResponse.statusText);
          return;
        }
        
        const repos = await reposResponse.json();
        const repoDetails = repos.find((repo: { name: string; full_name: string }) => repo.name === repoName);
        
        if (!repoDetails) {
          console.log(`Repository with name '${repoName}' not found in the list`);
          return;
        }
        
        const fullName = repoDetails.full_name;
        const [owner, repo] = fullName.split("/");
        
        if (!owner || !repo) {
          console.log("Invalid repository full_name format:", fullName);
          return;
        }
        
        const repo_url = repoDetails.html_url;
        
        // Fetch vulnerabilities from backend
        const issuesResponse = await fetch(
          `${API_BASE_URL}/github/repos/${owner}/${repo}/issues/?platform_id=${platformId}&repo_url=${repo_url}`,
          { headers }
        );
        
        if (!issuesResponse.ok) {
          console.log("Failed to fetch issues:", issuesResponse.status, issuesResponse.statusText);
          return;
        }
        
        const issuesData = await issuesResponse.json();
        const backendIssues = issuesData.issues || issuesData || [];
        
        console.log("Backend vulnerabilities response:", issuesData);
        console.log("Parsed vulnerabilities:", backendIssues);
        
        setBackendVulnerabilities(backendIssues);
        
      } catch (error) {
        console.error("Error fetching vulnerabilities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVulnerabilities();
  }, [repoName]);

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const severityMatch = selectedSeverity === 'ALL' || vuln.severity === selectedSeverity;
    const frameworkMatch = selectedFramework === 'ALL' || 
      vuln.security_frameworks?.supplementary?.includes(selectedFramework) ||
      vuln.security_frameworks?.primary === selectedFramework;
    return severityMatch && frameworkMatch;
  });

  // Normalize severity for summary cards
  const severityCounts = vulnerabilities.reduce((acc, vuln) => {
    let sev = (vuln.severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW') {
      acc[sev] = (acc[sev] || 0) + 1;
    }
    return acc;
  }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });

  // Count open/closed issues
  const statusCounts = vulnerabilities.reduce(
    (acc, vuln) => {
      const status = (vuln.status || '').toLowerCase();
      if (status === 'open') acc.open++;
      else if (status === 'closed' || status === 'resolved') acc.closed++;
      return acc;
    },
    { open: 0, closed: 0 }
  );

  return (
    <div className="space-y-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="rounded-lg shadow-sm tech-glow">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Scan Report</h1>
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
            {backendVulnerabilities.length > 0 && (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                { repoName }
              </span>
            )}
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 tech-glow">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-semibold">Critical</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{severityCounts.CRITICAL}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 tech-glow">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-semibold">High</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{severityCounts.HIGH}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 tech-glow">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-semibold">Medium</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{severityCounts.MEDIUM}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 tech-glow">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-semibold">Low</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{severityCounts.LOW}</div>
            </div>
          </div>

          {/* Open/Closed Issues Summary */}
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Open</span>
              <span className="font-bold">{statusCounts.open}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-semibold">Closed</span>
              <span className="font-bold">{statusCounts.closed}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <select 
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="ALL">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Assigned">Assigned</option>
            </select>
          </div>
        </div>

        {/* Vulnerability List */}
        <div className="space-y-4">
          {filteredVulnerabilities.map((vuln) => (
            <div key={vuln.issue_id} className="bg-card rounded-lg shadow-sm border tech-glow">
              {/* Vulnerability Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedIssue(expandedIssue === vuln.issue_id ? null : vuln.issue_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* <div className="flex items-center gap-2">
                      {expandedIssue === vuln.issue_id ? 
                        <ChevronDown className="w-5 h-5 text-muted-foreground" /> : 
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      }
                      {getSeverityIcon(vuln.severity)}
                    </div> */}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-foreground">{vuln.title}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                          {vuln.issue_id}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                          {vuln.status}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 text-sm">{vuln.description}</p>
                      
                      {/* Framework Tags - Only show if security_frameworks exists */}
                      {vuln.security_frameworks && (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {vuln.owasp_category}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            {vuln.cwe_id}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            {vuln.security_frameworks.threat_model_category}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                            {vuln.security_frameworks.sans_cwe_ranking?.split(' - ')[1]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIssue === vuln.issue_id && (
                <div className="border-t bg-muted/30 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Code Issues */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Affected Code
                      </h4>
                      <div className="space-y-3">
                        {vuln.file_issues?.map((file, index) => (
                          <div key={index} className="bg-background border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{file.file_path}</span>
                              <span className="text-sm text-muted-foreground">Line {file.line_number}</span>
                            </div>
                            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono mb-2">
                              {file.code_snippet}
                            </div>
                            <div className="text-sm text-muted-foreground">Suggested Fix:</div>
                            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono mb-2">
                              {file.solution_code}
                            </div>
                            <p className="text-sm text-muted-foreground">{file.context}</p>
                          </div>
                        )) || (
                          <div className="bg-background border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">No file issues available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Framework Details & Remediation */}
                    <div className="space-y-6">
                      {vuln.security_frameworks && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Security Framework Analysis
                          </h4>
                          <div className="bg-background border rounded-lg p-4 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Primary Framework:</span>
                              <span className="ml-2 text-sm text-foreground">{vuln?.security_frameworks?.primary}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">OWASP Category:</span>
                              <span className="ml-2 text-sm text-blue-600">{vuln?.owasp_category}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">CWE Classification:</span>
                              <span className="ml-2 text-sm text-purple-600">
                               <a href={`${vuln?.cwe_url}`} target="_blank" rel="noopener noreferrer">{vuln?.cwe_id}</a>
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">STRIDE Category:</span>
                              <span className="ml-2 text-sm text-green-600">{vuln?.security_frameworks?.threat_model_category}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">SANS Ranking:</span>
                              <span className="ml-2 text-sm text-orange-600">{vuln?.security_frameworks?.sans_cwe_ranking}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">NIST SSDF References:</span>
                              <span className="ml-2 text-sm text-orange-600">{vuln?.security_frameworks?.nist_ssdf}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Remediation</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm text-green-800">{vuln.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredVulnerabilities.length === 0 && (
          <div className="bg-card rounded-lg shadow-sm border p-12 text-center tech-glow">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No vulnerabilities found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;