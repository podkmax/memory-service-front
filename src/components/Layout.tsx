import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/projects", label: "Projects" },
  { to: "/artifacts", label: "Artifacts" },
  { to: "/admin/reindex", label: "Reindex" },
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">MS</span>
          <div>
            <h1>Memory Service</h1>
            <p>Projects and artifacts management UI</p>
          </div>
        </div>
        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
