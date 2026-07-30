import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  FolderSearch,
  ScanFace,
  FileCheck,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD },
  { label: 'Verification Queue', icon: ListChecks, route: ROUTES.DASHBOARD },
  { label: 'Verification Workspace', icon: FolderSearch, route: ROUTES.DASHBOARD },
  { label: 'Face Verification', icon: ScanFace, route: ROUTES.DASHBOARD },
  { label: 'Results', icon: FileCheck, route: ROUTES.DASHBOARD },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate(ROUTES.LANDING);
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-ink-200/70 bg-white dark:bg-ink-900 dark:border-ink-800">
        <div className="h-16 flex items-center px-5 border-b border-ink-200/70 dark:border-ink-800">
          <Link to={ROUTES.DASHBOARD}>
            <Logo size="sm" />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            Workspace
          </p>
          {sidebarItems.map((item, i) => {
            const Icon = item.icon;
            const active = i === 0 && location.pathname === ROUTES.DASHBOARD;
            return (
              <Link
                key={item.label}
                to={item.route}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-ink-200/70 dark:border-ink-800">
          <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3.5">
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-300">
              System Status
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-ink-500 dark:text-ink-400">
                All services operational
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-ink-200/70 bg-white/80 dark:bg-ink-900/80 dark:border-ink-800 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1">
            <div className="md:hidden">
              <Logo size="sm" showText={false} />
            </div>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by reference ID or applicant name..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-ink-50 dark:bg-ink-800 border border-transparent rounded-lg focus:bg-white dark:focus:bg-ink-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all dark:text-ink-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button className="relative p-2 rounded-lg text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800 transition-colors">
              <Bell className="h-4 w-4" strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-ink-900" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200 leading-tight">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 leading-tight">
                    {user?.role || 'Compliance Officer'}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 card shadow-elevated z-50 animate-scale-in origin-top-right overflow-hidden">
                    <div className="p-4 border-b border-ink-100 dark:border-ink-800">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                          {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                            {user?.name || 'Admin'}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">
                            {user?.email || 'admin@verifyline.io'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-ink-400">Role</span>
                          <span className="text-ink-700 dark:text-ink-300 font-medium">
                            {user?.role || 'Compliance Officer'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-400">Department</span>
                          <span className="text-ink-700 dark:text-ink-300 font-medium">
                            {user?.department || 'KYC Operations'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-400">Last Login</span>
                          <span className="text-ink-700 dark:text-ink-300 font-medium">
                            {user?.lastLogin
                              ? new Date(user.lastLogin).toLocaleString(
                                  'en-US',
                                  { dateStyle: 'short', timeStyle: 'short' },
                                )
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-lg transition-colors">
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
