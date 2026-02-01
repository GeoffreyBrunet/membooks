import { Link } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { getStatistics, BOOK_TYPE_LABELS, CATEGORY_LABELS, type BookType, type BookCategory } from "../services/books";

const TYPE_COLORS: Record<BookType, string> = {
  novel: "bg-coral",
  comic: "bg-cyan",
  manga: "bg-yellow",
  artbook: "bg-purple",
  essay: "bg-pink",
};

const CATEGORY_COLORS: Record<BookCategory, string> = {
  sf: "bg-blue",
  fantasy: "bg-purple",
  thriller: "bg-red-500",
  romance: "bg-pink",
  horror: "bg-gray-900",
  adventure: "bg-yellow",
  sliceOfLife: "bg-cyan",
  historical: "bg-amber-700",
  mystery: "bg-indigo-500",
  biography: "bg-green-500",
};

export function StatisticsPage() {
  usePageTitle("Statistics");
  const stats = getStatistics();

  const typeData = Object.entries(stats.byType)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const categoryData = Object.entries(stats.byCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const DonutChart = ({ percentage }: { percentage: number }) => {
    const strokeDasharray = `${percentage} ${100 - percentage}`;
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="-rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#4ECDC4"
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-title text-2xl">
          {percentage}%
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Statistics</h1>
        <div className="w-20" />
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-16">
          <h3 className="font-title text-xl mb-2">No statistics yet</h3>
          <p className="text-gray-600 mb-6">Add some books to see your reading statistics</p>
          <Link
            to="/search"
            className="inline-block px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Add Books
          </Link>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
              <div className="font-title text-4xl mb-2">{stats.total}</div>
              <div className="text-gray-600">Total Books</div>
            </div>
            <div className="bg-cyan border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
              <div className="font-title text-4xl mb-2">{stats.read}</div>
              <div className="text-gray-800">Read</div>
            </div>
            <div className="bg-yellow border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
              <div className="font-title text-4xl mb-2">{stats.unread}</div>
              <div className="text-gray-800">Unread</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Reading Progress */}
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md">
              <h2 className="font-title text-xl mb-6">Reading Progress</h2>
              <div className="flex items-center gap-8">
                <DonutChart percentage={stats.readPercentage} />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan border-2 border-gray-900 rounded" />
                    <span>Read: {stats.read}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border-2 border-gray-900 rounded" />
                    <span>Unread: {stats.unread}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md">
              <h2 className="font-title text-xl mb-6">Books by Type</h2>
              {typeData.length === 0 ? (
                <p className="text-gray-500">No data</p>
              ) : (
                <div className="space-y-4">
                  {typeData.map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${TYPE_COLORS[type as BookType]} border border-gray-900`} />
                          <span className="text-sm">{BOOK_TYPE_LABELS[type as BookType]}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {count} ({Math.round((count / stats.total) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${TYPE_COLORS[type as BookType]}`}
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Category */}
            <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md">
              <h2 className="font-title text-xl mb-6">Books by Genre</h2>
              {categoryData.length === 0 ? (
                <p className="text-gray-500">No data</p>
              ) : (
                <div className="space-y-4">
                  {categoryData.map(([category, count]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[category as BookCategory]} border border-gray-900`} />
                          <span className="text-sm">{CATEGORY_LABELS[category as BookCategory]}</span>
                        </div>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${CATEGORY_COLORS[category as BookCategory]}`}
                          style={{ width: `${(count / Math.max(...categoryData.map(([, c]) => c))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
