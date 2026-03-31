import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OwaspTop3MappingItem {
  code: string;
  title: string;
  description?: string;
  count?: number;
}

interface SecurityReportData {
  repository: string;
  branch: string;
  scanId: string;
  generatedAt: string;
  totalFilesScanned: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  owaspFindings: {
    A01: number;
    A02: number;
    A03: number;
    A04: number;
    A05: number;
    A06: number;
    A07: number;
    A08: number;
    A09: number;
    A10: number;
  };
  severityTrend: {
    criticalHigh: number[];
    mediumLow: number[];
  };
  dependencies: {
    total: number;
    withCVEs: number;
    outdated: number;
    critical: number;
    high: number;
    medium: number;
    sample_dependencies: { package_name: string; associated_risks: string; recommended_version: string }[];
  };
  compliance: {
    owaspAsvs: number;
    soc2: number;
    iso27001: number;
    pciDss: number;
    gdpr: number;
    custom: number;
  };
  // Additional metadata used in the narrative sections
  frameworks?: string;
  languages?: string;
  estimated_lines_of_code?: string | number;
  estimated_files_scanned?: string | number;
  exclusions?: string;
  custom_compliance_mapping?: string;
  owasp_top3_mapping: OwaspTop3MappingItem[];
  security_risks?: { title: string; count: number }[];
  performance_risks?: { title: string; count?: number }[];
  good_practices?: { title: string, comment: string }[];
  commit_trend_description?: string;
  issues_by_category?: { 
    title: string; 
    count: number; 
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    file?: string;
    line?: number;
    category?: string;
    description?: string;
    code?: string;
    recommendation?: string;
  }[];
  top_5_risks?: { title: string, description: string }[];
  immediate_remediation_timeline?: { title: string, description: string, severity: string }[];
  sample_detailed_findings?: { title: string, description: string, severity: string, recommendation: string, code: string, file: string, line: number }[];
}

interface SecurityReportViewProps {
  reportData: SecurityReportData;
  onClose?: () => void;
  loading?: boolean;
}

const SecurityReportView = ({ reportData, onClose, loading = false }: SecurityReportViewProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Show loading state if data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] p-6 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security report...</p>
        </div>
      </div>
    );
  }

  // Helper function to validate and ensure number
  const ensureNumber = (value: any, fallback: number = 0): number => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) || num < 0 ? fallback : num;
  };

  // Calculate security posture status based on weighted severity model
  const calculateSecurityPosture = (
    critical: number,
    high: number,
    medium: number,
    low: number
  ): { status: string; color: string } => {
    // Calculate weighted risk score
    // Critical: weight 5, High: weight 4, Medium: weight 3, Low: weight 1
    const riskScore = (critical * 5) + (high * 4) + (medium * 3) + (low * 1);

    // Classify based on score ranges
    if (riskScore >= 351) {
      return { status: 'Critical / Severe', color: '#b91c1c' }; // red
    } else if (riskScore >= 251) {
      return { status: 'Elevated', color: '#d97706' }; // orange
    } else if (riskScore >= 151) {
      return { status: 'Moderate', color: '#eab308' }; // yellow
    } else if (riskScore >= 51) {
      return { status: 'Low', color: '#22c55e' }; // green
    } else {
      return { status: 'Healthy / Secure', color: '#15803d' }; // dark green
    }
  };

  // Validate and extract OWASP findings with fallbacks
  const owaspValues = {
    A01: ensureNumber(reportData?.owaspFindings?.A01, 11),
    A02: ensureNumber(reportData?.owaspFindings?.A02, 4),
    A03: ensureNumber(reportData?.owaspFindings?.A03, 7),
    A04: ensureNumber(reportData?.owaspFindings?.A04, 3),
    A05: ensureNumber(reportData?.owaspFindings?.A05, 9),
    A06: ensureNumber(reportData?.owaspFindings?.A06, 5),
    A07: ensureNumber(reportData?.owaspFindings?.A07, 6),
    A08: ensureNumber(reportData?.owaspFindings?.A08, 4),
    A09: ensureNumber(reportData?.owaspFindings?.A09, 3),
    A10: ensureNumber(reportData?.owaspFindings?.A10, 2),
  };

  // Validate severity values with fallbacks
  const severityValues = {
    critical: ensureNumber(reportData?.criticalFindings, 3),
    high: ensureNumber(reportData?.highFindings, 7),
    medium: ensureNumber(reportData?.mediumFindings, 21),
    low: ensureNumber(reportData?.lowFindings, 45),
  };

  // Calculate security posture status
  const securityPosture = calculateSecurityPosture(
    severityValues.critical,
    severityValues.high,
    severityValues.medium,
    severityValues.low
  );

  // Calculate OWASP Top 10 Risks status based on total count
  const calculateOWASPStatus = (owaspFindings: typeof owaspValues): { status: string; color: string } => {
    // Sum all OWASP findings
    const totalCount = Object.values(owaspFindings).reduce((sum, count) => sum + count, 0);

    // Classify based on count ranges
    if (totalCount === 0) {
      return { status: 'None', color: '#15803d' }; // dark green
    } else if (totalCount >= 1 && totalCount <= 5) {
      return { status: 'Low', color: '#22c55e' }; // green
    } else if (totalCount >= 6 && totalCount <= 15) {
      return { status: 'Moderate', color: '#eab308' }; // yellow
    } else if (totalCount >= 16 && totalCount <= 30) {
      return { status: 'Elevated', color: '#d97706' }; // orange
    } else {
      return { status: 'Critical', color: '#b91c1c' }; // red
    }
  };

  // Calculate OWASP Top 10 Risks status
  const owaspStatus = calculateOWASPStatus(owaspValues);

  // Calculate compliance status based on average compliance score
  const calculateComplianceStatus = (compliance: SecurityReportData['compliance']): { status: string; color: string } => {
    // Get all compliance scores
    const scores = [
      compliance.owaspAsvs,
      compliance.soc2,
      compliance.iso27001,
      compliance.gdpr,
    ]
    // Calculate average
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Classify based on average score ranges
    if (averageScore >= 90) {
      return { status: 'Strong', color: '#15803d' }; // dark green
    } else if (averageScore >= 70) {
      return { status: 'Good', color: '#22c55e' }; // green
    } else if (averageScore >= 50) {
      return { status: 'Medium', color: '#d97706' }; // orange
    } else if (averageScore >= 30) {
      return { status: 'Needs Improvement', color: '#eab308' }; // yellow
    } else {
      return { status: 'Poor', color: '#b91c1c' }; // red
    }
  };

  // Calculate compliance status
  const complianceStatus = calculateComplianceStatus(reportData.compliance);

  // Calculate individual framework status based on score
  const calculateFrameworkStatus = (score: number): 'ok' | 'warn' | 'error' => {
    if (score >= 80) {
      return 'ok';
    } else if (score >= 50) {
      return 'warn';
    } else {
      return 'error';
    }
  };

  // Safely handle OWASP Top 3 mapping data
  const owaspTop3 = Array.isArray(reportData?.owasp_top3_mapping)
    ? reportData.owasp_top3_mapping
    : [];

  // Debug logging
