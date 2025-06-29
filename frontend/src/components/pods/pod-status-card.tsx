import { CheckCircle, Clock, XCircle, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PodStatus } from '@/services/podApi';

interface PodStatusCardProps {
    pod: PodStatus;
    className?: string;
}

const getStatusVariant = (status: string, ready: boolean): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'Running' && ready) return 'default';
    if (status === 'Running' && !ready) return 'secondary';
    if (status === 'Failed' || status.includes('Error')) return 'destructive';
    return 'outline';
};

const getStatusIcon = (status: string, ready: boolean) => {
    const className = "h-4 w-4";

    if (status === 'Running' && ready) return <CheckCircle className={cn(className, "text-green-600")} />;
    if (status === 'Running' && !ready) return <Clock className={cn(className, "text-yellow-600")} />;
    if (status === 'Pending') return <Clock className={cn(className, "text-blue-600")} />;
    if (status === 'Failed' || status.includes('Error')) return <XCircle className={cn(className, "text-red-600")} />;
    return <AlertTriangle className={cn(className, "text-gray-600")} />;
};

export function PodStatusCard({ pod, className }: PodStatusCardProps) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-medium">{pod.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{pod.namespace}</span>
                            <span>•</span>
                            <span>{pod.age}</span>
                        </div>
                    </div>
                    <Badge variant={getStatusVariant(pod.status, pod.ready)} className="flex items-center gap-1">
                        {getStatusIcon(pod.status, pod.ready)}
                        {pod.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Ready:</span>
                        <span className={pod.ready ? "text-green-600" : "text-red-600"}>
              {pod.ready ? 'Yes' : 'No'}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Restarts:</span>
                        <span className={pod.restarts > 0 ? "text-yellow-600" : ""}>
              {pod.restarts}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Phase:</span>
                        <span>{pod.phase}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Node:</span>
                        <span className="truncate">{pod.nodeName || 'N/A'}</span>
                    </div>
                </div>

                {/* Application */}
                {pod.application && (
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
              <span className="text-muted-foreground">App:</span> {pod.application}
            </span>
                    </div>
                )}

                {/* Pod IP */}
                {pod.podIP && (
                    <div className="text-sm">
                        <span className="text-muted-foreground">IP:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{pod.podIP}</code>
                    </div>
                )}

                {/* Recent Events */}
                {pod.events && pod.events.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recent Events</h4>
                        <div className="space-y-1">
                            {pod.events.slice(0, 2).map((event, index) => (
                                <div key={index} className="text-xs p-2 bg-muted/50 rounded border-l-2 border-l-blue-500">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                            {event.type}
                                        </Badge>
                                        <span className="font-medium">{event.reason}</span>
                                    </div>
                                    <p className="text-muted-foreground leading-tight">{event.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Container Status */}
                {pod.containerStatuses && pod.containerStatuses.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Containers</h4>
                        <div className="space-y-1">
                            {pod.containerStatuses.map((container, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                    <span className="font-medium">{container.name}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={container.ready ? "default" : "secondary"} className="text-xs">
                                            {container.state}
                                        </Badge>
                                        {container.restartCount > 0 && (
                                            <span className="text-muted-foreground">
                        {container.restartCount} restarts
                      </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}