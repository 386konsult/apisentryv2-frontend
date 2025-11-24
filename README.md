# APISentry - All-in-one API Security Platform

APISentry is a comprehensive API security platform that provides enterprise-grade protection for your APIs with WAF (Web Application Firewall), threat detection, vulnerability scanning, code review, and real-time monitoring.

## Features

- **WAF Protection**: Advanced web application firewall rules and threat blocking
- **Threat Detection**: Real-time threat detection and blocking capabilities
- **API Monitoring**: Comprehensive API endpoint monitoring and analytics
- **Vulnerability Scanning**: Automated vulnerability scanning and reporting
- **Code Review**: Security-focused code review with GitHub/Bitbucket integration
- **Security Alerts**: Real-time security alerts and incident management
- **IP Blacklist**: Manage IP blacklists for enhanced security
- **Audit Logs**: Complete audit trail for compliance and security

## Getting Started

### Prerequisites

- Node.js & npm (or yarn) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd apisentryv2-frontend

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Technologies

This project is built with:

- **Vite** - Next generation frontend tooling
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── contexts/      # React contexts (Auth, Platform)
├── services/      # API services
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
└── data/          # Static data files
```

## Deployment

Build the project for production:

```sh
npm run build
```

The `dist` folder will contain the production-ready files that can be deployed to any static hosting service.

## License

Copyright © APISentry. All rights reserved.
