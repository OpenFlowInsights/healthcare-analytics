export interface Dashboard {
  id: string;
  title: string;
  description: string;
  category: 'aco' | 'partd' | 'tools';
  href?: string;
  external?: boolean;
  status?: 'active' | 'coming-soon';
  badge?: string;
}

export const dashboards: Dashboard[] = [
  // ACO Category
  {
    id: 'aco-performance',
    title: 'ACO Performance Dashboard',
    description: 'Track shared savings, RAF scores, quality measures, and provider-level cost patterns',
    category: 'aco',
    href: 'https://ofi-healthcare.vercel.app/dashboard',
    external: true,
    status: 'active',
  },
  {
    id: 'drug-spending',
    title: 'Drug Spending Analysis',
    description: 'Medicare Part D spending trends, brand vs generic analysis, cost-per-beneficiary tracking',
    category: 'aco',
    href: 'https://ofi-healthcare.vercel.app/drug-spending',
    external: true,
    status: 'active',
  },

  // Part D Category
  {
    id: 'partd-overview',
    title: 'Part D Overview',
    description: 'MAPD plan landscape, drug PA prevalence, plan distribution',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard',
    external: true,
    status: 'active',
  },
  {
    id: 'plan-pa-burden',
    title: 'Plan PA Burden Comparison',
    description: 'Rank and compare plans by prior auth requirements',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/pa-burden',
    external: true,
    status: 'active',
  },
  {
    id: 'drug-level-um',
    title: 'Drug-Level UM Analysis',
    description: 'Search any drug, see how every MAPD plan handles it',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/drug-analysis',
    external: true,
    status: 'active',
  },
  {
    id: 'pa-gap-analysis',
    title: 'PA Gap Analysis',
    description: 'Flag claims with no PA where national plans require it, quantify spend exposure',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/pa-opportunity',
    external: true,
    status: 'active',
  },
  {
    id: 'prescriber-pa-exposure',
    title: 'Prescriber PA Exposure',
    description: 'Which providers are driving spend on high-PA drugs',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/prescriber',
    external: true,
    status: 'active',
  },
  {
    id: 'spending-trends',
    title: 'Part D Spending Trends',
    description: 'National spending data with YoY comparisons',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/spending',
    external: true,
    status: 'active',
  },

  // Data Tools Category
  {
    id: 'snowquery',
    title: 'SnowQuery',
    description: 'Natural language database queries',
    category: 'tools',
    href: 'https://snowquery.vercel.app',
    external: true,
    status: 'active',
    badge: 'BETA',
  },
];

export const categories = [
  {
    id: 'aco',
    name: 'Healthcare ACO Analytics',
    description: 'Dashboards for MSSP ACO performance tracking and shared savings optimization.',
  },
  {
    id: 'partd',
    name: 'Part D Prior Authorization Intelligence',
    description: 'Comprehensive analytics for Medicare Part D prior authorization burden and opportunities.',
  },
  {
    id: 'tools',
    name: 'Data Tools',
    description: 'Self-service tools for data exploration and custom analysis.',
  },
] as const;
