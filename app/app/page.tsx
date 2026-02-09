import Link from 'next/link';
import { BarChart, Users, Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Healthcare Analytics Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          CMS MSSP ACO Performance & BCDA Data Insights
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <BarChart className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ACO Performance</h3>
            <p className="text-gray-600 text-sm mb-4">
              Track Medicare Shared Savings Program metrics
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Patient Analytics</h3>
            <p className="text-gray-600 text-sm mb-4">
              BCDA FHIR data for beneficiary insights
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Activity className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Dashboards</h3>
            <p className="text-gray-600 text-sm mb-4">
              Interactive visualizations powered by Snowflake
            </p>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