//   console.log('SecurityReportView - reportData:', reportData);
//   console.log('SecurityReportView - owaspValues:', owaspValues);
//   console.log('SecurityReportView - severityValues:', severityValues);

  // Chart data
  const owaspChartData = {
    labels: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'],
    datasets: [
      {
        label: 'Findings',
        data: [
          owaspValues.A01,
          owaspValues.A02,
          owaspValues.A03,
          owaspValues.A04,
          owaspValues.A05,
          owaspValues.A06,
          owaspValues.A07,
          owaspValues.A08,
          owaspValues.A09,
          owaspValues.A10,
        ],
        backgroundColor: '#93c5fd',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 22,
      },
    ],
  };

  const severityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low / Info'],
    datasets: [
      {
        data: [
          severityValues.critical,
          severityValues.high,
          severityValues.medium,
          severityValues.low,
        ],
        backgroundColor: ['#b91c1c', '#ea580c', '#eab308', '#22c55e'],
        borderWidth: 0,
      },
    ],
  };

  // Validate trend data
  const criticalHighTrend = Array.isArray(reportData?.severityTrend?.criticalHigh) 
    ? reportData.severityTrend.criticalHigh.map(v => ensureNumber(v, 10))
    : [16, 15, 13, 12, severityValues.critical + severityValues.high];
  
  const mediumLowTrend = Array.isArray(reportData?.severityTrend?.mediumLow)
    ? reportData.severityTrend.mediumLow.map(v => ensureNumber(v, 60))
    : [80, 72, 69, 62, severityValues.medium + severityValues.low];

  const trendChartData = {
    labels: ['Scan -4', 'Scan -3', 'Scan -2', 'Scan -1', 'Current'],
    datasets: [
      {
        label: 'Critical + High',
        data: criticalHighTrend,
        borderColor: '#b91c1c',
        backgroundColor: 'rgba(239,68,68,0.10)',
        fill: true,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 4,
      },
      {
        label: 'Medium + Low',
        data: mediumLowTrend,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#6b7280',
          font: { size: 10 },
          boxWidth: 10,
          padding: 8,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 } },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#6b7280', font: { size: 10 }, precision: 0 },
      },
    },
  };

  const owaspChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 } },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#6b7280', font: { size: 10 }, precision: 0 },
      },
    },
  };

  const severityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: '#6b7280',
          font: { size: 10 },
          boxWidth: 10,
          padding: 8,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      // Create a loading indicator
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;z-index:10000;';
      loadingToast.textContent = 'Generating PDF...';
      document.body.appendChild(loadingToast);

      // Wait a bit for charts to render fully
      await new Promise(resolve => setTimeout(resolve, 1000));

      // PDF dimensions - Landscape A4
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const margin = 10; // 10mm margin on each side
      const maxContentWidth = pdfWidth - (margin * 2); // Maximum content width with margins (277mm)
      const maxContentHeight = pdfHeight - (margin * 2); // Maximum content height per page
      const pixelsPerMm = 3.7795; // Conversion factor (96 DPI scaled)

      // Create PDF in landscape orientation
      const pdf = new jsPDF('l', 'mm', 'a4');
      let currentY = margin; // Track current Y position on the page

      // Find all major sections (sections with border-b class or section elements)
      const reportContainer = reportRef.current;
      const header = reportContainer?.querySelector('header');
      const mainContent = reportContainer?.querySelector('main');
      const footer = reportContainer?.querySelector('footer');
      
      // Get all sections from main content
      const sections = mainContent?.querySelectorAll('section') || [];
      
      // Function to get element dimensions without rendering
      const getElementDimensions = async (element: HTMLElement) => {
        const elementCanvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: element.scrollWidth,
          height: element.scrollHeight,
        });

        const elementWidthMm = elementCanvas.width / pixelsPerMm;
        const scaleFactor = Math.min(1, maxContentWidth / elementWidthMm);
        const actualImgWidth = elementWidthMm * scaleFactor;
        const actualImgHeight = (elementCanvas.height / pixelsPerMm) * scaleFactor;

        return { elementCanvas, actualImgWidth, actualImgHeight };
      };

      // Function to render an element to PDF at a specific Y position
      const renderElementAtPosition = (
        elementCanvas: HTMLCanvasElement,
        actualImgWidth: number,
        actualImgHeight: number,
        yPosition: number
      ) => {
        const xPosition = margin + (maxContentWidth - actualImgWidth) / 2;
        pdf.addImage(
          elementCanvas.toDataURL('image/png'),
          'PNG',
          xPosition,
          yPosition,
          actualImgWidth,
          actualImgHeight
        );
      };

      // Function to render an element, checking if it fits on current page
      const renderElementToPDF = async (element: HTMLElement, isFirstElement: boolean = false) => {
        if (!element) return false;

        // Get element dimensions
        const { elementCanvas, actualImgWidth, actualImgHeight } = await getElementDimensions(element);

        // Calculate available space on current page
        const availableHeight = pdfHeight - currentY - margin;
        const needsNewPage = actualImgHeight > availableHeight;

        // If element doesn't fit on current page and it's not the first element, start new page
        if (needsNewPage && !isFirstElement) {
          pdf.addPage();
          currentY = margin;
        }

        // Check if element fits on one page (even after starting new page if needed)
        if (actualImgHeight <= maxContentHeight) {
          // Element fits on one page - render it
          renderElementAtPosition(elementCanvas, actualImgWidth, actualImgHeight, currentY);
          currentY += actualImgHeight;
          return true;
        } else {
          // Element is too tall for one page - must split it
          const canvasWidth = elementCanvas.width;
          const canvasHeight = elementCanvas.height;
          const totalPages = Math.ceil(actualImgHeight / maxContentHeight);
          const heightPerPageInPixels = canvasHeight / totalPages;
          const heightPerPageInMm = actualImgHeight / totalPages;

          for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            if (pageNum > 0) {
              pdf.addPage();
              currentY = margin;
            }

            const sourceY = Math.floor(pageNum * heightPerPageInPixels);
            const remainingHeight = canvasHeight - sourceY;
            const sliceSourceHeight = Math.min(Math.ceil(heightPerPageInPixels), remainingHeight);

            if (sliceSourceHeight <= 0 || sourceY >= canvasHeight) {
              break;
            }

            // Create temporary canvas for this slice
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvasWidth;
            pageCanvas.height = sliceSourceHeight;
            const pageCtx = pageCanvas.getContext('2d');

            if (!pageCtx) continue;

            // Fill with white background
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            // Draw the slice
            pageCtx.drawImage(
              elementCanvas,
              0, sourceY, canvasWidth, sliceSourceHeight,
              0, 0, canvasWidth, sliceSourceHeight
            );

            const slicePdfHeight = (sliceSourceHeight / canvasHeight) * actualImgHeight;
            const xPosition = margin + (maxContentWidth - actualImgWidth) / 2;
            const yPosition = pageNum === 0 ? currentY : margin;

            pdf.addImage(
              pageCanvas.toDataURL('image/png'),
              'PNG',
              xPosition,
              yPosition,
              actualImgWidth,
              slicePdfHeight
            );

            if (pageNum === 0) {
              currentY += slicePdfHeight;
            } else {
              currentY = margin + slicePdfHeight;
            }
          }
          return true;
        }
      };

      // Render header
      if (header) {
        await renderElementToPDF(header as HTMLElement, true);
      }

      // Render each section, fitting multiple on a page when possible
      for (let i = 0; i < sections.length; i++) {
        await renderElementToPDF(sections[i] as HTMLElement, i === 0 && !header);
      }

      // Render footer on last page (footer is small, so it should fit)
      if (footer) {
        await renderElementToPDF(footer as HTMLElement, false);
      }

      // Save PDF
      pdf.save(`SmartComply Heimdall-Security-Report-${reportData.scanId}.pdf`);

      // Remove loading indicator
      document.body.removeChild(loadingToast);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  console.log('SecurityReportView - reportData:', reportData);

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-6 w-full">
      {/* Export Button */}
      <div className="w-full max-w-[1400px] mx-auto mb-4 flex justify-end">
        <Button
          onClick={exportToPDF}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to PDF
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            className="ml-2"
          >
            Close Report
          </Button>
        )}
      </div>

      {/* Report Container */}
      <div
        ref={reportRef}
        className="w-full max-w-[1400px] mx-auto bg-white rounded-2xl border border-[#e5e7eb] shadow-xl overflow-hidden"
        style={{
          boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Header */}
        <header className="p-8 pb-5 border-b border-[#e5e7eb] flex justify-between items-center gap-6">
          <div className="flex gap-3 items-center">
            <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-[#2563eb] to-[#22c55e] flex items-center justify-center text-white font-bold text-lg">
              AS
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-[#eff6ff] text-[#1d4ed8] mb-1">
                SmartComply Heimdall · Code Review AI
              </div>
              <h1 className="text-lg font-semibold mb-1">Source Code Security Report</h1>
              <p className="text-xs text-[#6b7280]">
                Repository-level analysis mapped to OWASP Top 10 and compliance frameworks.
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-[#6b7280]">
            <div>Repository: <strong>{reportData.repository}</strong></div>
            <div>Branch: <strong>{reportData.branch}</strong></div>
            <div>Scan ID: <strong>{reportData.scanId}</strong></div>
            <div>Generated: <strong>{new Date(reportData.generatedAt).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</strong></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 pt-5 flex flex-col gap-6">
          {/* 1. Executive Summary */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">1. Executive Summary</h2>
              <span className="text-[11px] text-[#6b7280]">High-level risk & remediation priorities</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              SmartComply Heimdall Code Review AI analyzed the <strong>{reportData.repository}</strong> repository for security weaknesses, bad patterns,
              and compliance gaps. This report is intended for engineering leadership, security teams, and compliance stakeholders.
            </p>

            <div className="grid grid-cols-[1.3fr_1fr] gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Key Risk Indicators</div>
                    <div className="text-[11px] text-[#6b7280]">Summary of overall repository risk posture.</div>
                  </div>
                </div>
                <table className="w-full border-collapse text-[11px] mt-1.5">
                  <thead>
                    <tr>
                      <th className="border border-[#e5e7eb] p-1.5 text-left bg-[#f9fafb] font-medium text-[#6b7280]">Dimension</th>
                      <th className="border border-[#e5e7eb] p-1.5 text-left bg-[#f9fafb] font-medium text-[#6b7280]">Status</th>
                      <th className="border border-[#e5e7eb] p-1.5 text-left bg-[#f9fafb] font-medium text-[#6b7280]">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[#e5e7eb] p-1.5">Security Posture</td>
                      <td className="border border-[#e5e7eb] p-1.5 text-[#d97706] font-semibold">Elevated</td>
                      <td className="border border-[#e5e7eb] p-1.5">
                        {severityValues.critical} critical and {severityValues.high} high-severity issues focusing on {reportData?.issues_by_category?.map((item) => item.category).join(', ')}
                    </td>
                    </tr>
                      <tr>
                        <td className="border border-[#e5e7eb] p-1.5">OWASP Top 10 Risks</td>
                        <td className="border border-[#e5e7eb] p-1.5 font-semibold" style={{ color: owaspStatus.color }}>
                          {owaspStatus.status}
                        </td>
                        <td className="border border-[#e5e7eb] p-1.5">
                          Gaps observed in {reportData?.owasp_top3_mapping?.map((item) => item.title).join(', ')} and others.
                        </td>
                      </tr>
                    <tr>
                      <td className="border border-[#e5e7eb] p-1.5">Best Practices</td>
                      <td className="border border-[#e5e7eb] p-1.5 text-[#15803d] font-semibold">Good</td>
                      <td className="border border-[#e5e7eb] p-1.5">
                        Good practices observed in {reportData?.good_practices?.map((practices) => practices.title).join(', ')} and others.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[#e5e7eb] p-1.5">Compliance Support</td>
                      <td className="border border-[#e5e7eb] p-1.5 font-semibold" style={{ color: complianceStatus.color }}>
                        {complianceStatus.status}
                      </td>
                      <td className="border border-[#e5e7eb] p-1.5">
                        Mapping to OWASP ASVS {reportData?.compliance?.owaspAsvs}%, ISO 27001 {reportData?.compliance?.iso27001}%, SOC 2 {reportData?.compliance?.soc2}%, and GDPR {reportData?.compliance?.gdpr}%. Additional controls required for
                        other compliance frameworks and specific alignment.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Quantitative Snapshot</div>
                    <div className="text-[11px] text-[#6b7280]">Core metrics for this scan.</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#6b7280] mb-2">Scan summary:</p>
                <div className="text-[11px] text-[#6b7280]">
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    Total Files Scanned <strong className="ml-1 text-[#111827]">{ensureNumber(reportData?.totalFilesScanned, 1248).toLocaleString()}</strong>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    Findings (All Severities) <strong className="ml-1 text-[#111827]">{ensureNumber(reportData?.totalFindings, 76)}</strong>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    Critical <strong className="ml-1 text-[#111827]">{severityValues.critical}</strong>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    High <strong className="ml-1 text-[#111827]">{severityValues.high}</strong>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    Medium <strong className="ml-1 text-[#111827]">{severityValues.medium}</strong>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#e5e7eb] text-[10px] mr-1.5 mt-1">
                    Low / Info <strong className="ml-1 text-[#111827]">{severityValues.low}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[#6b7280] mt-3">
                  Recommended: prioritize remediation of critical and high findings within the next one to two sprint cycles, and
                  incorporate automated SmartComply Heimdall checks into your CI pipeline to prevent regression.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Repository & Scan Overview */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">2. Repository & Scan Overview</h2>
              <span className="text-[11px] text-[#6b7280]">Context for this analysis</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              This section outlines how SmartComply Heimdall Code Review AI was configured for this repository, including scan scope, languages,
              and the types of checks applied.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Repository Details</div>
                  </div>
                </div>
                <ul className="list-none mt-1 text-[11px] text-[#6b7280]">
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Repository</span>
                    <span className="font-medium text-[#111827]">{reportData.repository}</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Frameworks</span>
                    <span className="font-medium text-[#111827]">{reportData.frameworks}</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Languages</span>
                    <span className="font-medium text-[#111827]">{reportData.languages}</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Estimated Lines of Code</span>
                    <span className="font-medium text-[#111827]">{reportData.estimated_lines_of_code}</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Estimated Files Scanned</span>
                    <span className="font-medium text-[#111827]">{reportData.estimated_files_scanned}</span>
                  </li>
                </ul>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  All changes merged into <strong>{reportData.branch}</strong> during the reporting period were analyzed using SmartComply Heimdall's rules
                  and ML-based detections.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Scan Configuration</div>
                  </div>
                </div>
                <ul className="list-none mt-1 text-[11px] text-[#6b7280]">
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Check Types</span>
                    <span className="font-medium text-[#111827]">SAST, Performance, Security</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Policy Profile</span>
                    <span className="font-medium text-[#111827]">SmartComply Heimdall Default + Custom Auth Rules</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Exclusions</span>
                    <span className="font-medium text-[#111827]">{(reportData.exclusions?.length > 0 ? reportData.exclusions.length : 0)} exclusions applied</span>
                  </li>
                  <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">General Compliance Mapping</span>
                    <span className="font-medium text-[#111827]">{reportData.custom_compliance_mapping}</span>
                  </li>
                </ul>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  Configuration can be adjusted to align with your internal secure coding guidelines and risk appetite.
                </p>
              </div>
            </div>
          </section>

          {/* 3. OWASP Top 10 Mapping */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">3. OWASP Top 10 Mapping</h2>
              <span className="text-[11px] text-[#6b7280]">Findings categorized by OWASP Top 10 (latest)</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              SmartComply Heimdall maps detected vulnerabilities to the OWASP Top 10, providing a common language for security, development,
              and compliance teams.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Findings by OWASP Category</div>
                    <div className="text-[11px] text-[#6b7280]">Count of findings per category.</div>
                  </div>
                </div>
                <div className="h-[150px] mt-1.5 w-full relative">
                  <Bar data={owaspChartData} options={owaspChartOptions} />
                </div>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  {owaspTop3.length > 0 && (
                    <>
                      {owaspTop3.map((item) => (
                        <span key={item.title}>
                          {item.code} ({item.title}),
                        </span>
                      ))}
                      <span>
                        {' '}
                        are the highest-density categories in this repository.
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Category Highlights</div>
                    <div className="text-[11px] text-[#6b7280]">Narrative, executive-friendly summary.</div>
                  </div>
                </div>
                <ul className="list-none mt-1 text-[11px] text-[#6b7280]">
                  {owaspTop3.map((item) => (
                    <li className="flex justify-between py-0.75 mb-1" key={item.title}>
                      <span className="max-w-[70%]">
                        <strong>{item.code} – {item.title}</strong><br/>
                        {item.description}
                      </span>
                      {typeof item.count !== 'undefined' && (
                        <span className="font-medium text-[#111827]">{item.count}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Severity Distribution */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">4. Severity Distribution & Trends</h2>
              <span className="text-[11px] text-[#6b7280]">Risk level and evolution over time</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              This section highlights the severity profile of findings and trends across scans to help understand whether
              risk is increasing, stable, or decreasing.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Severity Distribution</div>
                    <div className="text-[11px] text-[#6b7280]">Across all findings in this scan.</div>
                  </div>
                </div>
                <div className="h-[150px] mt-1.5 w-full relative">
                  <Doughnut data={severityChartData} options={severityChartOptions} />
                </div>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  Critical and high findings represent the subset of issues that can lead to immediate compromise or regulatory impact.
                  Medium and low findings relate to defense-in-depth and hygiene.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Code Commits Over Time</div>
                    <div className="text-[11px] text-[#6b7280]">Last several code commits to this repository.</div>
                  </div>
                </div>
                <div className="h-[150px] mt-1.5 w-full relative">
                  <Line data={trendChartData} options={chartOptions} />
                </div>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  {reportData?.commit_trend_description}
                </p>
              </div>
            </div>
          </section>

          {/* 5. Security & Performance Risks */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">5. Security & Performance Risks</h2>
              <span className="text-[11px] text-[#6b7280]">Secret detection, config files, and hardening</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              SmartComply Heimdall analyzes code and configuration to identify embedded secrets, misconfigurations, and high-risk defaults that may
              expose the environment.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Top 5 Security Risks</div>
                  </div>
                </div>
                <ul className="list-none mt-1 text-[11px] text-[#6b7280]">
                  {reportData?.security_risks?.map((risk) => (
                    <li className="flex justify-between py-0.5" key={risk.title}>
                      <span className="max-w-[70%]">{risk.title}</span>
                      <span className="font-medium text-[#111827]">{risk.count}</span>
                    </li>
                  ))}
                </ul>
                {/* <p className="text-[11px] text-[#6b7280] mt-2">
                  No active secrets were found in the current commit, but several historical references were detected.
                  Consider ensuring those keys are rotated and deprecated.
                </p> */}
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[13px] font-semibold">Top 5 Performance Risks</div>
                  </div>
                </div>
                <div className="flex gap-3 text-[11px] text-[#6b7280] mt-1.5">
                  <div className="flex-1">
                    {/* <strong className="text-[#111827]">Risky Patterns</strong> */}
                    <ul className="list-none mt-1">
                      {reportData?.performance_risks?.map((risk) => (
                        <li className="py-0.5 flex justify-between" key={risk.title}>
                          <span className="max-w-[70%]">{risk.title}</span>
                          {risk.count !== undefined && (
                            <span className="font-medium text-[#111827]">{risk.count}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Dependency & Library Risk */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">6. Dependency & Library Risk</h2>
              <span className="text-[11px] text-[#6b7280]">Third-party components and SBOM-style summary</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              Dependencies can introduce vulnerabilities even when first-party code is well-designed. SmartComply Heimdall highlights known issues
              in libraries and frameworks referenced by this repository.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-semibold">Dependency Overview</div>
                </div>
                <ul className="list-none mt-1 text-[11px] text-[#6b7280]">
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">Total dependencies (direct + transitive)</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies.total}</span>
                  </li>
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">Dependencies with known CVEs</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies.withCVEs}</span>
                  </li>
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">Outdated major versions</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies.outdated}</span>
                  </li>
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">Critical vulnerabilities</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies?.critical}</span>
                  </li>
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">High vulnerabilities</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies.high}</span>
                  </li>
                  <li className="flex justify-between py-0.5">
                    <span className="max-w-[70%]">Medium vulnerabilities</span>
                    <span className="font-medium text-[#111827]">{reportData.dependencies.medium}</span>
                  </li>
                  {/* <li className="flex justify-between py-0.75">
                    <span className="max-w-[70%]">Security support status</span>
                    <span className="font-medium text-[#111827]">Node 18 LTS (supported)</span>
                  </li> */}
                </ul>
                <p className="text-[11px] text-[#6b7280] mt-2">
                  Identify a maintenance window to upgrade or replace packages with known vulnerabilities, particularly in networking and
                  serialization layers.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-semibold">Sample Risky Dependencies</div>
                </div>
                {reportData?.dependencies?.sample_dependencies?.map((dependency) => (
                  <div className="font-mono text-[11px] bg-[#f9fafb] rounded-md border border-[#e5e7eb] p-2 mt-1.5 overflow-x-auto whitespace-pre">
                    Package: {dependency.package_name}<br/>
                    Risk: {dependency.associated_risks}<br/>
                    Recommended: {dependency.recommended_version}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 7. Compliance Mapping */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">7. Compliance Mapping & Framework Alignment</h2>
              <span className="text-[11px] text-[#6b7280]">How findings relate to SOC 2, ISO 27001, PCI DSS, OWASP ASVS</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              While SmartComply Heimdall does not replace a full audit, it provides mappings to common frameworks to support audit readiness and
              gap analysis.
            </p>
            <p className="text-xs text-[#6b7280] mb-3">
              SmartComply Heimdall maps findings to 8 core global compliance frameworks: SOC 2, ISO 27001, PCI DSS, GDPR, NIST CSF, CIS Controls, OWASP ASVS, and OWASP Top 10
            </p>

            <div className="grid grid-cols-3 gap-3 mt-2 text-[11px]">
              {[
                { name: 'OWASP ASVS', score: reportData.compliance.owaspAsvs },
                { name: 'SOC 2 (Security)', score: reportData.compliance.soc2 },
                { name: 'ISO 27001', score: reportData.compliance.iso27001 },
                { name: 'GDPR (Code Aspects)', score: reportData.compliance.gdpr },
                { name: 'Custom Policy', score:0 },
                { name: 'Custom Policy', score: 0 },
              ].map((framework) => {
                const status = calculateFrameworkStatus(framework.score);
                return { ...framework, status };
              }).map((framework) => (
                <div key={framework.name} className="rounded-lg border border-[#e5e7eb] p-2 bg-[#f9fafb]">
                  <div className="font-semibold text-[11px] mb-1">{framework.name}</div>
                  <div className={`text-base font-semibold ${
                    framework.status === 'ok' ? 'text-[#15803d]' : 
                    framework.status === 'warn' ? 'text-[#d97706]' : 'text-[#b91c1c]'
                  }`}>
                    {framework.score}%
                  </div>
                  <div className="text-[10px] text-[#6b7280] mt-1">
                    {framework.status === 'ok' ? 'Strong compliance' : 'Needs improvement'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Risk Prioritization & Remediation Plan */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">8. Risk Prioritization & Remediation Plan</h2>
              <span className="text-[11px] text-[#6b7280]">What to fix first and how</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              This section provides a prioritized remediation plan focusing on issues most likely to result in compromise or
              regulatory exposure.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-semibold">Sample Top Risks</div>
                </div>
                <ol className="list-none ml-4 mt-1 text-[11px] text-[#6b7280]" style={{ listStyleType: 'decimal' }}>
                  {reportData?.top_5_risks?.map((risk) => (
                    <li className="py-0.5" key={risk.title}>
                      <span className="max-w-[70%]">{risk.title}: </span>
                      <span className="font-medium text-[#111827]">{risk.description}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-semibold">Suggested Remediation Timeline</div>
                </div>
                {/* <ul className="list-none mt-1 text-[11px] text-[#6b7280]"> */}
                  {/* <li className="flex justify-between py-0.75"> */}
                    {/* <span className="max-w-[70%]"> */}
                      <strong className="text-[#111827] text-[13px]">Immediate (0–2 weeks)</strong><br/>
                      <ul className="list-none ml-4 mt-1 text-[11px] text-[#6b7280]">
                        {reportData?.immediate_remediation_timeline?.map((risk) => (
                          <li className="py-0.5 flex justify-between mt-1" key={risk.title}>
                            <span className="max-w-[70%]">{risk.title} </span>
                            {/* <span className="font-medium text-[#111827]">{risk.description}</span> */}
                            <span className="font-medium text-[#111827]">{risk.severity}</span>
                          </li>
                        ))}
                      </ul>
                    {/* </span> */}
                  {/* </li> */}
                
                {/* </ul> */}
              </div>
            </div>
          </section>

          {/* 9. Appendix – Sample Detailed Findings & Good Practices */}
          <section className="pb-4 border-b border-[#e5e7eb]">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="text-[15px] font-semibold">9. Appendix – Sample Detailed Findings & Good Practices</h2>
              <span className="text-[11px] text-[#6b7280]">Illustrative examples (not full list)</span>
            </div>
            <p className="text-xs text-[#6b7280] mb-3">
              Full finding exports are available in SmartComply Heimdall. This appendix provides a small subset of issues to illustrate the level
              of detail captured and to support audit or engineering review.
            </p>

            <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
              <div className="flex justify-between items-baseline mb-2">
                <div className="text-[13px] font-semibold">
                     {reportData?.sample_detailed_findings?.[0]?.title}
                </div>
                <div className="inline-flex px-1.5 py-0.5 rounded-full bg-[#f3f4f6] text-[10px] text-[#b91c1c] font-semibold">
                  {reportData?.sample_detailed_findings?.[0]?.severity}
                </div>
              </div>
              <div className="text-[11px] text-[#6b7280]">
                {/* <strong>Location:</strong> {reportData?.sample_detailed_findings?.[0]?.file}:{reportData?.sample_detailed_findings?.[0]?.line}<br/> */}
                {/* <strong>Category:</strong> {reportData?.sample_detailed_findings?.[0]?.category}<br/> */}
                <strong>Description:</strong> {reportData?.sample_detailed_findings?.[0]?.description}
              </div>
              <div className="font-mono text-[11px] bg-[#f9fafb] rounded-md border border-[#e5e7eb] p-2 mt-1.5 overflow-x-auto whitespace-pre">
                {reportData?.sample_detailed_findings?.[0]?.code}
              </div>
              <div className="text-[11px] text-[#6b7280] mt-1.5">
                <strong>Recommendation:</strong> {reportData?.sample_detailed_findings?.[0]?.recommendation}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 mt-3">
              <div className="flex justify-between items-baseline mb-2">
                <div className="text-[13px] font-semibold">
                  {reportData?.sample_detailed_findings?.[1]?.title}
                </div>
                <div className="inline-flex px-1.5 py-0.5 rounded-full bg-[#f3f4f6] text-[10px] text-[#c05621] font-semibold">
                  {reportData?.sample_detailed_findings?.[1]?.severity}
                </div>
              </div>
              <div className="text-[11px] text-[#6b7280]">
                {/* <strong>Location:</strong> {reportData?.issues_by_category?.[1]?.file}:{reportData?.issues_by_category?.[1]?.line}<br/> */}
                {/* <strong>Category:</strong> {reportData?.issues_by_category?.[1]?.category}<br/> */}
                <strong>Description:</strong> {reportData?.sample_detailed_findings?.[1]?.description}
              </div>
              <div className="font-mono text-[11px] bg-[#f9fafb] rounded-md border border-[#e5e7eb] p-2 mt-1.5 overflow-x-auto whitespace-pre">
                {reportData?.sample_detailed_findings?.[1]?.code}
              </div>
              <div className="text-[11px] text-[#6b7280] mt-1.5">
                    <strong>Recommendation:</strong> {reportData?.sample_detailed_findings?.[1]?.recommendation}
              </div>
            </div>

            {/* Issues by Category Table */}
            {reportData?.issues_by_category && reportData.issues_by_category.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 mt-3">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-semibold">Issues by Category</div>
                </div>
                <p className="text-[11px] text-[#6b7280] mb-3">
                  Summary of all findings grouped by category with severity and count.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f9fafb]">
                        <th className="border border-[#e5e7eb] p-2 text-left font-medium text-[#6b7280]">Category</th>
                        <th className="border border-[#e5e7eb] p-2 text-center font-medium text-[#6b7280]">Count</th>
                        <th className="border border-[#e5e7eb] p-2 text-center font-medium text-[#6b7280]">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.issues_by_category.map((issue, idx) => {
                        const severityColors = {
                          Critical: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]',
                          High: 'bg-[#fed7aa] text-[#9a3412] border-[#fdba74]',
                          Medium: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
                          Low: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
                        };
                        return (
                          <tr key={idx} className="hover:bg-[#f9fafb]">
                            <td className="border border-[#e5e7eb] p-2 text-[#111827] font-medium">{issue.category}</td>
                            <td className="border border-[#e5e7eb] p-2 text-center text-[#111827] font-semibold">{issue.count}</td>
                            <td className="border border-[#e5e7eb] p-2 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${severityColors[issue.severity] || 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]'}`}>
                                {issue.severity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detected Good Practices */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 mt-3">
              <div className="flex justify-between items-baseline mb-2">
                <div className="text-[13px] font-semibold">Detected Good Practices</div>
              </div>
              <div className="text-[11px] text-[#6b7280]">
                <p className="mb-2">
                  The following positive patterns were identified during the scan and can be used as examples for other services:
                </p>
                {/* <ul className="list-disc list-inside space-y-1"> */}
                  {reportData?.good_practices?.map((practice, idx) => (
                    // <li key={idx}>
                    <div key={idx} className="mt-2">
                      <strong className="text-[#111827]">{practice.title}</strong>
                      <p className="text-[#6b7280]">{practice.comment}</p>
                    </div>
                    // </li>
                  ))
                }
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-8 py-2.5 pb-4 border-t border-[#e5e7eb] text-[10px] text-[#6b7280] flex justify-between">
          <span>SmartComply Heimdall · {reportData?.repository} Source Code Security Report</span>
          {/* <span>Page 1 of {reportData?.total_pages}</span> */}
        </footer>
      </div>
    </div>
  );
};

export default SecurityReportView;

