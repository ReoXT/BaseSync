import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../utils";

// ============================================================================
// Types
// ============================================================================

export interface SyncLog {
  id: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
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
 * Displays a table of recent sync attempts with:
 * - Date/Time
 * - Duration
 * - Records Synced
 * - Status (Success, Failed, Partial)
 * - Expandable row for error details
 * - Pagination if many logs
 *
 * Uses existing OpenSaaS table styling
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

  // Get status badge component
  const getStatusBadge = (status: SyncLog["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
            <CheckCircle2 className="size-3" />
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
            <XCircle className="size-3" />
            Failed
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-3" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3" />
            Unknown
          </span>
        );
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!syncLogs || syncLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No sync history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sync logs will appear here after the first sync runs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sync History</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing {paginatedLogs.length} of {displayedLogs.length} recent sync
          {displayedLogs.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Records Synced
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {/* Expand toggle column */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const errors = parseErrors(log.errors);
                const hasErrors = errors.length > 0;

                return (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">
                      {formatDateTime(log.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {calculateDuration(log.startedAt, log.completedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground font-medium">
                          {log.recordsSynced}
                        </span>
                        {log.recordsFailed > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {log.recordsFailed} failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3">
                      {hasErrors && (
                        <button
                          onClick={() => toggleExpanded(log.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={isExpanded ? "Hide details" : "Show details"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Expanded Error Details */}
          {expandedLogId && (
            <div className="border-t bg-muted/30 p-4">
              {paginatedLogs
                .filter((log) => log.id === expandedLogId)
                .map((log) => {
                  const errors = parseErrors(log.errors);
                  return (
                    <div key={log.id} className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Error Details ({errors.length}{" "}
                        {errors.length === 1 ? "error" : "errors"})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {errors.map((error, index) => (
                          <div
                            key={index}
                            className="bg-card border border-border rounded-md p-3 text-sm"
                          >
                            {error.record && (
                              <p className="text-muted-foreground mb-1">
                                Record: <span className="font-mono">{error.record}</span>
                              </p>
                            )}
                            <p className="text-foreground">{error.error || error.message || "Unknown error"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {paginatedLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const errors = parseErrors(log.errors);
            const hasErrors = errors.length > 0;

            return (
              <div key={log.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(log.startedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: {calculateDuration(log.startedAt, log.completedAt)}
                    </p>
                  </div>
                  {getStatusBadge(log.status)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Records: </span>
                    <span className="font-medium text-foreground">
                      {log.recordsSynced}
                    </span>
                    {log.recordsFailed > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400 ml-2">
                        ({log.recordsFailed} failed)
                      </span>
                    )}
                  </div>

                  {hasErrors && (
                    <button
                      onClick={() => toggleExpanded(log.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Error Details (Mobile) */}
                {isExpanded && hasErrors && (
                  <div className="pt-3 border-t space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Error Details ({errors.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {errors.map((error, index) => (
                        <div
                          key={index}
                          className="bg-muted/50 rounded-md p-2 text-xs"
                        >
                          {error.record && (
                            <p className="text-muted-foreground mb-1">
                              Record: <span className="font-mono">{error.record}</span>
                            </p>
                          )}
                          <p className="text-foreground">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1 text-sm rounded-md border transition-colors",
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted"
                )}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1 text-sm rounded-md border transition-colors",
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted"
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
