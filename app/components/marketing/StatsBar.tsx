export function StatsBar() {
  const stats = [
    { value: '$42M+', label: 'Shared Savings Identified' },
    { value: '180K+', label: 'Beneficiaries Analyzed' },
    { value: '34', label: 'Quality Measures Tracked' },
    { value: '99.8%', label: 'CMS Data Accuracy' },
  ];

  return (
    <section className="bg-white py-12 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fadeInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl sm:text-4xl font-heading font-bold text-navy-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
