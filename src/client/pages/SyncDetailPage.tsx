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
  Activity,
  TrendingUp,
  Zap,
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
import { SyncHistory } from "../components/SyncHistory";

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

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Calculate sync stats
  const syncStats = syncLogs?.reduce(
    (acc: any, log: SyncLog) => {
      if (log.status === "SUCCESS") acc.success++;
      if (log.status === "FAILED") acc.failed++;
      acc.totalRecords += log.recordsSynced;
      return acc;
    },
    { success: 0, failed: 0, totalRecords: 0 }
  ) || { success: 0, failed: 0, totalRecords: 0 };

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
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
    <div className="relative min-h-screen pb-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl animate-pulse-slower" />
      </div>

      <div className="container mx-auto py-8 space-y-6">
        {/* Header with gradient card */}
        <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-orange-500/5" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-gradient-sync">
                    {syncConfig.name}
                  </h1>
                  {syncConfig.isActive ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Paused</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created {formatDate(syncConfig.createdAt)}
                  </div>
                  {syncConfig.lastSyncAt && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Last synced {formatDate(syncConfig.lastSyncAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={isSyncing || !syncConfig.isActive}
                  className="border-cyan-500/20 hover:bg-cyan-500/5"
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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="group relative rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-4 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Records</span>
                </div>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{syncStats.totalRecords.toLocaleString()}</p>
              </div>

              <div className="group relative rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {syncStats.success + syncStats.failed > 0
                    ? Math.round((syncStats.success / (syncStats.success + syncStats.failed)) * 100)
                    : 0}%
                </p>
              </div>

              <div className="group relative rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-4 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Syncs</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{syncLogs?.length || 0}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Error */}
        {actionError && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {/* Connection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Airtable Source */}
          <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm overflow-hidden group hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-md">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Airtable Source</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Origin Database</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Base</p>
                <p className="font-semibold">{syncConfig.airtableTableName || "Unknown Base"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Table ID</p>
                <p className="text-sm font-mono text-muted-foreground bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded border border-orange-200 dark:border-orange-500/20">
                  {syncConfig.airtableTableId}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Sheets Destination */}
          <Card className="border-green-500/20 bg-card/50 backdrop-blur-sm overflow-hidden group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Sheets Target</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Destination Spreadsheet</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sheet</p>
                <p className="font-semibold">{syncConfig.googleSheetName || "Unknown Sheet"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sheet ID</p>
                <p className="text-sm font-mono text-muted-foreground bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded border border-green-200 dark:border-green-500/20">
                  {syncConfig.googleSheetId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Configuration */}
        <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm animate-fade-in-delayed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Table className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle>Sync Configuration</CardTitle>
                <CardDescription>Data flow settings and field mappings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sync Direction</p>
                <div className="flex items-center gap-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 rounded-lg p-3">
                  <div className="text-cyan-600 dark:text-cyan-400">
                    {syncDirection.icon}
                  </div>
                  <span className="font-medium">{syncDirection.text}</span>
                </div>
              </div>

              {syncConfig.syncDirection === "BIDIRECTIONAL" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Conflict Resolution</p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                    <p className="font-medium">
                      {getConflictResolutionDisplay(syncConfig.conflictResolution)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Field Mappings</p>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{mappedFieldsCount}</p>
                  <p className="text-xs text-muted-foreground">fields mapped</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Mapped Fields</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {Object.entries(syncConfig.fieldMappings || {}).map(([fieldId, columnIndex]) => (
                  <div
                    key={fieldId}
                    className="group flex items-center justify-between bg-muted/50 hover:bg-muted border border-border/50 hover:border-cyan-500/20 rounded-lg p-3 transition-all duration-200"
                  >
                    <span className="text-sm truncate">{fieldId}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                      <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-500/20">
                        {String.fromCharCode(65 + ((columnIndex as number) % 26))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <div className="animate-fade-in-delayed-more">
          <SyncHistory
            syncLogs={syncLogs || []}
            isLoading={isLoadingLogs}
            limit={50}
          />
        </div>

        {/* Back Button */}
        <div className="flex justify-start animate-fade-in-delayed-more">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-cyan-500/20 hover:bg-cyan-500/5"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
