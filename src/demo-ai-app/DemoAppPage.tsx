import {
  getAirtableConnectionStatus,
  getGoogleConnectionStatus,
  getUserSyncConfigs,
  useQuery,
  initiateAirtableAuth,
  initiateGoogleAuth,
  disconnectAirtable,
  disconnectGoogle,
} from "wasp/client/operations";

import {
  CheckCircle2,
  XCircle,
  Database,
  Sheet,
  RefreshCw,
  AlertCircle,
  ArrowLeftRight,
  Clock,
  Activity,
  Unplug,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../client/components/ui/card";

export default function DemoAppPage() {
  const navigate = useNavigate();
  const { data: airtableStatus, isLoading: airtableLoading } = useQuery(getAirtableConnectionStatus);
  const { data: googleStatus, isLoading: googleLoading } = useQuery(getGoogleConnectionStatus);
  const { data: syncConfigs, isLoading: syncConfigsLoading } = useQuery(getUserSyncConfigs);

  const bothConnected = airtableStatus?.isConnected && googleStatus?.isConnected;
  const isLoading = airtableLoading || googleLoading || syncConfigsLoading;

  // Calculate stats from actual sync configs
  const activeSyncsCount = syncConfigs?.filter(config => config.isActive).length || 0;
  const totalSyncsCount = syncConfigs?.length || 0;
  const lastSyncTime = syncConfigs
    ?.filter(config => config.lastSyncAt)
    .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())[0]?.lastSyncAt;

  const formatLastSync = (date: Date | string | null | undefined) => {
    if (!date) return 'Never';
    const dateObj = date instanceof Date ? date : new Date(date);
    const diffMs = Date.now() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            BaseSync <span className="text-primary">Dashboard</span>
          </h2>
        </div>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg leading-8">
          Seamlessly sync data between Airtable and Google Sheets
        </p>

        {/* Connection Status Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <AirtableConnectionCard status={airtableStatus} isLoading={airtableLoading} />
          <GoogleSheetsConnectionCard status={googleStatus} isLoading={googleLoading} />
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12">
          <h3 className="text-foreground mb-6 text-2xl font-bold">
            Quick Stats
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard
              icon={<ArrowLeftRight className="size-6" />}
              title="Active Syncs"
              value={activeSyncsCount.toString()}
              description="Sync configurations"
              isLoading={isLoading}
            />
            <StatCard
              icon={<Activity className="size-6" />}
              title="Total Syncs"
              value={totalSyncsCount.toString()}
              description="Sync configurations"
              isLoading={isLoading}
            />
            <StatCard
              icon={<Clock className="size-6" />}
              title="Last Sync"
              value={formatLastSync(lastSyncTime)}
              description="Most recent sync"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Active Sync Configurations */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-foreground text-2xl font-bold">
              Sync Configurations
            </h3>
            <Button disabled={!bothConnected || isLoading} onClick={() => navigate('/sync/new')}>
              + New Sync
            </Button>
          </div>
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <RefreshCw className="size-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : syncConfigs && syncConfigs.length > 0 ? (
            <SyncConfigsList syncConfigs={syncConfigs} />
          ) : (
            <EmptySyncConfigsList bothConnected={bothConnected} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

function AirtableConnectionCard({
  status,
  isLoading
}: {
  status: { isConnected: boolean; accountId?: string } | undefined;
  isLoading: boolean;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await initiateAirtableAuth();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (error: any) {
      console.error("Failed to initiate Airtable auth:", error);
      alert("Failed to connect to Airtable. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Airtable account? This will remove all sync configurations using this connection.")) {
      return;
    }
    try {
      setIsDisconnecting(true);
      const result = await disconnectAirtable();
      if (!result.success) {
        alert(result.error || "Failed to disconnect Airtable.");
      }
    } catch (error: any) {
      console.error("Failed to disconnect Airtable:", error);
      alert("Failed to disconnect Airtable. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-11.5 w-11.5 bg-muted flex items-center justify-center rounded-full">
            <Database className="size-6 text-orange-600" />
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </div>
          ) : status?.isConnected ? (
            <CheckCircle2 className="size-6 text-success" />
          ) : (
            <XCircle className="size-6 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-2">Airtable</CardTitle>
        <CardDescription className="mb-4">
          {isLoading
            ? "Checking connection..."
            : status?.isConnected
            ? status.accountId
              ? `Connected to account ${status.accountId}`
              : "Connected"
            : "Not connected"}
        </CardDescription>
        {!status?.isConnected && !isLoading && (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="w-full"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Airtable"
            )}
          </Button>
        )}
        {status?.isConnected && (
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            {isDisconnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function GoogleSheetsConnectionCard({
  status,
  isLoading
}: {
  status: { isConnected: boolean; googleAccountEmail?: string } | undefined;
  isLoading: boolean;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await initiateGoogleAuth();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (error: any) {
      console.error("Failed to initiate Google auth:", error);
      alert("Failed to connect to Google Sheets. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Sheets account? This will remove all sync configurations using this connection.")) {
      return;
    }
    try {
      setIsDisconnecting(true);
      const result = await disconnectGoogle();
      if (!result.success) {
        alert(result.error || "Failed to disconnect Google Sheets.");
      }
    } catch (error: any) {
      console.error("Failed to disconnect Google Sheets:", error);
      alert("Failed to disconnect Google Sheets. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-11.5 w-11.5 bg-muted flex items-center justify-center rounded-full">
            <Sheet className="size-6 text-green-600" />
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </div>
          ) : status?.isConnected ? (
            <CheckCircle2 className="size-6 text-success" />
          ) : (
            <XCircle className="size-6 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-2">Google Sheets</CardTitle>
        <CardDescription className="mb-4">
          {isLoading
            ? "Checking connection..."
            : status?.isConnected
            ? status.googleAccountEmail || "Connected"
            : "Not connected"}
        </CardDescription>
        {!status?.isConnected && !isLoading && (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="w-full"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google Sheets"
            )}
          </Button>
        )}
        {status?.isConnected && (
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            {isDisconnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="h-11.5 w-11.5 bg-muted flex items-center justify-center rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-16 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            <h4 className="text-title-md text-foreground font-bold">{value}</h4>
            <span className="text-muted-foreground text-sm font-medium">
              {title}
            </span>
            <p className="text-muted-foreground text-xs mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SyncConfigsList({ syncConfigs }: { syncConfigs: any[] }) {
  const navigate = useNavigate();

  const getSyncDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'AIRTABLE_TO_SHEETS':
        return 'Airtable → Sheets';
      case 'SHEETS_TO_AIRTABLE':
        return 'Sheets → Airtable';
      case 'BIDIRECTIONAL':
        return 'Two-way';
      default:
        return direction;
    }
  };

  return (
    <div className="space-y-4">
      {syncConfigs.map((config) => (
        <Card key={config.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/sync/${config.id}`)}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-foreground font-semibold text-lg mb-2">{config.name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Database className="size-4 text-orange-600" />
                    {config.airtableTableName || 'Airtable Table'}
                  </span>
                  <ArrowLeftRight className="size-4" />
                  <span className="flex items-center gap-1">
                    <Sheet className="size-4 text-green-600" />
                    {config.googleSheetName || 'Google Sheet'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ArrowLeftRight className="size-3" />
                    {getSyncDirectionLabel(config.syncDirection)}
                  </span>
                  {config.lastSyncAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Last synced {new Date(config.lastSyncAt).toLocaleDateString()}
                    </span>
                  )}
                  {config.lastSyncStatus && (
                    <span className="flex items-center gap-1">
                      {config.lastSyncStatus === 'success' ? '✓' : '⚠️'} {config.lastSyncStatus}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.isActive ? (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">Active</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2 py-1 rounded">Paused</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptySyncConfigsList({
  bothConnected,
  isLoading
}: {
  bothConnected: boolean | undefined;
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-foreground text-lg font-semibold mb-2">
          No sync configurations yet
        </h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {bothConnected
            ? "You're all set! Click the button below to create your first sync."
            : "Connect both Airtable and Google Sheets to start creating sync configurations."}
        </p>
        <Button disabled={!bothConnected || isLoading} variant="outline" onClick={() => navigate('/sync/new')}>
          Create Your First Sync
        </Button>
      </CardContent>
    </Card>
  );
}
