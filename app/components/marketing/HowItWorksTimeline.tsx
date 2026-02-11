export function HowItWorksTimeline() {
  const steps = [
    {
      week: 'Week 1',
      title: 'Connect Your Data',
      description:
        'We connect to your CMS BCDA feed, EHR systems, and claims data. Our team handles all the technical setup and security compliance.',
    },
    {
      week: 'Week 2',
      title: 'Build Data Warehouse',
      description:
        'We construct a Snowflake data warehouse optimized for healthcare analytics. All your data in one place, properly modeled and documented.',
    },
    {
      week: 'Month 1',
      title: 'Deliver Your Dashboard',
      description:
        'Launch your custom dashboard with real-time insights. Ongoing support, updates, and new features as your needs evolve.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-navy-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From data chaos to actionable insights in just 4 weeks
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col md:flex-row gap-6 items-start animate-fadeInUp"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Timeline connector */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 md:left-[74px] top-16 bottom-0 w-0.5 bg-blue-200 hidden sm:block" />
              )}

              {/* Week badge */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-heading font-bold text-sm relative z-10">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-600 mb-1">{step.week}</div>
                <h3 className="font-heading font-semibold text-xl text-navy-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
