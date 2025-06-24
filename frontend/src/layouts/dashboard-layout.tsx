import Cookies from 'js-cookie';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SearchProvider } from '@/contexts/search-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import SkipToMain from '@/components/layout/skip-to-main';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Search } from '@/components/dashboard/search';
import { ThemeSwitch } from '@/components/dashboard/theme-switch';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { Toaster } from 'sonner';

interface Props {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false';
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          <Header>
            <TopNav links={topNav} />
            <div className='ml-auto flex items-center space-x-4'>
              <Search />
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          <Toaster />
          {children ? children : <Outlet />}
        </div>
      </SidebarProvider>
    </SearchProvider>
  );
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Applications',
    href: 'dashboard/applications',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Pods',
    href: 'dashboard/pods',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Alerts',
    href: 'dashboard/alerts',
    isActive: false,
    disabled: false,
  },
];
