import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
} from "lucide-react";
import { useState } from "react";
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
          label: "Success",
          text: "text-emerald-600 dark:text-emerald-400",
          dot: "bg-emerald-500",
        };
      case "FAILED":
        return {
          label: "Failed",
          text: "text-red-600 dark:text-red-400",
          dot: "bg-red-500",
        };
      case "PARTIAL":
        return {
          label: "Partial",
          text: "text-amber-600 dark:text-amber-400",
          dot: "bg-amber-500",
        };
      case "RUNNING":
        return {
          label: "Running",
          text: "text-blue-600 dark:text-blue-400",
          dot: "bg-blue-500 animate-pulse",
        };
      case "PENDING":
        return {
          label: "Pending",
          text: "text-muted-foreground",
          dot: "bg-muted-foreground",
        };
      default:
        return {
          label: "Unknown",
          text: "text-muted-foreground",
          dot: "bg-muted-foreground",
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
      <div className="relative rounded-2xl border border-cyan-500/20 bg-card/70 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="relative flex items-center justify-between p-4">
          <div>
            <h3 className="text-sm font-medium">Sync History</h3>
            <p className="text-xs text-muted-foreground">Loading recent runs</p>
          </div>
        </div>
        <div className="relative border-t border-border/60 p-8">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sync history...
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!syncLogs || syncLogs.length === 0) {
    return (
      <div className="relative rounded-2xl border border-cyan-500/20 bg-card/70 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="relative flex items-center justify-between p-4">
          <div>
            <h3 className="text-sm font-medium">Sync History</h3>
            <p className="text-xs text-muted-foreground">Recent activity will appear here</p>
          </div>
        </div>
        <div className="relative border-t border-border/60 p-8 text-center">
          <Clock className="h-6 w-6 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No sync history yet</p>
          <p className="text-xs text-muted-foreground">
            Sync logs will appear after the first run.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-cyan-500/20 bg-card/70 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
      <div className="relative flex items-center justify-between p-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400">RECENT RUNS</span>
          </div>
          <h3 className="text-sm font-medium">Sync History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {paginatedLogs.length} of {displayedLogs.length} recent sync
            {displayedLogs.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Success
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Partial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Failed
          </span>
        </div>
      </div>

      <div className="relative border-t border-border/60 divide-y divide-border/60">
        {paginatedLogs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const errors = parseErrors(log.errors);
          const hasErrors = errors.length > 0;
          const status = getStatusConfig(log.status);

          return (
            <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-2 text-xs font-medium", status.text)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.startedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFullDate(log.startedAt)}
                  </p>
                </div>

                {hasErrors && (
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    aria-label={isExpanded ? "Hide error details" : "Show error details"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Synced</p>
                  <p className="text-sm font-medium">{log.recordsSynced.toLocaleString()}</p>
                </div>
                <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Failed</p>
                  <p className={cn("text-sm font-medium", log.recordsFailed > 0 && "text-red-600 dark:text-red-400")}>
                    {log.recordsFailed.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Duration</p>
                  <p className="text-sm font-medium">
                    {calculateDuration(log.startedAt, log.completedAt)}
                  </p>
                </div>
              </div>

              {(log.triggeredBy || log.direction) && (
                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-3">
                  {log.triggeredBy && <span>Triggered by: {log.triggeredBy}</span>}
                  {log.direction && <span>Direction: {log.direction}</span>}
                </div>
              )}

              {isExpanded && hasErrors && (
                <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                      Error Details ({errors.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {errors.map((error, errorIndex) => (
                      <div
                        key={errorIndex}
                        className="rounded-md border border-red-200/70 dark:border-red-500/30 bg-red-50/50 dark:bg-red-950/20 px-3 py-2"
                      >
                        {error.record && (
                          <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mb-1">
                            Record: <span className="font-medium">{error.record}</span>
                          </p>
                        )}
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {error.error || error.message || "Unknown error"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md border transition-colors",
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed border-border/60"
                  : "border-border hover:bg-muted/50"
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md border transition-colors",
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed border-border/60"
                  : "border-border hover:bg-muted/50"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
