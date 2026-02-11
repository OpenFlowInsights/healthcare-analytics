export interface Dashboard {
  id: string;
  title: string;
  description: string;
  category: 'aco' | 'partd' | 'tools';
  href?: string;
  external?: boolean;
  status?: 'active' | 'coming-soon';
}

export const dashboards: Dashboard[] = [
  // ACO Category
  {
    id: 'aco-performance',
    title: 'ACO Performance Dashboard',
    description: 'Comprehensive ACO performance tracking with shared savings calculations, quality scores, and beneficiary attribution analysis.',
    category: 'aco',
    href: '/dashboard',
    status: 'active',
  },
  {
    id: 'drug-spending',
    title: 'Drug Spending Analysis',
    description: 'Detailed drug spending analytics with cost trends, utilization patterns, and formulary optimization opportunities.',
    category: 'aco',
    href: '/drug-spending',
    status: 'active',
  },

  // Part D Category
  {
    id: 'partd-overview',
    title: 'Part D Overview',
    description: 'High-level overview of Medicare Part D prior authorization landscape, burden metrics, and trends across plans and drugs.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app',
    external: true,
    status: 'active',
  },
  {
    id: 'plan-pa-burden',
    title: 'Plan PA Burden',
    description: 'Compare prior authorization burden across Medicare Part D plans. Identify plans with the most restrictive policies.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/pa-burden',
    external: true,
    status: 'active',
  },
  {
    id: 'drug-level-um',
    title: 'Drug-Level UM Analysis',
    description: 'Analyze utilization management (PA, ST, QL) requirements at the drug level across all Part D plans.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/drug-analysis',
    external: true,
    status: 'active',
  },
  {
    id: 'pa-gap-analysis',
    title: 'PA Gap Analysis',
    description: 'Identify prior authorization opportunities by comparing plan requirements against prescribing patterns and formularies.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/pa-opportunity',
    external: true,
    status: 'active',
  },
  {
    id: 'prescriber-pa-exposure',
    title: 'Prescriber PA Exposure',
    description: 'Assess prescriber-level PA burden based on their prescribing patterns and patient plan enrollment.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/prescriber',
    external: true,
    status: 'active',
  },
  {
    id: 'spending-trends',
    title: 'Spending Trends',
    description: 'Track Part D spending trends over time with drill-down by drug class, plan, and geographic region.',
    category: 'partd',
    href: 'https://partd-dashboard.vercel.app/dashboard/spending',
    external: true,
    status: 'active',
  },

  // Data Tools Category
  {
    id: 'snowquery',
    title: 'SnowQuery',
    description: 'Self-service SQL query interface for Snowflake data warehouse. Run custom queries and export results.',
    category: 'tools',
    href: '/data-tools',
    status: 'active',
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
