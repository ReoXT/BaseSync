// @ts-nocheck
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  Edit,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
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
import { SyncHistory } from "../components/SyncHistory";
import { cn } from "../utils";

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
  const [showConfig, setShowConfig] = useState(false);

  const {
    data: syncConfig,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery(getSyncConfigById, { syncConfigId: id || "" }, { enabled: !!id });

  const {
    data: syncLogs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery(getSyncLogs, { syncConfigId: id || "", limit: 50 }, { enabled: !!id });

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

  const handleSyncNow = async () => {
    if (!id) return;
    setIsSyncing(true);
    setActionError(null);
    try {
      await triggerManualSync({ syncConfigId: id });
      setTimeout(() => {
        refetchLogs();
        refetchConfig();
      }, 1000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to trigger sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !syncConfig) return;
    setIsToggling(true);
    setActionError(null);
    try {
      await toggleSyncActive({ syncConfigId: id, isActive: !syncConfig.isActive });
      refetchConfig();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to toggle sync");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteSyncConfig({ syncConfigId: id });
      navigate("/dashboard", { state: { successMessage: "Sync deleted successfully" } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete sync");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case "AIRTABLE_TO_SHEETS": return "Airtable → Sheets";
      case "SHEETS_TO_AIRTABLE": return "Sheets → Airtable";
      case "BIDIRECTIONAL": return "Bidirectional";
      default: return direction;
    }
  };

  const getConflictLabel = (resolution: string) => {
    switch (resolution) {
      case "AIRTABLE_WINS": return "Airtable wins";
      case "SHEETS_WINS": return "Sheets wins";
      case "NEWEST_WINS": return "Newest wins";
      default: return resolution;
    }
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleString();

  const syncStats = syncLogs?.reduce(
    (acc: any, log: SyncLog) => {
      if (log.status === "SUCCESS") acc.success++;
      if (log.status === "FAILED") acc.failed++;
      acc.totalRecords += log.recordsSynced;
      return acc;
    },
    { success: 0, failed: 0, totalRecords: 0 }
  ) || { success: 0, failed: 0, totalRecords: 0 };

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configError || !syncConfig) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {configError instanceof Error ? configError.message : "Sync not found"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard")} className="mt-4" variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const mappedFieldsCount = Object.keys(syncConfig.fieldMappings || {}).length;

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{syncConfig.name}</h1>
              {syncConfig.isActive ? (
                <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Paused
                </span>
              )}
            </div>
            {syncConfig.lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                Last synced {formatDate(syncConfig.lastSyncAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing || !syncConfig.isActive}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Sync Now</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isToggling}>
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : syncConfig.isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/sync/${id}/edit`)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {actionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Records Synced</p>
            <p className="text-2xl font-bold">{syncStats.totalRecords.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold">
              {syncStats.success + syncStats.failed > 0
                ? Math.round((syncStats.success / (syncStats.success + syncStats.failed)) * 100)
                : 0}%
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Syncs</p>
            <p className="text-2xl font-bold">{syncLogs?.length || 0}</p>
          </div>
        </div>

        {/* Connection Summary */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <img src="/airtable-icon.svg" alt="" className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">Airtable</span>
              </div>
              <p className="font-medium truncate">{syncConfig.airtableTableName || syncConfig.airtableTableId}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <img src="/google-sheets-icon.svg" alt="" className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">Google Sheets</span>
              </div>
              <p className="font-medium truncate">{syncConfig.googleSheetName || syncConfig.googleSheetId}</p>
            </div>
          </div>
        </div>

        {/* Configuration - Progressive Disclosure */}
        <div className="rounded-lg border border-border">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">Configuration Details</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showConfig && "rotate-180")} />
          </button>

          {showConfig && (
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground w-40">Direction</td>
                    <td className="px-4 py-3 font-medium">{getDirectionLabel(syncConfig.syncDirection)}</td>
                  </tr>
                  {syncConfig.syncDirection === "BIDIRECTIONAL" && (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground">Conflicts</td>
                      <td className="px-4 py-3 font-medium">{getConflictLabel(syncConfig.conflictResolution)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Fields Mapped</td>
                    <td className="px-4 py-3 font-medium">{mappedFieldsCount}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Frequency</td>
                    <td className="px-4 py-3 font-medium">Every 5 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Created</td>
                    <td className="px-4 py-3 font-medium">{formatDate(syncConfig.createdAt)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Field Mappings */}
              {mappedFieldsCount > 0 && (
                <div className="border-t border-border p-4">
                  <p className="text-xs text-muted-foreground mb-3">Field Mappings</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(syncConfig.fieldMappings || {}).map(([fieldId, columnIndex]) => (
                      <span
                        key={fieldId}
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-muted"
                      >
                        <span className="truncate max-w-[120px]">{fieldId}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono font-bold">
                          {String.fromCharCode(65 + ((columnIndex as number) % 26))}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync History */}
        <SyncHistory syncLogs={syncLogs || []} isLoading={isLoadingLogs} limit={50} />

        {/* Delete Zone - Progressive Disclosure */}
        <div className="rounded-lg border border-border p-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-muted-foreground hover:text-red-600 transition-colors"
            >
              Delete this sync...
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
