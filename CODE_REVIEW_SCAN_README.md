# Code Review Scan Functionality

This document explains the new code review scan functionality that has been added to the Sentinel Flux UI.

## Overview

The code review scan functionality allows users to:
1. Start a comprehensive security scan across all connected repositories
2. View real-time scan progress and status
3. Access detailed scan reports with findings and recommendations
4. Track security scores and risk levels for each repository

## New Pages

### 1. Code Review Dashboard (`/code-review-dashboard`)
- **Run All Scans Button**: Clicking this button initiates a new scan across all connected repositories
- The button connects to the API to start a scan and then navigates to the scan reports page

### 2. Scan Reports Page (`/code-review-scan-reports`)
- Shows current in-progress scans with real-time progress
- Displays a table of all previous scan reports
- Each completed report has a "View Report" button that takes you to the detailed report

### 3. Detailed Report Page (`/code-review-report/:reportId`)
- Comprehensive view of scan results for a specific scan
- Repository selector to view results for individual repositories
- Four tabs:
  - **Overview**: High-level metrics and repository information
  - **Findings**: Detailed list of security findings with severity and status
  - **Metrics**: Statistical breakdown of findings by severity and status
  - **Details**: Technical scan configuration and coverage information

## API Integration

The functionality integrates with the following API endpoints:

- `POST /api/v1/code-review/start-scan/` - Start a new scan
- `GET /api/v1/code-review/scan-reports/` - Get all scan reports
- `GET /api/v1/code-review/scan-reports/:reportId` - Get specific scan report
- `GET /api/v1/code-review/scan-status/:scanId` - Get scan progress status

## Mock API Server

A mock API server is provided for testing and demonstration purposes:

### Setup
1. Navigate to the project root
2. Install dependencies: `npm install` (using the mock-server-package.json)
3. Start the server: `node mock-api-server.js`

The mock server runs on `http://localhost:8080` and provides:
- Real-time scan progress simulation
- Mock data for repositories and findings
- Automatic scan completion after 5 seconds per repository

### Mock Data Features
- 5 repositories per scan (api-gateway, frontend-app, auth-service, payment-service, notification-service)
- Realistic security findings with different severities
- Progressive scan completion with status updates
- Random security scores and finding counts

## Navigation Flow

1. **Dashboard** → Click "Run All Scans" → **Scan Reports Page**
2. **Scan Reports Page** → Click "View Report" on completed scan → **Detailed Report Page**
3. **Detailed Report Page** → Select different repositories to view their results

## Key Features

### Real-time Progress Tracking
- Live updates of scan progress
- Repository-by-repository status updates
- Progress bars and completion percentages

### Comprehensive Reporting
- Security scores for each repository
- Risk level assessments (Low, Medium, High, Critical)
- Detailed findings with CWE references
- Recommendations for fixing issues

### User-friendly Interface
- Modern, responsive design with animations
- Clear status indicators and badges
- Intuitive navigation between pages
- Toast notifications for user feedback

## Integration with Existing System

The new functionality integrates seamlessly with the existing codebase:
- Uses existing UI components and styling
- Follows the established routing patterns
- Integrates with the existing authentication system
- Maintains consistency with other dashboard features

## Future Enhancements

Potential improvements for the code review scan functionality:
- Real-time notifications for scan completion
- Export reports to PDF/CSV
- Historical trend analysis
- Integration with CI/CD pipelines
- Automated fix suggestions
- Team collaboration features for resolving findings 