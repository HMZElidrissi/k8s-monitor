import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Application } from '@/services/podApi';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  const healthPercentage = application.summary.totalPods > 0
      ? Math.round((application.summary.readyPods / application.summary.totalPods) * 100)
      : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deployment':
        return '🚀';
      case 'statefulset':
        return '🗄️';
      case 'daemonset':
        return '👥';
      case 'job':
        return '⚡';
      case 'cronjob':
        return '⏰';
      default:
        return '📦';
    }
  };

  return (
      <Card
          className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              onClick && 'hover:scale-[1.02]'
          )}
          onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{getTypeIcon(application.type)}</span>
                {application.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{application.namespace}</span>
                {application.version && (
                    <>
                      <span>•</span>
                      <span>v{application.version}</span>
                    </>
                )}
              </div>
            </div>
            <Badge
                variant="outline"
                className={cn('capitalize', getStatusColor(application.status))}
            >
              {getStatusIcon(application.status)} {application.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Health Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Health</span>
              <span className="font-medium">{healthPercentage}%</span>
            </div>
            <Progress
                value={healthPercentage}
                className={cn(
                    'h-2',
                    healthPercentage >= 80 ? 'text-green-600' :
                        healthPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                )}
            />
          </div>

          {/* Pods Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Running</span>
                <span className="font-medium text-green-600">
                {application.summary.runningPods}
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ready</span>
                <span className="font-medium text-blue-600">
                {application.summary.readyPods}
              </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                {application.summary.totalPods}
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restarts</span>
                <span className={cn(
                    'font-medium',
                    application.summary.restartCount > 5 ? 'text-red-600' :
                        application.summary.restartCount > 0 ? 'text-yellow-600' : 'text-green-600'
                )}>
                {application.summary.restartCount}
              </span>
              </div>
            </div>
          </div>

          {/* Services */}
          {application.services && application.services.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>🌐</span>
                  <span>{application.services.length} service(s)</span>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
}