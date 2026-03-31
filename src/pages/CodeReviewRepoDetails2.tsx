import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Shield, FileText, Code, Filter, ChevronDown, ChevronRight, ExternalLink, CheckCircle, XCircle, Package, Lightbulb, TrendingUp, Eye, X } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SecurityDashboard = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedFramework, setSelectedFramework] = useState('ALL');
  const [backendVulnerabilities, setBackendVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [complianceFindings, setComplianceFindings] = useState<any>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [bestPracticesData, setBestPracticesData] = useState<any>(null);
  const [bestPracticesLoading, setBestPracticesLoading] = useState(false);
  const [selectedBestPractice, setSelectedBestPractice] = useState<any>(null);
  const [isBestPracticeModalOpen, setIsBestPracticeModalOpen] = useState(false);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dependencyIssuesData, setDependencyIssuesData] = useState<any>(null);
  const [dependencyIssuesLoading, setDependencyIssuesLoading] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);


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

        // Get repo_url and analysis_run_id from URL params if available
        const urlParams = new URLSearchParams(window.location.search);
        const repoUrlFromParams = urlParams.get('repo_url');
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          setAnalysisRunId(analysisRunIdFromParams);
        }

        let repo_url = '';
        
        // If repo_url is provided in params, use it directly to call the unified endpoint
        if (repoUrlFromParams) {
          repo_url = repoUrlFromParams;
          
          // Call the unified codereview/repos/issues/ endpoint
          const issuesResponse = await fetch(
            `${API_BASE_URL}/repos/issues/?platform_id=${platformId}&repo_url=${encodeURIComponent(repo_url)}`,
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
          
          // Extract analysis_run_id from response if available (check multiple possible locations)
          if (issuesData.analysis_run_id) {
            console.log("Found analysis_run_id in issues response:", issuesData.analysis_run_id);
            setAnalysisRunId(issuesData.analysis_run_id);
          } else if (issuesData.analysis_run?.id) {
            console.log("Found analysis_run_id in nested analysis_run:", issuesData.analysis_run.id);
            setAnalysisRunId(issuesData.analysis_run.id);
          } else if (backendIssues.length > 0 && backendIssues[0]?.analysis_run_id) {
            console.log("Found analysis_run_id in first issue:", backendIssues[0].analysis_run_id);
            setAnalysisRunId(backendIssues[0].analysis_run_id);
          }
          
          setBackendVulnerabilities(backendIssues);
          return;
        }

        // If repo_url is not in params, try to find repo from the list
        let repoDetails: any = null;
        let isBitbucket = false;

        // Try to fetch from GitHub repos first
        try {
          const githubReposResponse = await fetch(
            `${API_BASE_URL}/github/repos/?page=1&page_size=100&platform_id=${platformId}`,
            { headers }
          );
        
          if (githubReposResponse.ok) {
            const githubRepos = await githubReposResponse.json();
            const reposList = Array.isArray(githubRepos) ? githubRepos : (githubRepos.results || []);
            repoDetails = reposList.find((repo: { name: string; full_name: string }) => repo.name === repoName);
            
            if (repoDetails) {
              repo_url = repoDetails.html_url;
              isBitbucket = false;
            }
          }
        } catch (error) {
          console.log("Error fetching GitHub repos:", error);
        }

        // If not found in GitHub, try Bitbucket repos
        if (!repoDetails) {
          try {
            const bitbucketReposResponse = await fetch(
              `${API_BASE_URL}/bitbucket/repos/?page=1&page_size=100&platform_id=${platformId}`,
              { headers }
            );
            
            if (bitbucketReposResponse.ok) {
              const bitbucketRepos = await bitbucketReposResponse.json();
              const reposList = Array.isArray(bitbucketRepos) ? bitbucketRepos : (bitbucketRepos.results || []);
              repoDetails = reposList.find((repo: { name: string; full_name: string }) => repo.name === repoName);
              
              if (repoDetails) {
                repo_url = repoDetails.html_url;
                isBitbucket = true;
              }
            }
          } catch (error) {
            console.log("Error fetching Bitbucket repos:", error);
          }
        }
        
        if (!repoDetails || !repo_url) {
          console.log(`Repository with name '${repoName}' not found in the list`);
          return;
        }

        // Determine if it's Bitbucket from repo_url if not already determined
        if (!isBitbucket && repo_url) {
          isBitbucket = repo_url.includes('bitbucket.org');
        }
        
        // Use the unified endpoint for both GitHub and Bitbucket
        const issuesResponse = await fetch(
          `${API_BASE_URL}/codereview/repos/issues/?platform_id=${platformId}&repo_url=${encodeURIComponent(repo_url)}`,
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
        
        // Extract analysis_run_id from response if available (check multiple possible locations)
        if (issuesData.analysis_run_id) {
          console.log("Found analysis_run_id in issues response:", issuesData.analysis_run_id);
          setAnalysisRunId(issuesData.analysis_run_id);
        } else if (issuesData.analysis_run?.id) {
          console.log("Found analysis_run_id in nested analysis_run:", issuesData.analysis_run.id);
          setAnalysisRunId(issuesData.analysis_run.id);
        } else if (backendIssues.length > 0 && backendIssues[0]?.analysis_run_id) {
          console.log("Found analysis_run_id in first issue:", backendIssues[0].analysis_run_id);
          setAnalysisRunId(backendIssues[0].analysis_run_id);
        }
        
        setBackendVulnerabilities(backendIssues);
        
      } catch (error) {
        console.error("Error fetching vulnerabilities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVulnerabilities();
  }, [repoName]);

  // Fetch compliance findings when compliance tab is active
  useEffect(() => {
    const fetchComplianceFindings = async () => {
      console.log("Compliance tab effect triggered:", { activeTab, analysisRunId });
      
      if (activeTab !== 'compliance') {
        console.log("Not on compliance tab, skipping");
        return;
      }

      if (!analysisRunId) {
        console.log("No analysis_run_id available. Checking URL params and response data...");
        
        // Try to get from URL params again
        const urlParams = new URLSearchParams(window.location.search);
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          console.log("Found analysis_run_id in URL params:", analysisRunIdFromParams);
          setAnalysisRunId(analysisRunIdFromParams);
          // Continue with the fetch below
        } else {
          console.error("No analysis_run_id found in URL params or state. Cannot fetch compliance findings.");
          setComplianceFindings(null);
          return;
        }
      }

      const runIdToUse = analysisRunId || new URLSearchParams(window.location.search).get('analysis_run_id');
      
      if (!runIdToUse) {
        console.error("Still no analysis_run_id available after checks");
        return;
      }

      try {
        console.log("Fetching compliance findings for analysis_run_id:", runIdToUse);
        setComplianceLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const apiUrl = `${API_BASE_URL}/analysis-runs/${runIdToUse}/compliance-findings/`;
        console.log("API URL:", apiUrl);

        const response = await fetch(apiUrl, { headers });

        console.log("Compliance findings response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch compliance findings:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setComplianceFindings(null);
          return;
        }

        const data = await response.json();
        console.log("Compliance findings response data:", data);
        setComplianceFindings(data);
      } catch (error) {
        console.error("Error fetching compliance findings:", error);
        setComplianceFindings(null);
      } finally {
        setComplianceLoading(false);
      }
    };

    fetchComplianceFindings();
  }, [activeTab, analysisRunId]);

  // Fetch best practices when best practices tab is active
  useEffect(() => {
    const fetchBestPractices = async () => {
      console.log("Best practices tab effect triggered:", { activeTab, analysisRunId });
      
      if (activeTab !== 'best-practices') {
        console.log("Not on best practices tab, skipping");
        return;
      }

      if (!analysisRunId) {
        console.log("No analysis_run_id available. Checking URL params and response data...");
        
        // Try to get from URL params again
        const urlParams = new URLSearchParams(window.location.search);
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          console.log("Found analysis_run_id in URL params:", analysisRunIdFromParams);
          setAnalysisRunId(analysisRunIdFromParams);
          // Continue with the fetch below
        } else {
          console.error("No analysis_run_id found in URL params or state. Cannot fetch best practices.");
          setBestPracticesData(null);
          return;
        }
      }

      const runIdToUse = analysisRunId || new URLSearchParams(window.location.search).get('analysis_run_id');
      
      if (!runIdToUse) {
        console.error("Still no analysis_run_id available after checks");
        return;
      }

      try {
        console.log("Fetching best practices for analysis_run_id:", runIdToUse);
        setBestPracticesLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const apiUrl = `${API_BASE_URL}/analysis-runs/${runIdToUse}/best-practices/`;
        console.log("API URL:", apiUrl);

        const response = await fetch(apiUrl, { headers });

        console.log("Best practices response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch best practices:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setBestPracticesData(null);
          return;
        }

        const data = await response.json();
        console.log("Best practices response data:", data);
        setBestPracticesData(data);
      } catch (error) {
        console.error("Error fetching best practices:", error);
        setBestPracticesData(null);
      } finally {
        setBestPracticesLoading(false);
      }
    };

    fetchBestPractices();
  }, [activeTab, analysisRunId]);

  // Fetch priority recommendations when recommendations tab is active
  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log("Recommendations tab effect triggered:", { activeTab, analysisRunId });
      
      if (activeTab !== 'recommendations') {
        console.log("Not on recommendations tab, skipping");
        return;
      }

      if (!analysisRunId) {
        console.log("No analysis_run_id available. Checking URL params and response data...");
        
        // Try to get from URL params again
        const urlParams = new URLSearchParams(window.location.search);
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          console.log("Found analysis_run_id in URL params:", analysisRunIdFromParams);
          setAnalysisRunId(analysisRunIdFromParams);
          // Continue with the fetch below
        } else {
          console.error("No analysis_run_id found in URL params or state. Cannot fetch recommendations.");
          setRecommendationsData(null);
          return;
        }
      }

      const runIdToUse = analysisRunId || new URLSearchParams(window.location.search).get('analysis_run_id');
      
      if (!runIdToUse) {
        console.error("Still no analysis_run_id available after checks");
        return;
      }

      try {
        console.log("Fetching priority recommendations for analysis_run_id:", runIdToUse);
        setRecommendationsLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const apiUrl = `${API_BASE_URL}/analysis-runs/${runIdToUse}/priority-recommendations/`;
        console.log("API URL:", apiUrl);

        const response = await fetch(apiUrl, { headers });

        console.log("Priority recommendations response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch priority recommendations:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setRecommendationsData(null);
          return;
        }

        const data = await response.json();
        console.log("Priority recommendations response data:", data);
        setRecommendationsData(data);
      } catch (error) {
        console.error("Error fetching priority recommendations:", error);
        setRecommendationsData(null);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeTab, analysisRunId]);

  // Fetch dashboard data when summary tab is active
  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("Summary tab effect triggered:", { activeTab, analysisRunId });
      
      if (activeTab !== 'summary') {
        console.log("Not on summary tab, skipping");
        return;
      }

      if (!analysisRunId) {
        console.log("No analysis_run_id available. Checking URL params and response data...");
        
        // Try to get from URL params again
        const urlParams = new URLSearchParams(window.location.search);
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          console.log("Found analysis_run_id in URL params:", analysisRunIdFromParams);
          setAnalysisRunId(analysisRunIdFromParams);
          // Continue with the fetch below
        } else {
          console.error("No analysis_run_id found in URL params or state. Cannot fetch dashboard data.");
          setDashboardData(null);
          return;
        }
      }

      const runIdToUse = analysisRunId || new URLSearchParams(window.location.search).get('analysis_run_id');
      
      if (!runIdToUse) {
        console.error("Still no analysis_run_id available after checks");
        return;
      }

      try {
        console.log("Fetching dashboard data for analysis_run_id:", runIdToUse);
        setDashboardLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const apiUrl = `${API_BASE_URL}/analysis-runs/${runIdToUse}/dashboard/`;
        console.log("API URL:", apiUrl);

        const response = await fetch(apiUrl, { headers });

        console.log("Dashboard response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch dashboard data:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setDashboardData(null);
          return;
        }

        const data = await response.json();
        console.log("Dashboard response data:", data);
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData(null);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTab, analysisRunId]);

  // Fetch dependency issues when dependencies tab is active
  useEffect(() => {
    const fetchDependencyIssues = async () => {
      console.log("Dependencies tab effect triggered:", { activeTab, analysisRunId });
      
      if (activeTab !== 'dependencies') {
        console.log("Not on dependencies tab, skipping");
        return;
      }

      if (!analysisRunId) {
        console.log("No analysis_run_id available. Checking URL params and response data...");
        
        // Try to get from URL params again
        const urlParams = new URLSearchParams(window.location.search);
        const analysisRunIdFromParams = urlParams.get('analysis_run_id');
        
        if (analysisRunIdFromParams) {
          console.log("Found analysis_run_id in URL params:", analysisRunIdFromParams);
          setAnalysisRunId(analysisRunIdFromParams);
          // Continue with the fetch below
        } else {
          console.error("No analysis_run_id found in URL params or state. Cannot fetch dependency issues.");
          setDependencyIssuesData(null);
          return;
        }
      }

      const runIdToUse = analysisRunId || new URLSearchParams(window.location.search).get('analysis_run_id');
      
      if (!runIdToUse) {
        console.error("Still no analysis_run_id available after checks");
        return;
      }

      try {
        console.log("Fetching dependency issues for analysis_run_id:", runIdToUse);
        setDependencyIssuesLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const apiUrl = `${API_BASE_URL}/analysis-runs/${runIdToUse}/dependency-issues/`;
        console.log("API URL:", apiUrl);

        const response = await fetch(apiUrl, { headers });

        console.log("Dependency issues response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch dependency issues:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setDependencyIssuesData(null);
          return;
        }

        const data = await response.json();
        console.log("Dependency issues response data:", data);
        setDependencyIssuesData(data);
      } catch (error) {
        console.error("Error fetching dependency issues:", error);
        setDependencyIssuesData(null);
      } finally {
        setDependencyIssuesLoading(false);
      }
    };

    fetchDependencyIssues();
  }, [activeTab, analysisRunId]);

  const getSeverityColor = (severity) => {
    const sev = (severity || '').toUpperCase();
    const colors = {
      CRITICAL: 'bg-gray-900 text-white border-gray-700',
      HIGH: 'bg-gray-700 text-white border-gray-600',
      MEDIUM: 'bg-gray-500 text-white border-gray-400',
      LOW: 'bg-gray-300 text-gray-800 border-gray-400'
    };
    return colors[sev] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const getStatusIndicator = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'implemented') {
      return {
        emoji: '✅',
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Implemented'
      };
    } else if (statusLower === 'partially_implemented' || statusLower === 'partially implemented') {
      return {
        emoji: '⚠️',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Partially Implemented'
      };
    } else if (statusLower === 'not_implemented' || statusLower === 'not implemented') {
      return {
        emoji: '❌',
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Not Implemented'
      };
    }
    return {
      emoji: '➖',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      text: status || 'Unknown'
    };
  };

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const vulnSeverity = (vuln.severity || '').toUpperCase();
    const severityMatch = selectedSeverity === 'ALL' || vulnSeverity === selectedSeverity;
    const frameworkMatch = selectedFramework === 'ALL' || 
      vuln.security_frameworks?.supplementary?.includes(selectedFramework) ||
      vuln.security_frameworks?.primary === selectedFramework;
    return severityMatch && frameworkMatch;
  });

  // Normalize severity for summary cards
  const severityCounts = vulnerabilities.reduce((acc, vuln) => {
    let sev = (vuln.severity || '').toUpperCase();
    // Handle both uppercase and lowercase severity values
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

  // Extract compliance frameworks data
  const complianceFrameworks = vulnerabilities.reduce((acc, vuln) => {
    if (vuln.affected_compliance_frameworks && Array.isArray(vuln.affected_compliance_frameworks)) {
      vuln.affected_compliance_frameworks.forEach((framework: any) => {
        const frameworkName = framework.framework || 'Unknown';
        if (!acc[frameworkName]) {
          acc[frameworkName] = {
            framework: frameworkName,
            controls: [],
            totalControls: 0,
            implemented: 0,
            notImplemented: 0,
            partiallyImplemented: 0,
          };
        }
        if (framework.affected_control) {
          const control = {
            title: framework.affected_control,
            status: framework.status || 'not_implemented',
            evidences: framework.evidences || [],
            associated_files: framework.associated_files || [],
          };
          acc[frameworkName].controls.push(control);
          acc[frameworkName].totalControls++;
          if (control.status === 'implemented') acc[frameworkName].implemented++;
          else if (control.status === 'partially_implemented') acc[frameworkName].partiallyImplemented++;
          else acc[frameworkName].notImplemented++;
        }
      });
    }
    return acc;
  }, {});

  // Calculate compliance scores
  const complianceScores = Object.values(complianceFrameworks).map((fw: any) => {
    const total = fw.totalControls || 1;
    const score = Math.round(((fw.implemented + fw.partiallyImplemented * 0.5) / total) * 100);
    return {
      compliance_framework: fw.framework,
      score: score,
    };
  });

  // Extract OWASP Top 10 categories
  const owaspCategories = vulnerabilities.reduce((acc, vuln) => {
    if (vuln.owasp_category) {
      const category = vuln.owasp_category;
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {});

  const owaspChartData = Object.entries(owaspCategories).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  // Extract best practices
  const bestPractices = vulnerabilities
    .filter(vuln => vuln.good_practices || vuln.best_practices)
    .map(vuln => ({
      title: vuln.title || 'Best Practice',
      description: vuln.description || '',
      comment: vuln.comment || '',
      improvement: vuln.improvement || vuln.recommendation || '',
      files: vuln.file_issues?.map((f: any) => f.file_path) || [vuln.file || vuln.directory].filter(Boolean),
      good_practices: vuln.good_practices || vuln.best_practices || [],
    }));

  // Extract recommendations
  const recommendations = vulnerabilities
    .filter(vuln => vuln.recommendation || vuln.recommended_action)
    .map(vuln => ({
      recommended_action: vuln.recommended_action || vuln.recommendation || '',
      severity: vuln.severity || 'MEDIUM',
    }));

  // Extract dependencies
  const dependencies = vulnerabilities
    .filter(vuln => vuln.package_name || vuln.cve_id)
    .map(vuln => ({
      package_name: vuln.package_name || 'Unknown',
      version: vuln.version || 'Unknown',
      risk: vuln.risk || vuln.severity || 'MEDIUM',
      cve_id: vuln.cve_id || '',
      recommended_version: vuln.recommended_version || '',
    }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'];

  return (
    <div className="space-y-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Scan Report</h1>
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
            {backendVulnerabilities.length > 0 && (
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded border border-border">
                {repoName}
              </span>
            )}
          </div>
          </div>
          
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6 mt-6">
            {dashboardLoading ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading dashboard data...</span>
                </div>
              </div>
            ) : dashboardData ? (
              <>
                {/* Scan Info */}
                {dashboardData.scan_info && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Scan Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="text-lg font-bold text-foreground mt-1">{dashboardData.scan_info.status || 'N/A'}</div>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Total Files Scanned</div>
                        <div className="text-lg font-bold text-foreground mt-1">{dashboardData.scan_info.total_files_scanned || 0}</div>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Lines of Code</div>
                        <div className="text-lg font-bold text-foreground mt-1">{dashboardData.scan_info.lines_of_code?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    {dashboardData.scan_info.created_at && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(dashboardData.scan_info.created_at).toLocaleString()}</span>
                        {dashboardData.scan_info.completed_at && (
                          <span className="ml-4">Completed: {new Date(dashboardData.scan_info.completed_at).toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Overview Stats */}
                {dashboardData.overview && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Total Issues</div>
                        <div className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.total_issues || 0}</div>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Open Issues</div>
                        <div className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.open_issues || 0}</div>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Resolved Issues</div>
                        <div className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.resolved_issues || 0}</div>
                      </div>
                    </div>
                    
                    {/* Issues by Status */}
                    {dashboardData.overview.issues_by_status && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Issues by Status</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dashboardData.overview.issues_by_status).map(([status, count]: [string, any]) => (
                            <div key={status} className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border capitalize">{status}</span>
                              <span className="font-bold text-foreground">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issues by Type */}
                    {dashboardData.overview.issues_by_type && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Issues by Type</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dashboardData.overview.issues_by_type).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border capitalize">{type}</span>
                              <span className="font-bold text-foreground">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Issues by Severity */}
                {dashboardData.severity_distribution && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Total Issues by Severity</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-foreground font-semibold">Critical</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">
                          {dashboardData.severity_distribution.summary?.critical || 0}
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <span className="text-foreground font-semibold">High</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">
                          {dashboardData.severity_distribution.summary?.high || 0}
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-yellow-600" />
                          <span className="text-foreground font-semibold">Medium</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">
                          {dashboardData.severity_distribution.summary?.medium || 0}
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <span className="text-foreground font-semibold">Low</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-2">
                          {dashboardData.severity_distribution.summary?.low || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance Framework Table */}
                {dashboardData.compliance && dashboardData.compliance.chart_data && dashboardData.compliance.chart_data.length > 0 ? (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Compliance Framework Scores</h2>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Compliance Framework</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Total Findings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.compliance.chart_data.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium uppercase">{item.framework || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold ${
                                item.score >= 80 ? 'text-green-600' :
                                item.score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {item.score || 0}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {item.total_findings || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Compliance Framework Scores</h2>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Compliance Framework</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complianceScores.length > 0 ? (
                          complianceScores.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.compliance_framework}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${
                                  item.score >= 80 ? 'text-green-600' :
                                  item.score >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {item.score}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              No compliance framework data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* OWASP Top 10 Categories Chart */}
                {dashboardData.owasp_top10 && dashboardData.owasp_top10.chart_data && dashboardData.owasp_top10.chart_data.length > 0 ? (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">OWASP Top 10 Categories</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.owasp_top10.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => {
                            if (value && value.length > 25) {
                              return value.substring(0, 20) + '...';
                            }
                            return value;
                          }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">OWASP Top 10 Categories</h2>
                    {owaspChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={owaspChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => {
                              if (value && value.length > 25) {
                                return value.substring(0, 25) + '...';
                              }
                              return value;
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No OWASP category data available
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Dependencies Summary */}
                  {dashboardData.dependencies && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4">Dependencies</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-foreground">{dashboardData.dependencies.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">With CVE</span>
                          <span className="text-sm font-bold text-foreground">{dashboardData.dependencies.with_cve || 0}</span>
                        </div>
                        {dashboardData.dependencies.by_severity && (
                          <div className="mt-3 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">By Severity</div>
                            {Object.entries(dashboardData.dependencies.by_severity).map(([severity, count]: [string, any]) => (
                              <div key={severity} className="flex justify-between text-xs">
                                <span className="text-muted-foreground capitalize">{severity}</span>
                                <span className="font-medium text-foreground">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Best Practices Summary */}
                  {dashboardData.best_practices && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4">Best Practices</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-foreground">{dashboardData.best_practices.total || 0}</span>
                        </div>
                        {dashboardData.best_practices.by_scan_type && (
                          <div className="mt-3 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">By Scan Type</div>
                            {Object.entries(dashboardData.best_practices.by_scan_type).map(([type, count]: [string, any]) => (
                              <div key={type} className="flex justify-between text-xs">
                                <span className="text-muted-foreground capitalize">{type}</span>
                                <span className="font-medium text-foreground">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priority Recommendations Summary */}
                  {dashboardData.priority_recommendations && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4">Priority Recommendations</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-foreground">{dashboardData.priority_recommendations.total || 0}</span>
                        </div>
                        {dashboardData.priority_recommendations.by_severity && (
                          <div className="mt-3 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">By Severity</div>
                            {Object.entries(dashboardData.priority_recommendations.by_severity).map(([severity, count]: [string, any]) => (
                              <div key={severity} className="flex justify-between text-xs">
                                <span className="text-muted-foreground capitalize">{severity.replace('_', ' ')}</span>
                                <span className="font-medium text-foreground">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Detected Technologies */}
                {dashboardData.detected_technologies && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Detected Technologies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dashboardData.detected_technologies.primary_languages && dashboardData.detected_technologies.primary_languages.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">Primary Languages</div>
                          <div className="flex flex-wrap gap-2">
                            {dashboardData.detected_technologies.primary_languages.map((lang: string, index: number) => (
                              <span key={index} className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {dashboardData.detected_technologies.frameworks && dashboardData.detected_technologies.frameworks.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">Frameworks</div>
                          <div className="flex flex-wrap gap-2">
                            {dashboardData.detected_technologies.frameworks.map((framework: string, index: number) => (
                              <span key={index} className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                                {framework}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : !analysisRunId ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Run ID Available</h3>
                <p className="text-muted-foreground">Analysis run ID is required to fetch dashboard data.</p>
              </div>
            ) : (
              <>
                {/* Fallback to existing data if API fails */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Total Issues by Severity</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-foreground font-semibold">Critical</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{severityCounts.CRITICAL}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-foreground font-semibold">High</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{severityCounts.HIGH}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                <span className="text-foreground font-semibold">Medium</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{severityCounts.MEDIUM}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-foreground font-semibold">Low</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">{severityCounts.LOW}</div>
            </div>
          </div>
                  <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border">Open</span>
              <span className="font-bold text-foreground">{statusCounts.open}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border">Closed</span>
              <span className="font-bold text-foreground">{statusCounts.closed}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Framework Table */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Compliance Framework Scores</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compliance Framework</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceScores.length > 0 ? (
                        complianceScores.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.compliance_framework}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold ${
                                item.score >= 80 ? 'text-green-600' :
                                item.score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {item.score}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            No compliance framework data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* OWASP Top 10 Categories Chart */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">OWASP Top 10 Categories</h2>
                  {owaspChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={owaspChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No OWASP category data available
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            {complianceLoading ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading compliance findings...</span>
                </div>
              </div>
            ) : complianceFindings && complianceFindings.compliance_findings ? (
              <>
                {/* Summary Stats */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Frameworks</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{complianceFindings.total_frameworks || 0}</div>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Findings</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{complianceFindings.total_findings || 0}</div>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Analysis Run ID</div>
                      <div className="text-sm font-mono text-foreground mt-1 break-all">{complianceFindings.analysis_run_id || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Compliance Frameworks */}
                {Object.entries(complianceFindings.compliance_findings).map(([frameworkName, findings]: [string, any]) => {
                  const findingsArray = Array.isArray(findings) ? findings : [];
                  const statusCounts = findingsArray.reduce((acc: any, finding: any) => {
                    const status = (finding.status || '').toLowerCase();
                    if (status === 'implemented') acc.implemented++;
                    else if (status === 'partially_implemented' || status === 'partially implemented') acc.partial++;
                    else acc.notImplemented++;
                    return acc;
                  }, { implemented: 0, partial: 0, notImplemented: 0 });

                  return (
                    <div key={frameworkName} className="rounded-xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">{frameworkName}</h2>
                          <p className="text-sm text-muted-foreground mt-1">{findingsArray.length} control{findingsArray.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">✅</div>
                            <div className="text-xs text-muted-foreground mt-1">{statusCounts.implemented}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">⚠️</div>
                            <div className="text-xs text-muted-foreground mt-1">{statusCounts.partial}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">❌</div>
                            <div className="text-xs text-muted-foreground mt-1">{statusCounts.notImplemented}</div>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-border/50 bg-muted/30">
                              <TableHead className="w-[160px] font-semibold text-xs">Status</TableHead>
                              <TableHead className="font-semibold text-xs">Control</TableHead>
                              <TableHead className="w-[180px] font-semibold text-xs">Control Code</TableHead>
                              <TableHead className="w-[100px] text-center font-semibold text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {findingsArray.length > 0 ? (
                              findingsArray.map((finding: any, index: number) => {
                                const statusInfo = getStatusIndicator(finding.status);
                                return (
                                  <TableRow 
                                    key={finding.id || index} 
                                    className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group"
                                  >
                                    <TableCell className="py-3">
                                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                                        <span className="text-sm">{statusInfo.emoji}</span>
                                        <span className={`font-medium text-xs ${
                                          statusInfo.text === 'Implemented' ? 'text-green-600 dark:text-green-400' :
                                          statusInfo.text === 'Partially Implemented' ? 'text-yellow-600 dark:text-yellow-400' :
                                          statusInfo.text === 'Not Implemented' ? 'text-red-600 dark:text-red-400' :
                                          'text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {statusInfo.text}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="text-sm text-foreground">
                                        {finding.control_title || finding.control || 'N/A'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <code className="text-xs bg-muted/70 px-2 py-1 rounded font-mono border border-border/50">
                                        {finding.control_code || '-'}
                                      </code>
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedFinding(finding);
                                          setIsDetailModalOpen(true);
                                        }}
                                        className="gap-1.5 h-7 text-xs"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                  <div className="flex flex-col items-center gap-2">
                                    <Shield className="w-8 h-8 text-muted-foreground/50" />
                                    <span className="text-sm">No findings for this framework</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}

                {/* Detail Modal */}
                <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedFinding && (
                      <>
                        <DialogHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <DialogTitle className="text-2xl mb-2">
                                {selectedFinding.control_title || selectedFinding.control || 'Compliance Control Details'}
                              </DialogTitle>
                              <DialogDescription className="flex items-center gap-4 mt-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getStatusIndicator(selectedFinding.status).emoji}</span>
                                  <span className={`font-medium ${
                                    getStatusIndicator(selectedFinding.status).text === 'Implemented' ? 'text-green-600 dark:text-green-400' :
                                    getStatusIndicator(selectedFinding.status).text === 'Partially Implemented' ? 'text-yellow-600 dark:text-yellow-400' :
                                    getStatusIndicator(selectedFinding.status).text === 'Not Implemented' ? 'text-red-600 dark:text-red-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {getStatusIndicator(selectedFinding.status).text}
                                  </span>
                                </div>
                                {selectedFinding.control_code && (
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{selectedFinding.control_code}</code>
                                )}
                                {selectedFinding.score !== undefined && (
                                  <span className={`text-lg font-bold ${
                                    selectedFinding.score >= 80 ? 'text-green-600 dark:text-green-400' :
                                    selectedFinding.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {/* Score: {selectedFinding.score}% */}
                                  </span>
                                )}
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* Requirements */}
                          {selectedFinding.requirements && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Requirements
                              </h3>
                              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground">
                                {selectedFinding.requirements}
                              </div>
                            </div>
                          )}

                          {/* Evidences */}
                          {selectedFinding.evidences && Array.isArray(selectedFinding.evidences) && selectedFinding.evidences.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Evidences ({selectedFinding.evidences.length})
                              </h3>
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-2">
                                {selectedFinding.evidences.map((ev: string, eIndex: number) => (
                                  <div key={eIndex} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-foreground flex-1">{ev}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Files */}
                          {selectedFinding.files && Array.isArray(selectedFinding.files) && selectedFinding.files.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Associated Files ({selectedFinding.files.length})
                              </h3>
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
                                {selectedFinding.files.map((file: string, fIndex: number) => (
                                  <div key={fIndex} className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <code className="text-xs bg-background px-2 py-1 rounded font-mono flex-1 break-all">{file}</code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gaps */}
                          {selectedFinding.gaps && Array.isArray(selectedFinding.gaps) && selectedFinding.gaps.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                Gaps ({selectedFinding.gaps.length})
                              </h3>
                              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 space-y-2">
                                {selectedFinding.gaps.map((gap: string, gIndex: number) => (
                                  <div key={gIndex} className="flex items-start gap-2 text-sm">
                                    <span className="text-red-600 mt-1">✗</span>
                                    <span className="text-foreground flex-1">{gap}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            {selectedFinding.compliance_framework && (
                              <div>
                                <span className="text-xs text-muted-foreground">Framework</span>
                                <div className="text-sm font-medium text-foreground mt-1 uppercase">{selectedFinding.compliance_framework}</div>
                              </div>
                            )}
                            {selectedFinding.id && (
                              <div>
                                <span className="text-xs text-muted-foreground">ID</span>
                                <div className="text-sm font-mono text-foreground mt-1">{selectedFinding.id}</div>
                              </div>
                            )}
                            {selectedFinding.created_at && (
                              <div>
                                <span className="text-xs text-muted-foreground">Created</span>
                                <div className="text-sm text-foreground mt-1">
                                  {new Date(selectedFinding.created_at).toLocaleString()}
                                </div>
                              </div>
                            )}
                            {selectedFinding.updated_at && (
                              <div>
                                <span className="text-xs text-muted-foreground">Updated</span>
                                <div className="text-sm text-foreground mt-1">
                                  {new Date(selectedFinding.updated_at).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            ) : !analysisRunId ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Run ID Available</h3>
                <p className="text-muted-foreground">Analysis run ID is required to fetch compliance findings.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No compliance data available</h3>
                <p className="text-muted-foreground">Compliance framework information will appear here when available.</p>
              </div>
            )}
          </TabsContent>

          {/* Findings Tab */}
          <TabsContent value="findings" className="space-y-6 mt-6">
            {/* Stats Section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Findings Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Total Findings</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{vulnerabilities.length}</div>
                </div>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Open</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{statusCounts.open}</div>
                </div>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Closed</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{statusCounts.closed}</div>
                </div>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">By Severity</div>
                  <div className="text-sm text-foreground mt-1">
                    C: {severityCounts.CRITICAL} | H: {severityCounts.HIGH} | M: {severityCounts.MEDIUM} | L: {severityCounts.LOW}
                  </div>
                </div>
            </div>
          </div>

          {/* Filters */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap gap-4">
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
            <div key={vuln.issue_id || vuln.id} className="bg-card rounded-lg border border-border">
              {/* Vulnerability Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedIssue(expandedIssue === (vuln.issue_id || vuln.id) ? null : (vuln.issue_id || vuln.id))}
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
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">{vuln.title}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(vuln.severity)}`}>
                          {(vuln.severity || '').toUpperCase()}
                        </span>
                        {vuln.issue_score !== undefined && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            Score: {vuln.issue_score}
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                          {vuln.issue_id || vuln.id}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border border-border ${
                          vuln.status === 'open' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {vuln.status || 'open'}
                        </span>
                        {vuln.category && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            {vuln.category}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-2 text-sm">{vuln.description}</p>
                      
                      {/* API Endpoint Info */}
                      {(vuln.url_path || vuln.api_endpoint_path) && (
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">API Endpoint: </span>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {vuln.api_endpoint_method || 'GET'} {vuln.url_path || vuln.api_endpoint_path}
                          </span>
                        </div>
                      )}
                      
                      {/* Risk Assessment */}
                      {vuln.risk_assessment && (
                        <p className="text-sm text-foreground mb-2 font-medium">
                          Risk: {vuln.risk_assessment}
                        </p>
                      )}
                      
                      {/* Framework Tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vuln.owasp_category && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            OWASP: {vuln.owasp_category}
                          </span>
                        )}
                        {vuln.cwe_id && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            CWE: {vuln.cwe_id}
                          </span>
                        )}
                        {vuln.security_frameworks?.threat_model_category && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            STRIDE: {vuln.security_frameworks.threat_model_category}
                          </span>
                        )}
                        {vuln.security_frameworks?.sans_cwe_ranking && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            SANS: {vuln.security_frameworks.sans_cwe_ranking}
                          </span>
                        )}
                        {vuln.cve_id && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                            CVE: {vuln.cve_id}
                          </span>
                        )}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIssue === (vuln.issue_id || vuln.id) && (
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
                              <span className="font-medium text-foreground">{file.file_path || vuln.directory || vuln.file}</span>
                              {file.line_number && (
                              <span className="text-sm text-muted-foreground">Line {file.line_number}</span>
                              )}
                              {vuln.line_range && !file.line_number && (
                                <span className="text-sm text-muted-foreground">{vuln.line_range}</span>
                              )}
                            </div>
                            {(file.code_snippet || vuln.code_snippet_of_the_issue) && (
                              <div className="mb-3">
                                <div className="text-sm text-muted-foreground mb-1">Issue Code:</div>
                                <div className="bg-muted border border-border text-foreground p-3 rounded text-sm font-mono">
                                  {file.code_snippet || vuln.code_snippet_of_the_issue}
                                </div>
                              </div>
                            )}
                            {(file.solution_code || vuln.possible_code_snippet_to_fix_it) && (
                              <div className="mb-3">
                                <div className="text-sm text-muted-foreground mb-1">Suggested Fix:</div>
                                <div className="bg-muted border border-border text-foreground p-3 rounded text-sm font-mono">
                                  {file.solution_code || vuln.possible_code_snippet_to_fix_it}
                            </div>
                            </div>
                            )}
                            {file.context && (
                              <p className="text-sm text-muted-foreground mt-2">{file.context}</p>
                            )}
                          </div>
                        )) || (
                          <div className="bg-background border rounded-lg p-4">
                            {(vuln.directory || vuln.file || vuln.code_snippet_of_the_issue) ? (
                              <>
                                {(vuln.directory || vuln.file) && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{vuln.directory || vuln.file}</span>
                                    {vuln.line_range && (
                                      <span className="text-sm text-muted-foreground">{vuln.line_range}</span>
                                    )}
                                  </div>
                                )}
                                {vuln.code_snippet_of_the_issue && (
                                  <div className="mb-3">
                                    <div className="text-sm text-muted-foreground mb-1">Issue Code:</div>
                                    <div className="bg-muted border border-border text-foreground p-3 rounded text-sm font-mono">
                                      {vuln.code_snippet_of_the_issue}
                                    </div>
                                  </div>
                                )}
                                {vuln.possible_code_snippet_to_fix_it && (
                                  <div className="mb-3">
                                    <div className="text-sm text-muted-foreground mb-1">Suggested Fix:</div>
                                    <div className="bg-muted border border-border text-foreground p-3 rounded text-sm font-mono">
                                      {vuln.possible_code_snippet_to_fix_it}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                            <p className="text-sm text-muted-foreground">No file issues available</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Risks Associated */}
                      {(() => {
                        const riskValues = Array.isArray(vuln.risks_associated_with_the_issue)
                          ? vuln.risks_associated_with_the_issue
                          : typeof vuln.risks_associated_with_the_issue === 'string'
                            ? vuln.risks_associated_with_the_issue
                                .split(/[,\\n]/)
                                .map(risk => risk.trim())
                                .filter(Boolean)
                            : [];
                        if (riskValues.length === 0) return null;
                        return (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-foreground mb-2">Risks Associated:</h5>
                            <div className="flex flex-wrap gap-2">
                              {riskValues.map((risk: string, index: number) => (
                                <span key={index} className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                                  {risk}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Security Framework Details & Remediation */}
                    <div className="space-y-6">
                      {/* Security Frameworks */}
                      {vuln.security_frameworks && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Security Framework Analysis
                          </h4>
                          <div className="bg-background border rounded-lg p-4 space-y-3">
                            {vuln.security_frameworks.primary && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Primary Framework:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.security_frameworks.primary}</span>
                              </div>
                            )}
                            {vuln.security_frameworks.supplementary && vuln.security_frameworks.supplementary.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Supplementary Frameworks:</span>
                                <div className="ml-2 mt-1 flex flex-wrap gap-1">
                                  {vuln.security_frameworks.supplementary.map((framework: string, index: number) => (
                                    <span key={index} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded border border-border">
                                      {framework}
                                    </span>
                                  ))}
                                </div>
                            </div>
                            )}
                            {vuln.owasp_category && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">OWASP Category:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.owasp_category}</span>
                            </div>
                            )}
                            {vuln.cwe_id && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">CWE Classification:</span>
                              <span className="ml-2 text-sm text-foreground">
                                  {vuln.cwe_url ? (
                                    <a href={vuln.cwe_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                      {vuln.cwe_id} <ExternalLink className="w-3 h-3 inline" />
                                    </a>
                                  ) : (
                                    vuln.cwe_id
                                  )}
                              </span>
                            </div>
                            )}
                            {vuln.security_frameworks.threat_model_category && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">STRIDE Category:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.security_frameworks.threat_model_category}</span>
                            </div>
                            )}
                            {vuln.security_frameworks.sans_cwe_ranking && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">SANS Ranking:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.security_frameworks.sans_cwe_ranking}</span>
                            </div>
                            )}
                            {vuln.security_frameworks.nist_ssdf && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">NIST SSDF References:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.security_frameworks.nist_ssdf}</span>
                              </div>
                            )}
                            {vuln.sans && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">SANS:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.sans}</span>
                              </div>
                            )}
                            {vuln.sans_id && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">SANS ID:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.sans_id}</span>
                              </div>
                            )}
                            {vuln.stride && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">STRIDE:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.stride}</span>
                              </div>
                            )}
                            {vuln.nist && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">NIST:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.nist}</span>
                              </div>
                            )}
                            {vuln.cve_id && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">CVE ID:</span>
                                <span className="ml-2 text-sm text-foreground">{vuln.cve_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Affected Security Frameworks */}
                      {vuln.affected_security_frameworks && vuln.affected_security_frameworks.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Affected Security Frameworks
                          </h4>
                          <div className="bg-background border rounded-lg p-4 space-y-2">
                            {vuln.affected_security_frameworks.map((framework: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                                  {framework.framework}
                                </span>
                                {framework.category && (
                                  <span className="text-sm text-muted-foreground">{framework.category}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affected Compliance Frameworks */}
                      {vuln.affected_compliance_frameworks && vuln.affected_compliance_frameworks.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Affected Compliance Frameworks
                          </h4>
                          <div className="bg-background border rounded-lg p-4 space-y-3">
                            {vuln.affected_compliance_frameworks.map((framework: any, index: number) => (
                              <div key={index} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded border border-border">
                                    {framework.framework}
                                  </span>
                                </div>
                                {framework.affected_control && (
                                  <div className="text-sm text-foreground mt-1">
                                    <span className="font-medium">Control: </span>
                                    {framework.control_link ? (
                                      <a 
                                        href={framework.control_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {framework.affected_control} <ExternalLink className="w-3 h-3 inline" />
                                      </a>
                                    ) : (
                                      <span>{framework.affected_control}</span>
                                    )}
                                  </div>
                                )}
                            </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Remediation */}
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Remediation</h4>
                        <div className="bg-muted border border-border rounded-lg p-4">
                          <p className="text-sm text-foreground">
                            {vuln.remediation || vuln.recommendation || 'No remediation guidance available.'}
                          </p>
                        </div>
                      </div>

                      {/* Resolution Info */}
                      {(vuln.resolution_comment || vuln.resolution_reason) && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3">Resolution Details</h4>
                          <div className="bg-background border rounded-lg p-4 space-y-2">
                            {vuln.resolution_reason && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Reason: </span>
                                <span className="text-sm text-foreground">{vuln.resolution_reason}</span>
                              </div>
                            )}
                            {vuln.resolution_comment && (
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Comment: </span>
                                <span className="text-sm text-foreground">{vuln.resolution_comment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assignment Info */}
                      {vuln.assignedTo && (
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-3">Assignment</h4>
                          <div className="bg-background border rounded-lg p-4">
                            <span className="text-sm text-foreground">Assigned to: {vuln.assignedTo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredVulnerabilities.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No vulnerabilities found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
          </div>
        )}
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value="best-practices" className="space-y-6 mt-6">
            {bestPracticesLoading ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading best practices...</span>
                </div>
              </div>
            ) : bestPracticesData && bestPracticesData.best_practices && bestPracticesData.best_practices.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Best Practices</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{bestPracticesData.total || bestPracticesData.best_practices.length}</div>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Analysis Run ID</div>
                      <div className="text-sm font-mono text-foreground mt-1 break-all">{bestPracticesData.analysis_run_id || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Best Practices List */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Best Practices</h2>
                      <p className="text-sm text-muted-foreground mt-1">{bestPracticesData.best_practices.length} practice{bestPracticesData.best_practices.length !== 1 ? 's' : ''} implemented</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/30">
                          <TableHead className="font-semibold text-xs">Title</TableHead>
                          <TableHead className="font-semibold text-xs">Description</TableHead>
                          <TableHead className="w-[120px] font-semibold text-xs">Files</TableHead>
                          <TableHead className="w-[100px] text-center font-semibold text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bestPracticesData.best_practices.map((practice: any, index: number) => (
                          <TableRow 
                            key={practice.id || index} 
                            className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <div className="text-sm font-medium text-foreground">
                                  {practice.title || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {practice.description || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-xs text-muted-foreground">
                                {practice.files && Array.isArray(practice.files) ? `${practice.files.length} file${practice.files.length !== 1 ? 's' : ''}` : '0 files'}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBestPractice(practice);
                                  setIsBestPracticeModalOpen(true);
                                }}
                                className="gap-1.5 h-7 text-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Best Practice Detail Modal */}
                <Dialog open={isBestPracticeModalOpen} onOpenChange={setIsBestPracticeModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedBestPractice && (
                      <>
                        <DialogHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <DialogTitle className="text-2xl mb-2 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                {selectedBestPractice.title || 'Best Practice Details'}
                              </DialogTitle>
                              {selectedBestPractice.scan_type && (
                                <DialogDescription className="mt-2">
                                  <span className="text-xs bg-muted px-2 py-1 rounded font-medium uppercase">
                                    {selectedBestPractice.scan_type}
                                  </span>
                                </DialogDescription>
                              )}
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* Description */}
                          {selectedBestPractice.description && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Description
                              </h3>
                              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground">
                                {selectedBestPractice.description}
                              </div>
                            </div>
                          )}

                          {/* Comment */}
                          {selectedBestPractice.comment && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Comment
                              </h3>
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm text-foreground">
                                {selectedBestPractice.comment}
                              </div>
                            </div>
                          )}

                          {/* Improvement */}
                          {selectedBestPractice.improvement && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Improvement
                              </h3>
                              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 text-sm text-foreground">
                                {selectedBestPractice.improvement}
                              </div>
                            </div>
                          )}

                          {/* Good Practices */}
                          {selectedBestPractice.good_practices && Array.isArray(selectedBestPractice.good_practices) && selectedBestPractice.good_practices.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Good Practices ({selectedBestPractice.good_practices.length})
                              </h3>
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-2">
                                {selectedBestPractice.good_practices.map((gp: string, gpIndex: number) => (
                                  <div key={gpIndex} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span className="text-foreground flex-1">{gp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Files */}
                          {selectedBestPractice.files && Array.isArray(selectedBestPractice.files) && selectedBestPractice.files.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Associated Files ({selectedBestPractice.files.length})
                              </h3>
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
                                {selectedBestPractice.files.map((file: string, fIndex: number) => (
                                  <div key={fIndex} className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <code className="text-xs bg-background px-2 py-1 rounded font-mono flex-1 break-all">{file}</code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Examples */}
                          {selectedBestPractice.examples && Array.isArray(selectedBestPractice.examples) && selectedBestPractice.examples.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Examples ({selectedBestPractice.examples.length})
                              </h3>
                              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                {selectedBestPractice.examples.map((example: string, eIndex: number) => (
                                  <div key={eIndex} className="text-sm">
                                    <code className="text-xs bg-background px-3 py-2 rounded font-mono block border border-border/50">
                                      {example}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            {selectedBestPractice.id && (
                              <div>
                                <span className="text-xs text-muted-foreground">ID</span>
                                <div className="text-sm font-mono text-foreground mt-1">{selectedBestPractice.id}</div>
                              </div>
                            )}
                            {selectedBestPractice.scan_type && (
                              <div>
                                <span className="text-xs text-muted-foreground">Scan Type</span>
                                <div className="text-sm text-foreground mt-1 uppercase">{selectedBestPractice.scan_type}</div>
                              </div>
                            )}
                            {selectedBestPractice.created_at && (
                              <div>
                                <span className="text-xs text-muted-foreground">Created</span>
                                <div className="text-sm text-foreground mt-1">
                                  {new Date(selectedBestPractice.created_at).toLocaleString()}
                                </div>
                              </div>
                            )}
                            {selectedBestPractice.updated_at && (
                              <div>
                                <span className="text-xs text-muted-foreground">Updated</span>
                                <div className="text-sm text-foreground mt-1">
                                  {new Date(selectedBestPractice.updated_at).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            ) : !analysisRunId ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Run ID Available</h3>
                <p className="text-muted-foreground">Analysis run ID is required to fetch best practices.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No best practices found</h3>
                <p className="text-muted-foreground">Best practices information will appear here when available.</p>
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6 mt-6">
            {recommendationsLoading ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading recommendations...</span>
                </div>
              </div>
            ) : recommendationsData && recommendationsData.priority_recommendations && recommendationsData.priority_recommendations.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Recommendations</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{recommendationsData.total || recommendationsData.priority_recommendations.length}</div>
                    </div>
                    {recommendationsData.breakdown && (
                      <>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Immediate</div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{recommendationsData.breakdown.immediate || 0}</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">High Priority</div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{recommendationsData.breakdown.high_priority || 0}</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Medium Priority</div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{recommendationsData.breakdown.medium_priority || 0}</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Low Priority</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{recommendationsData.breakdown.low_priority || 0}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Priority Recommendations</h2>
                      <p className="text-sm text-muted-foreground mt-1">{recommendationsData.priority_recommendations.length} recommendation{recommendationsData.priority_recommendations.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/30">
                          <TableHead className="w-[60px] font-semibold text-xs text-center">#</TableHead>
                          <TableHead className="font-semibold text-xs">Action</TableHead>
                          <TableHead className="font-semibold text-xs">Description</TableHead>
                          <TableHead className="w-[160px] font-semibold text-xs">Severity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recommendationsData.priority_recommendations.map((rec: any, index: number) => {
                          const severity = (rec.severity || '').toLowerCase();
                          const severityColor = 
                            severity === 'immediate' ? 'text-red-600 dark:text-red-400' :
                            severity.includes('high') ? 'text-orange-600 dark:text-orange-400' :
                            severity.includes('medium') ? 'text-yellow-600 dark:text-yellow-400' :
                            severity.includes('low') ? 'text-blue-600 dark:text-blue-400' :
                            'text-gray-600 dark:text-gray-400';
                          
                          return (
                            <TableRow 
                              key={rec.index || index} 
                              className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group"
                            >
                              <TableCell className="py-3 text-center">
                                <div className="text-sm font-bold text-muted-foreground">
                                  {rec.priority_order || rec.index || index + 1}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="text-sm font-medium text-foreground">
                                  {rec.action || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="text-sm text-muted-foreground">
                                  {rec.description || '-'}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className={`text-xs font-medium ${severityColor} capitalize`}>
                                  {rec.severity || '-'}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : !analysisRunId ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Run ID Available</h3>
                <p className="text-muted-foreground">Analysis run ID is required to fetch recommendations.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No recommendations found</h3>
                <p className="text-muted-foreground">Recommendations will appear here when available.</p>
              </div>
            )}
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="space-y-6 mt-6">
            {dependencyIssuesLoading ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading dependency issues...</span>
                </div>
              </div>
            ) : dependencyIssuesData && dependencyIssuesData.dependency_issues && dependencyIssuesData.dependency_issues.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Issues</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{dependencyIssuesData.total || dependencyIssuesData.dependency_issues.length}</div>
                    </div>
                    {dependencyIssuesData.summary && dependencyIssuesData.summary.by_severity && (
                      <>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Critical</div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{dependencyIssuesData.summary.by_severity.critical || 0}</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">High</div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{dependencyIssuesData.summary.by_severity.high || 0}</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Medium</div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{dependencyIssuesData.summary.by_severity.medium || 0}</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground">Low</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{dependencyIssuesData.summary.by_severity.low || 0}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {dependencyIssuesData.summary && (
                    <div className="mt-4 flex gap-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border">With CVE</span>
                        <span className="font-bold text-foreground">{dependencyIssuesData.summary.with_cve || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold border border-border">Without CVE</span>
                        <span className="font-bold text-foreground">{dependencyIssuesData.summary.without_cve || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dependencies List */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Dependency Issues</h2>
                      <p className="text-sm text-muted-foreground mt-1">{dependencyIssuesData.dependency_issues.length} issue{dependencyIssuesData.dependency_issues.length !== 1 ? 's' : ''} found</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/30">
                          <TableHead className="font-semibold text-xs">Package Name</TableHead>
                          <TableHead className="font-semibold text-xs">Current Version</TableHead>
                          <TableHead className="font-semibold text-xs">Recommended Version</TableHead>
                          <TableHead className="font-semibold text-xs">Severity</TableHead>
                          <TableHead className="w-[100px] text-center font-semibold text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dependencyIssuesData.dependency_issues.map((dep: any, index: number) => {
                          const severity = (dep.severity || '').toLowerCase();
                          const severityColor = 
                            severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                            severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                            severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                            severity === 'low' ? 'text-blue-600 dark:text-blue-400' :
                            'text-gray-600 dark:text-gray-400';
                          
                          return (
                            <TableRow 
                              key={dep.id || index} 
                              className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group"
                            >
                              <TableCell className="py-3">
                                <div className="font-medium font-mono text-sm text-foreground">
                                  {dep.package_name || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <code className="text-xs bg-muted/70 px-2 py-1 rounded font-mono border border-border/50">
                                  {dep.dependency_version || '-'}
                                </code>
                              </TableCell>
                              <TableCell className="py-3">
                                {dep.recommended_version ? (
                                  <code className="text-xs bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded font-mono border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                                    {dep.recommended_version}
                                  </code>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className={`text-xs font-medium ${severityColor} capitalize`}>
                                  {dep.severity || '-'}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDependency(dep);
                                    setIsDependencyModalOpen(true);
                                  }}
                                  className="gap-1.5 h-7 text-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                {/* Dependency Detail Modal */}
                <Dialog open={isDependencyModalOpen} onOpenChange={setIsDependencyModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedDependency && (
                      <>
                        <DialogHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <DialogTitle className="text-2xl mb-2 flex items-center gap-2">
                                <Package className="w-6 h-6" />
                                {selectedDependency.package_name || 'Dependency Details'}
                              </DialogTitle>
                              <DialogDescription className="flex items-center gap-4 mt-2 flex-wrap">
                                {selectedDependency.dependency_version && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Current Version:</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                      {selectedDependency.dependency_version}
                                    </code>
                                  </div>
                                )}
                                {selectedDependency.recommended_version && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Recommended:</span>
                                    <code className="text-xs bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded font-mono border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                                      {selectedDependency.recommended_version}
                                    </code>
                                  </div>
                                )}
                                {selectedDependency.severity && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Severity:</span>
                                    <span className={`text-sm font-medium capitalize ${
                                      selectedDependency.severity.toLowerCase() === 'critical' ? 'text-red-600 dark:text-red-400' :
                                      selectedDependency.severity.toLowerCase() === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                      selectedDependency.severity.toLowerCase() === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                      selectedDependency.severity.toLowerCase() === 'low' ? 'text-blue-600 dark:text-blue-400' :
                                      'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {selectedDependency.severity}
                                    </span>
                                  </div>
                                )}
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* CVE ID */}
                          {selectedDependency.cve_id && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                CVE ID
                              </h3>
                              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  {selectedDependency.cve_url ? (
                                    <a
                                      href={selectedDependency.cve_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-red-700 dark:text-red-400 hover:underline flex items-center gap-2"
                                    >
                                      {selectedDependency.cve_id}
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  ) : (
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                      {selectedDependency.cve_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Associated Risks */}
                          {selectedDependency.associated_risks && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                Associated Risks
                              </h3>
                              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
                                <p className="text-sm text-foreground">
                                  {selectedDependency.associated_risks}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            {selectedDependency.id && (
                              <div>
                                <span className="text-xs text-muted-foreground">ID</span>
                                <div className="text-sm font-mono text-foreground mt-1">{selectedDependency.id}</div>
                              </div>
                            )}
                            {selectedDependency.package_name && (
                              <div>
                                <span className="text-xs text-muted-foreground">Package Name</span>
                                <div className="text-sm font-mono text-foreground mt-1">{selectedDependency.package_name}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
                </div>
              </>
            ) : !analysisRunId ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Run ID Available</h3>
                <p className="text-muted-foreground">Analysis run ID is required to fetch dependency issues.</p>
              </div>
            ) : (
              <>
                {/* Fallback to existing data if API fails */}
                {dependencies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>CVE ID</TableHead>
                        <TableHead>Recommended Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dependencies.map((dep, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium font-mono">{dep.package_name}</TableCell>
                          <TableCell className="font-mono">{dep.version}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(dep.risk)}`}>
                              {(dep.risk || '').toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {dep.cve_id ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded border border-red-200">
                                {dep.cve_id}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">
                            {dep.recommended_version || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No dependency issues found</h3>
                    <p className="text-muted-foreground">Dependency information will appear here when available.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecurityDashboard;
