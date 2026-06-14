import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

/**
 * App shell for all authenticated pages.
 * Renders Top Navbar + Sidebar + Scrollable white main content area.
 */
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto"
          style={{
            marginLeft: "var(--sidebar-width)",
            background: "var(--color-bg)",
          }}
        >
          <div className="max-w-5xl mx-auto px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
