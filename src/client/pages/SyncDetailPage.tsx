// @ts-nocheck
// Type checking disabled temporarily until Wasp regenerates types
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Edit,
  FileSpreadsheet,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Table,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteSyncConfig,
  getSyncConfigById,
  getSyncLogs,
  toggleSyncActive,
  triggerManualSync,
  useQuery,
} from "wasp/client/operations";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

interface SyncLog {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  recordsSynced: number;
  recordsFailed: number;
  errors: string | null;
  triggeredBy: string | null;
  direction: string | null;
}

export default function SyncDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch sync configuration
  const {
    data: syncConfig,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery(getSyncConfigById, { syncConfigId: id || "" }, { enabled: !!id });

  // Fetch sync logs
  const {
    data: syncLogs,
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery(getSyncLogs, { syncConfigId: id || "", limit: 50 }, { enabled: !!id });

  // Auto-refresh logs every 10 seconds if a sync is running
  useEffect(() => {
    if (!syncConfig) return;

    const hasRunningSyncs = syncLogs?.some(
      (log: SyncLog) => log.status === "RUNNING" || log.status === "PENDING"
    );

    if (hasRunningSyncs) {
      const interval = setInterval(() => {
        refetchLogs();
        refetchConfig();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [syncLogs, syncConfig, refetchLogs, refetchConfig]);

  // Handle manual sync trigger
  const handleSyncNow = async () => {
    if (!id) return;

    setIsSyncing(true);
    setActionError(null);

    try {
      await triggerManualSync({ syncConfigId: id });
      // Refetch logs to show the new sync
      setTimeout(() => {
        refetchLogs();
        refetchConfig();
      }, 1000);
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      setActionError(error instanceof Error ? error.message : "Failed to trigger sync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle pause/resume
  const handleToggleActive = async () => {
    if (!id || !syncConfig) return;

    setIsToggling(true);
    setActionError(null);

    try {
      await toggleSyncActive({
        syncConfigId: id,
        isActive: !syncConfig.isActive,
      });
      refetchConfig();
    } catch (error) {
      console.error("Failed to toggle sync:", error);
      setActionError(error instanceof Error ? error.message : "Failed to toggle sync");
    } finally {
      setIsToggling(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteSyncConfig({ syncConfigId: id });
      navigate("/dashboard", {
        state: { successMessage: "Sync configuration deleted successfully" },
      });
    } catch (error) {
      console.error("Failed to delete sync:", error);
      setActionError(error instanceof Error ? error.message : "Failed to delete sync");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Format sync direction
  const getSyncDirectionDisplay = (direction: string) => {
    switch (direction) {
      case "AIRTABLE_TO_SHEETS":
        return {
          icon: <ArrowRight className="h-5 w-5" />,
          text: "Airtable → Google Sheets",
        };
      case "SHEETS_TO_AIRTABLE":
        return {
          icon: <ArrowRight className="h-5 w-5 rotate-180" />,
          text: "Google Sheets → Airtable",
        };
      case "BIDIRECTIONAL":
        return {
          icon: <ArrowLeftRight className="h-5 w-5" />,
          text: "Bidirectional",
        };
      default:
        return { icon: null, text: direction };
    }
  };

  // Format conflict resolution
  const getConflictResolutionDisplay = (resolution: string) => {
    switch (resolution) {
      case "AIRTABLE_WINS":
        return "Airtable always wins";
      case "SHEETS_WINS":
        return "Google Sheets always wins";
      case "NEWEST_WINS":
        return "Newest change wins";
      default:
        return resolution;
    }
  };

  // Format sync status
  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Failed</span>
          </div>
        );
      case "PARTIAL":
        return (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Partial</span>
          </div>
        );
      case "RUNNING":
        return (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Running</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
        );
      default:
        return <span className="text-sm text-muted-foreground">{status}</span>;
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Format duration
  const formatDuration = (startedAt: Date | string, completedAt: Date | string | null) => {
    if (!completedAt) return "In progress";
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (configError || !syncConfig) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {configError instanceof Error ? configError.message : "Sync configuration not found"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const syncDirection = getSyncDirectionDisplay(syncConfig.syncDirection);
  const mappedFieldsCount = Object.keys(syncConfig.fieldMappings || {}).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{syncConfig.name}</h1>
            {syncConfig.isActive ? (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Paused
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Created {formatDate(syncConfig.createdAt)}
            {syncConfig.lastSyncAt && (
              <> • Last synced {formatDate(syncConfig.lastSyncAt)}</>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing || !syncConfig.isActive}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : syncConfig.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sync/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Confirm Delete"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Airtable Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Airtable Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Base</p>
              <p className="font-medium">{syncConfig.airtableTableName || "Unknown Base"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Table ID</p>
              <p className="text-sm font-mono text-muted-foreground">
                {syncConfig.airtableTableId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google Sheets Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Google Sheets Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Sheet</p>
              <p className="font-medium">{syncConfig.googleSheetName || "Unknown Sheet"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sheet ID</p>
              <p className="text-sm font-mono text-muted-foreground">
                {syncConfig.googleSheetId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Table className="h-4 w-4" />
            Sync Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sync Direction</p>
              <div className="flex items-center gap-2">
                {syncDirection.icon}
                <span className="font-medium">{syncDirection.text}</span>
              </div>
            </div>

            {syncConfig.syncDirection === "BIDIRECTIONAL" && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conflict Resolution</p>
                <p className="font-medium">
                  {getConflictResolutionDisplay(syncConfig.conflictResolution)}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Field Mappings</p>
              <p className="font-medium">{mappedFieldsCount} fields</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mapped Fields</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(syncConfig.fieldMappings || {}).map(([fieldId, columnIndex]) => (
                <div
                  key={fieldId}
                  className="text-sm px-3 py-2 bg-muted rounded-md flex items-center justify-between"
                >
                  <span className="truncate">{fieldId}</span>
                  <ArrowRight className="h-3 w-3 mx-2 flex-shrink-0" />
                  <span className="font-mono text-muted-foreground">
                    {String.fromCharCode(65 + ((columnIndex as number) % 26))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
          <CardDescription>Recent sync executions and their results</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {logsError instanceof Error ? logsError.message : "Failed to load sync logs"}
              </AlertDescription>
            </Alert>
          ) : !syncLogs || syncLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No sync history yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sync logs will appear here after the first sync runs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncLogs.map((log: SyncLog) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      {getSyncStatusBadge(log.status)}
                      <p className="text-sm text-muted-foreground">
                        {formatDate(log.startedAt)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        Duration: {formatDuration(log.startedAt, log.completedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Sync Statistics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Synced</p>
                      <p className="font-medium text-green-600">{log.recordsSynced}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-medium text-red-600">{log.recordsFailed}</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {log.errors && (() => {
                    try {
                      const parsedErrors = JSON.parse(log.errors);
                      if (!Array.isArray(parsedErrors) || parsedErrors.length === 0) {
                        return null;
                      }
                      return (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-medium">Errors:</p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs">
                                View error details
                              </summary>
                              <pre className="text-xs mt-2 overflow-auto">
                                {JSON.stringify(parsedErrors, null, 2)}
                              </pre>
                            </details>
                          </AlertDescription>
                        </Alert>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
