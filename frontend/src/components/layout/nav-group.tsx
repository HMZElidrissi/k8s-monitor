import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NavCollapsible, NavItem, NavLink, NavGroup } from '@/types';
import { cn } from '@/lib/utils';
import { StatusDot, type StatusType } from '@/components/ui/status-indicator';

export function NavGroup({ title, items }: NavGroup) {
  const { state } = useSidebar();
  const { pathname } = useLocation();

  return (
    <SidebarGroup className='py-2'>
      <SidebarGroupLabel className='text-xs font-medium text-muted-foreground px-2 pb-1'>
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className='space-y-0.5'>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`;

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={pathname} />;

          if (state === 'collapsed')
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                href={pathname}
              />
            );

          return (
            <SidebarMenuCollapsible key={key} item={item} href={pathname} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className='rounded-full px-1.5 py-0 text-[10px] h-4 min-w-4 flex items-center justify-center font-medium'>
    {children}
  </Badge>
);

const StatusIndicator = ({
  description,
  metadata,
}: {
  description?: string;
  metadata?: { status?: StatusType; [key: string]: any };
}) => {
  if (!description && !metadata?.status) return null;

  let status: StatusType = 'unknown';
  let displayText = description || '';

  // First priority: use metadata status if available
  if (metadata?.status) {
    status = metadata.status;
  } else if (description) {
    // Parse status from description (format: "statusType namespace" or "statusType count pods")
    const parts = description.trim().split(' ');
    const firstPart = parts[0];

    if (['healthy', 'degraded', 'unhealthy', 'unknown'].includes(firstPart)) {
      status = firstPart as StatusType;
      displayText = parts.slice(1).join(' ');
    } else {
      // Fallback: check for status keywords in the description
      const lowerDescription = description.toLowerCase();
      if (
        lowerDescription.includes('healthy') ||
        lowerDescription.includes('running')
      ) {
        status = 'healthy';
      } else if (
        lowerDescription.includes('degraded') ||
        lowerDescription.includes('warning')
      ) {
        status = 'degraded';
      } else if (
        lowerDescription.includes('unhealthy') ||
        lowerDescription.includes('failed') ||
        lowerDescription.includes('error')
      ) {
        status = 'unhealthy';
      }
    }
  }

  return (
    <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground leading-none mt-0.5'>
      <StatusDot status={status} size='sm' className='shrink-0' />
      <span className='truncate'>{displayText}</span>
    </div>
  );
};

const SidebarMenuLink = ({ item, href }: { item: NavLink; href: string }) => {
  const { setOpenMobile, state } = useSidebar();
  const isActive = checkIsActive(href, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(
          'group relative h-8 px-2 text-sm transition-all duration-200 hover:bg-sidebar-accent/50',
          isActive && [
            'bg-gradient-to-r from-primary/10 to-primary/5',
            'text-primary font-medium',
            'border-r-2 border-primary',
            'shadow-sm',
            'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r-full',
          ]
        )}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            {item.icon && (
              <item.icon
                className={cn(
                  'shrink-0 h-4 w-4 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='truncate text-sm leading-tight'>
                {item.title}
              </span>
              {(item.description || item.metadata?.status) &&
                state !== 'collapsed' && (
                  <StatusIndicator
                    description={item.description}
                    metadata={item.metadata}
                  />
                )}
            </div>
          </div>
          {item.badge && state !== 'collapsed' && (
            <NavBadge>
              <span className={isActive ? 'text-primary-foreground' : ''}>
                {item.badge}
              </span>
            </NavBadge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  const { setOpenMobile, state } = useSidebar();
  const hasActiveChild = item.items.some((subItem) =>
    checkIsActive(href, subItem)
  );

  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(
              'h-8 px-2 text-sm transition-all duration-200 hover:bg-sidebar-accent/50',
              hasActiveChild && [
                'bg-primary/5 text-primary font-medium',
                'border-r-2 border-primary/30',
              ]
            )}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  hasActiveChild ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
            <span className='text-sm'>{item.title}</span>
            {item.badge && state !== 'collapsed' && (
              <NavBadge>{item.badge}</NavBadge>
            )}
            <ChevronRight
              className={cn(
                'ml-auto h-3 w-3 transition-all duration-200 group-data-[state=open]/collapsible:rotate-90',
                hasActiveChild && 'text-primary'
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className='ml-4 mt-1 space-y-0.5 border-l border-border/50 pl-2'>
            {item.items.map((subItem) => {
              const isSubActive = checkIsActive(href, subItem);
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    className={cn(
                      'h-7 px-2 text-xs transition-all duration-200 hover:bg-sidebar-accent/50',
                      isSubActive && [
                        'bg-gradient-to-r from-primary/15 to-primary/5',
                        'text-primary font-medium',
                        'border-l-2 border-primary ml-[-10px] pl-3',
                        'shadow-sm',
                      ]
                    )}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && (
                        <subItem.icon
                          className={cn(
                            'h-3 w-3 transition-colors',
                            isSubActive
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                      )}
                      <div className='flex flex-col min-w-0 flex-1'>
                        <span className='truncate text-xs leading-tight'>
                          {subItem.title}
                        </span>
                        {subItem.description && state !== 'collapsed' && (
                          <StatusIndicator
                            description={subItem.description}
                            metadata={subItem.metadata}
                          />
                        )}
                      </div>
                      {subItem.badge && state !== 'collapsed' && (
                        <NavBadge>
                          <span
                            className={
                              isSubActive ? 'text-primary-foreground' : ''
                            }
                          >
                            {subItem.badge}
                          </span>
                        </NavBadge>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  const isActive = checkIsActive(href, item);
  const hasActiveChild = item.items.some((subItem) =>
    checkIsActive(href, subItem)
  );

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive || hasActiveChild}
            className={cn(
              'h-8 px-2 transition-all duration-200',
              (isActive || hasActiveChild) && [
                'bg-gradient-to-r from-primary/10 to-primary/5',
                'text-primary font-medium',
                'border-r-2 border-primary',
              ]
            )}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive || hasActiveChild
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              />
            )}
            <span className='text-sm'>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight
              className={cn(
                'ml-auto h-3 w-3 transition-all duration-200 group-data-[state=open]/collapsible:rotate-90',
                (isActive || hasActiveChild) && 'text-primary'
              )}
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side='right'
          align='start'
          sideOffset={4}
          className='min-w-48'
        >
          <DropdownMenuLabel className='text-xs font-medium px-2 py-1.5'>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => {
            const isSubActive = checkIsActive(href, sub);
            return (
              <DropdownMenuItem
                key={`${sub.title}-${sub.url}`}
                asChild
                className='px-2 py-1.5'
              >
                <Link
                  to={sub.url}
                  className={cn(
                    'flex items-center gap-2 text-xs transition-all duration-200',
                    isSubActive && [
                      'bg-gradient-to-r from-primary/15 to-primary/5',
                      'text-primary font-medium',
                      'border-l-2 border-primary',
                      'shadow-sm',
                    ]
                  )}
                >
                  {sub.icon && (
                    <sub.icon
                      className={cn(
                        'h-3 w-3 transition-colors',
                        isSubActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  )}
                  <div className='flex flex-col min-w-0 flex-1'>
                    <span className='max-w-52 text-wrap text-xs leading-tight'>
                      {sub.title}
                    </span>
                    {sub.description && (
                      <StatusIndicator
                        description={sub.description}
                        metadata={sub.metadata}
                      />
                    )}
                  </div>
                  {sub.badge && (
                    <span
                      className={cn(
                        'ml-auto text-[10px] px-1 py-0.5 rounded font-medium transition-colors',
                        isSubActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {sub.badge}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  const currentPath = pathname.split('?')[0];
  const itemPath = typeof item.url === 'string' ? item.url.split('?')[0] : '';
  return (
    currentPath === item.url || // /endpoint?search=param
    currentPath === itemPath || // endpoint
    !!item?.items?.filter((i) => i.url === currentPath).length || // if child nav is active
    (mainNav &&
      currentPath.split('/')[1] !== '' &&
      currentPath.split('/')[1] === itemPath.split('/')[1])
  );
}
