const OPERATIONAL = 0.98;
const DEGRADED = 0.9;

export function getStatusConfig(value: number) {
  if (isNaN(value)) {
    return {
      color: 'bg-muted hover:bg-muted/80',
      label: 'No Data',
      badgeVariant: 'outline' as const,
      textColor: 'text-muted-foreground',
    };
  }
  if (value > OPERATIONAL) {
    return {
      color:
        'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
      label: 'Operational',
      badgeVariant: 'default' as const,
      textColor: 'text-green-600 dark:text-green-400',
    };
  }
  if (value > DEGRADED) {
    return {
      color:
        'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700',
      label: 'Degraded',
      badgeVariant: 'secondary' as const,
      textColor: 'text-yellow-600 dark:text-yellow-400',
    };
  }
  return {
    color: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
    label: 'Down',
    badgeVariant: 'destructive' as const,
    textColor: 'text-red-600 dark:text-red-400',
  };
}

export function getIncidentConfig(
  severity: 'minor' | 'major' | 'critical',
  status: 'ongoing' | 'resolved'
) {
  const severityConfig = {
    minor: {
      color: 'bg-yellow-500/10 border-yellow-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      badgeVariant: 'secondary' as const,
    },
    major: {
      color: 'bg-orange-500/10 border-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'destructive' as const,
    },
    critical: {
      color: 'bg-red-500/10 border-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
      badgeVariant: 'destructive' as const,
    },
  };

  const statusConfig = {
    ongoing: {
      icon: '🔍',
      label: 'Ongoing',
    },
    resolved: {
      icon: '✅',
      label: 'Resolved',
    },
  };

  return {
    ...severityConfig[severity],
    ...statusConfig[status],
  };
}
