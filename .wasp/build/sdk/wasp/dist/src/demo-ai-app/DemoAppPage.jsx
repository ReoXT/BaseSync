import { getAirtableConnectionStatus, getGoogleConnectionStatus, getUserSyncConfigs, useQuery, initiateAirtableAuth, initiateGoogleAuth, disconnectAirtable, disconnectGoogle, sendTestEmails, } from "wasp/client/operations";
import { CheckCircle2, XCircle, RefreshCw, AlertCircle, ArrowLeftRight, Clock, Activity, Unplug, Plus, Zap, TrendingUp, } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../client/components/ui/card";
export default function DemoAppPage() {
    const navigate = useNavigate();
    const { data: user } = useAuth();
    const { data: airtableStatus, isLoading: airtableLoading } = useQuery(getAirtableConnectionStatus);
    const { data: googleStatus, isLoading: googleLoading } = useQuery(getGoogleConnectionStatus);
    const { data: syncConfigs, isLoading: syncConfigsLoading } = useQuery(getUserSyncConfigs);
    const [testEmailTo, setTestEmailTo] = useState("oretobiloba@gmail.com");
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
    const bothConnected = airtableStatus?.isConnected && googleStatus?.isConnected;
    const isLoading = airtableLoading || googleLoading || syncConfigsLoading;
    // Calculate stats from actual sync configs
    const activeSyncsCount = syncConfigs?.filter(config => config.isActive).length || 0;
    const totalSyncsCount = syncConfigs?.length || 0;
    const lastSyncTime = syncConfigs
        ?.filter(config => config.lastSyncAt)
        .sort((a, b) => new Date(b.lastSyncAt).getTime() - new Date(a.lastSyncAt).getTime())[0]?.lastSyncAt;
    const formatLastSync = (date) => {
        if (!date)
            return 'Never';
        const dateObj = date instanceof Date ? date : new Date(date);
        const diffMs = Date.now() - dateObj.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24)
            return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };
    const handleSendTestEmails = async () => {
        if (!testEmailTo)
            return;
        try {
            setIsSendingTestEmail(true);
            await sendTestEmails({ to: testEmailTo });
            alert(`Sent test emails to ${testEmailTo}`);
        }
        catch (error) {
            alert(error?.message || "Failed to send test emails");
        }
        finally {
            setIsSendingTestEmail(false);
        }
    };
    return (<div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: `
              radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
            `,
            WebkitMaskImage: `
              radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
            `,
        }}/>

        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow" aria-hidden="true"/>
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower" aria-hidden="true"/>
      </div>

      <div className="relative z-10 py-10 lg:mt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-4xl text-center mb-12">
            <div className="relative rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm px-6 py-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5"/>
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6 animate-fade-in">
                  <Zap className="w-4 h-4 text-cyan-400"/>
                  <span className="text-sm font-mono text-cyan-400">
                    Command Center
                  </span>
                </div>
                <h1 className="text-foreground text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-slide-up">
                  <span className="text-gradient-sync">Dashboard</span>
                </h1>
                <p className="text-muted-foreground text-lg animate-fade-in-delayed max-w-2xl mx-auto">
                  Monitor and manage your data sync operations
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-12 animate-fade-in-delayed">
            <AirtableConnectionCard status={airtableStatus} isLoading={airtableLoading}/>
            <GoogleSheetsConnectionCard status={googleStatus} isLoading={googleLoading}/>
          </div>

          {/* Quick Stats Section */}
          <div className="mb-12 animate-fade-in-delayed-more">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"/>
              <h2 className="text-foreground text-2xl font-bold">
                Performance Metrics
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard icon={<ArrowLeftRight className="w-5 h-5 text-cyan-400"/>} title="Active Syncs" value={activeSyncsCount.toString()} description="Currently running" isLoading={isLoading} accentColor="cyan"/>
              <StatCard icon={<Activity className="w-5 h-5 text-blue-400"/>} title="Total Syncs" value={totalSyncsCount.toString()} description="Configurations created" isLoading={isLoading} accentColor="blue"/>
              <StatCard icon={<Clock className="w-5 h-5 text-emerald-400"/>} title="Last Sync" value={formatLastSync(lastSyncTime)} description="Most recent activity" isLoading={isLoading} accentColor="emerald"/>
            </div>
          </div>

          {/* Active Sync Configurations */}
          <div className="animate-fade-in-delayed-more">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"/>
                <h2 className="text-foreground text-2xl font-bold">
                  Sync Configurations
                </h2>
              </div>
              <Button disabled={!bothConnected || isLoading} onClick={() => navigate('/sync/new')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105">
                <Plus className="w-4 h-4 mr-2"/>
                New Sync
              </Button>
            </div>
            {isLoading ? (<Card className="border-cyan-500/20 bg-card/80 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-cyan-400"/>
                    <span className="text-sm text-muted-foreground font-mono">Loading syncs...</span>
                  </div>
                </CardContent>
              </Card>) : syncConfigs && syncConfigs.length > 0 ? (<SyncConfigsList syncConfigs={syncConfigs}/>) : (<EmptySyncConfigsList bothConnected={bothConnected} isLoading={isLoading}/>)}
          </div>

          {user?.isAdmin && (<div className="mt-10">
              <Card className="border-dashed border-cyan-500/30 bg-card/70 backdrop-blur-sm">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Admin: Send Test Emails</div>
                    <div className="text-xs text-muted-foreground">
                      Sends all email templates (auth + notifications) to the address below.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} className="h-10 w-full md:w-64 rounded-md border border-border/60 bg-card/60 px-3 text-sm" placeholder="email@example.com"/>
                    <Button onClick={handleSendTestEmails} disabled={isSendingTestEmail || !testEmailTo} className="h-10">
                      {isSendingTestEmail ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>)}
        </div>
      </div>
    </div>);
}
function AirtableConnectionCard({ status, isLoading }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const result = await initiateAirtableAuth();
            if (result.authUrl) {
                window.location.href = result.authUrl;
            }
        }
        catch (error) {
            console.error("Failed to initiate Airtable auth:", error);
            alert("Failed to connect to Airtable. Please try again.");
        }
        finally {
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
        }
        catch (error) {
            console.error("Failed to disconnect Airtable:", error);
            alert("Failed to disconnect Airtable. Please try again.");
        }
        finally {
            setIsDisconnecting(false);
        }
    };
    return (<Card className="relative group border-cyan-500/20 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-white flex items-center justify-center shadow-lg p-2">
            <img src="/airtable-icon.svg" alt="Airtable" className="w-full h-full object-contain" style={{ imageRendering: '-webkit-optimize-contrast', shapeRendering: 'geometricPrecision' }}/>
          </div>
          {isLoading ? (<div className="w-6 h-6 rounded-full bg-muted animate-pulse"/>) : status?.isConnected ? (<div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"/>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 relative"/>
            </div>) : (<XCircle className="w-6 h-6 text-muted-foreground"/>)}
        </div>
        <CardTitle className="text-foreground text-xl mb-2">Airtable</CardTitle>
        <div className="h-12">
          <CardDescription className="text-sm">
            {isLoading ? (<span className="font-mono text-cyan-400">Checking connection...</span>) : status?.isConnected ? (<>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                  <span className="text-emerald-400 font-semibold font-mono text-xs">CONNECTED</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {status.accountId ? `Account: ${status.accountId}` : "Ready to sync"}
                </div>
              </>) : (<>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"/>
                  <span className="text-muted-foreground font-semibold font-mono text-xs">DISCONNECTED</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Connect to start syncing
                </div>
              </>)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {!status?.isConnected && !isLoading && (<Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300">
            {isConnecting ? (<>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                <span className="font-mono">Connecting...</span>
              </>) : (<>
                <Zap className="mr-2 h-4 w-4"/>
                Connect Airtable
              </>)}
          </Button>)}
        {status?.isConnected && (<Button onClick={handleDisconnect} disabled={isDisconnecting} variant="outline" className="w-full border-red-500/30 hover:border-red-500 hover:bg-red-500/5 transition-all duration-300">
            {isDisconnecting ? (<>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                <span className="font-mono">Disconnecting...</span>
              </>) : (<>
                <Unplug className="mr-2 h-4 w-4"/>
                Disconnect
              </>)}
          </Button>)}
      </CardContent>
    </Card>);
}
function GoogleSheetsConnectionCard({ status, isLoading }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const result = await initiateGoogleAuth();
            if (result.authUrl) {
                window.location.href = result.authUrl;
            }
        }
        catch (error) {
            console.error("Failed to initiate Google auth:", error);
            alert("Failed to connect to Google Sheets. Please try again.");
        }
        finally {
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
        }
        catch (error) {
            console.error("Failed to disconnect Google Sheets:", error);
            alert("Failed to disconnect Google Sheets. Please try again.");
        }
        finally {
            setIsDisconnecting(false);
        }
    };
    return (<Card className="relative group border-emerald-500/20 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-white flex items-center justify-center shadow-lg p-2">
            <img src="/google-sheets-icon.svg" alt="Google Sheets" className="w-full h-full object-contain" style={{ imageRendering: '-webkit-optimize-contrast', shapeRendering: 'geometricPrecision' }}/>
          </div>
          {isLoading ? (<div className="w-6 h-6 rounded-full bg-muted animate-pulse"/>) : status?.isConnected ? (<div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"/>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 relative"/>
            </div>) : (<XCircle className="w-6 h-6 text-muted-foreground"/>)}
        </div>
        <CardTitle className="text-foreground text-xl mb-2">Google Sheets</CardTitle>
        <div className="h-12">
          <CardDescription className="text-sm">
            {isLoading ? (<span className="font-mono text-cyan-400">Checking connection...</span>) : status?.isConnected ? (<>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                  <span className="text-emerald-400 font-semibold font-mono text-xs">CONNECTED</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {status.googleAccountEmail || "Ready to sync"}
                </div>
              </>) : (<>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"/>
                  <span className="text-muted-foreground font-semibold font-mono text-xs">DISCONNECTED</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Connect to start syncing
                </div>
              </>)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {!status?.isConnected && !isLoading && (<Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300">
            {isConnecting ? (<>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                <span className="font-mono">Connecting...</span>
              </>) : (<>
                <Zap className="mr-2 h-4 w-4"/>
                Connect Google Sheets
              </>)}
          </Button>)}
        {status?.isConnected && (<Button onClick={handleDisconnect} disabled={isDisconnecting} variant="outline" className="w-full border-red-500/30 hover:border-red-500 hover:bg-red-500/5 transition-all duration-300">
            {isDisconnecting ? (<>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                <span className="font-mono">Disconnecting...</span>
              </>) : (<>
                <Unplug className="mr-2 h-4 w-4"/>
                Disconnect
              </>)}
          </Button>)}
      </CardContent>
    </Card>);
}
function StatCard({ icon, title, value, description, isLoading, accentColor, }) {
    const borderColor = {
        cyan: 'border-cyan-500/20 hover:border-cyan-500/40',
        blue: 'border-blue-500/20 hover:border-blue-500/40',
        emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    }[accentColor || 'cyan'];
    const glowColor = {
        cyan: 'from-cyan-500/5',
        blue: 'from-blue-500/5',
        emerald: 'from-emerald-500/5',
    }[accentColor || 'cyan'];
    return (<Card className={`relative group ${borderColor} bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:shadow-lg`}>
      {/* Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>

      <CardHeader className="relative pb-3">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (<div className="animate-pulse space-y-2">
            <div className="h-8 w-16 bg-muted/50 rounded"/>
            <div className="h-4 w-24 bg-muted/50 rounded"/>
          </div>) : (<>
            <div className="text-4xl font-bold text-gradient-sync mb-1">{value}</div>
            <div className="text-sm text-foreground font-medium mb-1">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </>)}
      </CardContent>
    </Card>);
}
function SyncConfigsList({ syncConfigs }) {
    const navigate = useNavigate();
    const getSyncDirectionLabel = (direction) => {
        switch (direction) {
            case 'AIRTABLE_TO_SHEETS':
                return 'Airtable → Sheets';
            case 'SHEETS_TO_AIRTABLE':
                return 'Sheets → Airtable';
            case 'BIDIRECTIONAL':
                return 'Two-way sync';
            default:
                return direction;
        }
    };
    const getSyncDirectionIcon = (direction) => {
        switch (direction) {
            case 'BIDIRECTIONAL':
                return <ArrowLeftRight className="w-3.5 h-3.5"/>;
            default:
                return <TrendingUp className="w-3.5 h-3.5"/>;
        }
    };
    return (<div className="space-y-4">
      {syncConfigs.map((config, index) => (<Card key={config.id} className="relative group border-cyan-500/20 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer" onClick={() => navigate(`/sync/${config.id}`)} style={{
                animationDelay: `${index * 0.1}s`,
            }}>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

          <CardContent className="pt-6 relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-foreground font-semibold text-lg">{config.name}</h4>
                  {config.isActive ? (<div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xs font-mono text-emerald-400">ACTIVE</span>
                    </div>) : (<div className="px-3 py-1 rounded-full bg-muted/50 border border-border">
                      <span className="text-xs font-mono text-muted-foreground">PAUSED</span>
                    </div>)}
                </div>

                {/* Platform Connection */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                      <img src="/airtable-icon.svg" alt="Airtable" className="w-full h-full object-contain"/>
                    </div>
                    <span className="text-xs text-foreground font-medium">
                      {config.airtableTableName || 'Airtable Table'}
                    </span>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-cyan-400"/>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                      <img src="/google-sheets-icon.svg" alt="Google Sheets" className="w-full h-full object-contain"/>
                    </div>
                    <span className="text-xs text-foreground font-medium">
                      {config.googleSheetName || 'Google Sheet'}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
                    {getSyncDirectionIcon(config.syncDirection)}
                    <span className="font-mono">{getSyncDirectionLabel(config.syncDirection)}</span>
                  </div>
                  {config.lastSyncAt && (<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
                      <Clock className="w-3 h-3"/>
                      <span className="font-mono">
                        {new Date(config.lastSyncAt).toLocaleDateString()}
                      </span>
                    </div>)}
                  {config.lastSyncStatus && (<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
                      {config.lastSyncStatus === 'success' ? (<CheckCircle2 className="w-3 h-3 text-emerald-400"/>) : (<AlertCircle className="w-3 h-3 text-yellow-400"/>)}
                      <span className="font-mono capitalize">{config.lastSyncStatus}</span>
                    </div>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>))}
    </div>);
}
function EmptySyncConfigsList({ bothConnected, isLoading }) {
    const navigate = useNavigate();
    return (<Card className="relative border-dashed border-cyan-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
        }} className="w-full h-full"/>
      </div>

      <CardContent className="relative flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-cyan-400"/>
        </div>
        <h3 className="text-foreground text-xl font-bold mb-2">
          No sync configurations yet
        </h3>
        <p className="text-muted-foreground text-center mb-8 max-w-md text-sm">
          {bothConnected
            ? "You're all connected! Create your first sync configuration to start automating your data flow."
            : "Connect both Airtable and Google Sheets above to start creating powerful sync configurations."}
        </p>
        <Button disabled={!bothConnected || isLoading} onClick={() => navigate('/sync/new')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105">
          <Plus className="w-4 h-4 mr-2"/>
          Create Your First Sync
        </Button>
      </CardContent>
    </Card>);
}
//# sourceMappingURL=DemoAppPage.jsx.map