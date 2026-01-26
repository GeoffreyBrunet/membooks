import { Link } from "@tanstack/react-router";
import { getStatistics, BOOK_TYPE_LABELS, CATEGORY_LABELS, type BookType, type BookCategory } from "../services/books";

// Neo-Memphis colors for charts
const TYPE_COLORS: Record<BookType, string> = {
  novel: "#FF6B6B",
  comic: "#4ECDC4",
  manga: "#FFE66D",
  artbook: "#9B5DE5",
  essay: "#F15BB5",
};

const CATEGORY_COLORS: Record<BookCategory, string> = {
  sf: "#00BBF9",
  fantasy: "#9B5DE5",
  thriller: "#FF4444",
  romance: "#F15BB5",
  horror: "#212121",
  adventure: "#FFE66D",
  sliceOfLife: "#4ECDC4",
  historical: "#92400e",
  mystery: "#6366f1",
  biography: "#00C851",
};

export function StatisticsPage() {
  const stats = getStatistics();

  const typeData = Object.entries(stats.byType)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const categoryData = Object.entries(stats.byCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // SVG Donut chart for read progress
  const DonutChart = ({ percentage }: { percentage: number }) => {
    const strokeDasharray = `${percentage} ${100 - percentage}`;
    return (
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "var(--font-title)",
            fontSize: "24px",
            color: "var(--text-primary)",
          }}
        >
          {percentage}%
        </div>
      </div>
    );
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Statistics</h1>
        <div style={{ width: "80px" }} />
      </div>

      {stats.total === 0 ? (
        <div className="empty-state">
          <h3>No statistics yet</h3>
          <p>Add some books to see your reading statistics</p>
          <Link to="/search" className="btn btn-primary" style={{ marginTop: "16px" }}>
            Add Books
          </Link>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Books</div>
            </div>
            <div className="stat-card cyan">
              <div className="stat-value">{stats.read}</div>
              <div className="stat-label">Read</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-value">{stats.unread}</div>
              <div className="stat-label">Unread</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "var(--space-xl)" }}>
            {/* Reading Progress */}
            <div className="card">
              <h2 className="subtitle" style={{ marginBottom: "var(--space-xl)" }}>Reading Progress</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
                <DonutChart percentage={stats.readPercentage} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--cyan)", border: "2px solid var(--border-color)" }} />
                    <span>Read: {stats.read}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--bg-tertiary)", border: "2px solid var(--border-color)" }} />
                    <span>Unread: {stats.unread}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* By Type */}
            <div className="card">
              <h2 className="subtitle" style={{ marginBottom: "var(--space-xl)" }}>Books by Type</h2>
              {typeData.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No data</p>
              ) : (
                <div>
                  {typeData.map(([type, count]) => (
                    <div key={type} style={{ marginBottom: "var(--space-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              background: TYPE_COLORS[type as BookType],
                              border: "2px solid var(--border-color)",
                            }}
                          />
                          <span>{BOOK_TYPE_LABELS[type as BookType]}</span>
                        </div>
                        <span>{count} ({Math.round((count / stats.total) * 100)}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: "8px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(count / stats.total) * 100}%`,
                            background: TYPE_COLORS[type as BookType],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Category */}
            <div className="card">
              <h2 className="subtitle" style={{ marginBottom: "var(--space-xl)" }}>Books by Genre</h2>
              {categoryData.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No data</p>
              ) : (
                <div>
                  {categoryData.map(([category, count]) => (
                    <div key={category} style={{ marginBottom: "var(--space-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              background: CATEGORY_COLORS[category as BookCategory],
                              border: "2px solid var(--border-color)",
                            }}
                          />
                          <span>{CATEGORY_LABELS[category as BookCategory]}</span>
                        </div>
                        <span>{count}</span>
                      </div>
                      <div className="progress-bar" style={{ height: "8px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(count / Math.max(...categoryData.map(([, c]) => c))) * 100}%`,
                            background: CATEGORY_COLORS[category as BookCategory],
                          }}
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
