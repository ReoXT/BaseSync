import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../utils";

// ============================================================================
// Types
// ============================================================================

export interface SyncLog {
  id: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING" | "PENDING";
  recordsSynced: number;
  recordsFailed: number;
  errors: string | null;
  startedAt: Date | string;
  completedAt: Date | string | null;
  triggeredBy?: string | null;
  direction?: string | null;
}

export interface SyncHistoryProps {
  /** Array of sync logs to display */
  syncLogs: SyncLog[];
  /** Whether the logs are loading */
  isLoading?: boolean;
  /** Maximum number of logs to display (default: 50) */
  limit?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SyncHistory Component
 *
 * Displays a timeline of recent sync attempts with light, modern aesthetic
 */
export function SyncHistory({
  syncLogs,
  isLoading = false,
  limit = 50,
}: SyncHistoryProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Pagination
  const displayedLogs = syncLogs.slice(0, limit);
  const totalPages = Math.ceil(displayedLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = displayedLogs.slice(startIndex, endIndex);

  // Toggle expanded log
  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // Format date/time
  const formatDateTime = (date: Date | string): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  // Format full date
  const formatFullDate = (date: Date | string): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  // Calculate duration
  const calculateDuration = (
    startedAt: Date | string,
    completedAt: Date | string | null
  ): string => {
    if (!completedAt) return "In progress";

    try {
      const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
      const end = typeof completedAt === "string" ? new Date(completedAt) : completedAt;
      const durationMs = end.getTime() - start.getTime();
      const seconds = Math.floor(durationMs / 1000);

      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } catch {
      return "Unknown";
    }
  };

  // Get status config
  const getStatusConfig = (status: SyncLog["status"]) => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: "Success",
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
          borderColor: "border-emerald-200 dark:border-emerald-500/20",
          dotColor: "bg-emerald-500",
          timelineColor: "bg-emerald-200 dark:bg-emerald-500/20",
        };
      case "FAILED":
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: "Failed",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-500/20",
          dotColor: "bg-red-500",
          timelineColor: "bg-red-200 dark:bg-red-500/20",
        };
      case "PARTIAL":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          label: "Partial",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-500/20",
          dotColor: "bg-amber-500",
          timelineColor: "bg-amber-200 dark:bg-amber-500/20",
        };
      case "RUNNING":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          label: "Running",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-500/20",
          dotColor: "bg-blue-500 animate-pulse",
          timelineColor: "bg-blue-200 dark:bg-blue-500/20",
        };
      case "PENDING":
        return {
          icon: <Clock className="h-5 w-5" />,
          label: "Pending",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-800/50",
          borderColor: "border-gray-200 dark:border-gray-700",
          dotColor: "bg-gray-400",
          timelineColor: "bg-gray-200 dark:bg-gray-700",
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          label: "Unknown",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-800/50",
          borderColor: "border-gray-200 dark:border-gray-700",
          dotColor: "bg-gray-400",
          timelineColor: "bg-gray-200 dark:bg-gray-700",
        };
    }
  };

  // Parse errors JSON
  const parseErrors = (errorsJson: string | null): any[] => {
    if (!errorsJson) return [];
    try {
      return JSON.parse(errorsJson);
    } catch {
      return [];
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle>Sync History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <p className="text-sm text-muted-foreground">Loading sync history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!syncLogs || syncLogs.length === 0) {
    return (
      <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle>Sync History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground mb-2">No sync history yet</p>
            <p className="text-sm text-muted-foreground">
              Sync logs will appear here after the first sync runs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle>Sync History</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {paginatedLogs.length} of {displayedLogs.length} recent sync
                {displayedLogs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Failed</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative p-6">
        {/* Timeline */}
        <div className="space-y-0">
          {paginatedLogs.map((log, index) => {
            const isExpanded = expandedLogId === log.id;
            const errors = parseErrors(log.errors);
            const hasErrors = errors.length > 0;
            const status = getStatusConfig(log.status);
            const isLast = index === paginatedLogs.length - 1;

            return (
              <div key={log.id} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[27px] top-14 w-0.5 h-full",
                      status.timelineColor
                    )}
                  />
                )}

                {/* Timeline item */}
                <div className="relative flex gap-6 pb-6">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center border-2 shadow-sm",
                        status.bgColor,
                        status.borderColor
                      )}
                    >
                      <div className={status.color}>{status.icon}</div>
                    </div>
                    <div
                      className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full",
                        status.dotColor
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "group border rounded-xl p-4 transition-all duration-200",
                        status.borderColor,
                        status.bgColor,
                        hasErrors ? "cursor-pointer hover:shadow-md" : "",
                      )}
                      onClick={() => hasErrors && toggleExpanded(log.id)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn("text-sm font-bold uppercase tracking-wider", status.color)}>
                              {status.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(log.startedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatFullDate(log.startedAt)}
                          </p>
                        </div>

                        {hasErrors && (
                          <button
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              "hover:bg-muted/50"
                            )}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                              Synced
                            </span>
                          </div>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {log.recordsSynced.toLocaleString()}
                          </p>
                        </div>

                        {log.recordsFailed > 0 && (
                          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Failed
                              </span>
                            </div>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                              {log.recordsFailed.toLocaleString()}
                            </p>
                          </div>
                        )}

                        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                              Duration
                            </span>
                          </div>
                          <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                            {calculateDuration(log.startedAt, log.completedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      {(log.triggeredBy || log.direction) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.triggeredBy && (
                            <span>Triggered by: {log.triggeredBy}</span>
                          )}
                          {log.direction && (
                            <span>Direction: {log.direction}</span>
                          )}
                        </div>
                      )}

                      {/* Expanded Error Details */}
                      {isExpanded && hasErrors && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-accordion-down">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                              Error Details ({errors.length})
                            </span>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {errors.map((error, errorIndex) => (
                              <div
                                key={errorIndex}
                                className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-lg p-3"
                              >
                                {error.record && (
                                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-2">
                                    Record: <span className="font-medium text-red-600 dark:text-red-400">{error.record}</span>
                                  </p>
                                )}
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  {error.error || error.message || "Unknown error"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg border transition-all duration-200",
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed border-border/50"
                    : "border-cyan-500/20 hover:bg-cyan-500/5 hover:border-cyan-500/40"
                )}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg border transition-all duration-200",
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed border-border/50"
                    : "border-cyan-500/20 hover:bg-cyan-500/5 hover:border-cyan-500/40"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
