import { Link, NavLink, Outlet } from 'react-router-dom';
import { HandCoins, Network } from 'lucide-react';

const APP_NAME = 'Evernode Tip Jar';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
    : 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100';
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-gray-50 to-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-gray-900">
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              <HandCoins className="h-4 w-4" />
              Tip
            </NavLink>
            <NavLink to="/cluster" className={navLinkClass}>
              <Network className="h-4 w-4" />
              Cluster
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-100 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
