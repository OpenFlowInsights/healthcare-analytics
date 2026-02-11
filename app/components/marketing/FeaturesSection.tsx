import { BarChart3, TrendingUp, Shield } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: 'Custom SaaS Dashboards',
      description:
        'Beautiful, interactive dashboards built specifically for your organization. Real-time data from CMS BCDA, Snowflake data warehouses, and your internal systems.',
      color: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'Risk Adjustment Analytics',
      description:
        'RAF score optimization, HCC gap analysis, and coding opportunity identification. Maximize your risk-adjusted revenue with data-driven insights.',
      color: 'text-emerald-600',
    },
    {
      icon: Shield,
      title: 'Quality & Compliance Reporting',
      description:
        'Track all 34 MIPS quality measures, HEDIS metrics, and Star Ratings performance. Automated monitoring ensures you never miss a deadline.',
      color: 'text-violet-600',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-navy-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From data engineering to dashboard delivery, we handle the entire analytics stack so you can focus on patient care.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow animate-fadeInUp"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className={`${feature.color} mb-4`}>
                <feature.icon className="h-12 w-12" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-navy-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
