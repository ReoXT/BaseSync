import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "./ui/card";
import { cn } from "../utils";
/**
 * Reusable component for displaying OAuth connection status
 * Shows connection state, account info, and provides connect/reconnect action
 */
export function ConnectionStatus({ serviceName, serviceIcon: ServiceIcon, iconColor = "text-primary", isLoading, isConnected, accountInfo, isTokenExpired = false, lastSyncedAt, onConnect, isConnecting = false, }) {
    // Determine status icon and color
    const getStatusIcon = () => {
        if (isLoading) {
            return (<div className="animate-pulse">
          <div className="h-6 w-6 bg-muted rounded-full"></div>
        </div>);
        }
        if (isTokenExpired) {
            return <AlertCircle className="size-6 text-warning"/>;
        }
        if (isConnected) {
            return <CheckCircle2 className="size-6 text-success"/>;
        }
        return <XCircle className="size-6 text-muted-foreground"/>;
    };
    // Format last synced timestamp
    const formatLastSynced = (timestamp) => {
        if (!timestamp)
            return "";
        try {
            const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1)
                return "Just now";
            if (diffMins < 60)
                return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
            if (diffHours < 24)
                return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
            if (diffDays < 7)
                return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
            return date.toLocaleDateString();
        }
        catch (error) {
            return "";
        }
    };
    // Determine status text
    const getStatusText = () => {
        if (isLoading)
            return "Checking connection...";
        if (isTokenExpired)
            return "Token expired - please reconnect";
        if (isConnected) {
            if (accountInfo)
                return accountInfo;
            return "Connected";
        }
        return "Not connected";
    };
    // Determine button text and variant
    const getButtonConfig = () => {
        if (isTokenExpired) {
            return { text: "Reconnect", variant: "default" };
        }
        if (isConnected) {
            return { text: "Reconnect", variant: "outline" };
        }
        return { text: `Connect ${serviceName}`, variant: "default" };
    };
    const buttonConfig = getButtonConfig();
    const statusText = getStatusText();
    const lastSyncedText = lastSyncedAt ? formatLastSynced(lastSyncedAt) : null;
    return (<Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-11.5 w-11.5 bg-muted flex items-center justify-center rounded-full">
            <ServiceIcon className={cn("size-6", iconColor)}/>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-2">{serviceName}</CardTitle>
        <CardDescription className="mb-4">
          {statusText}
          {lastSyncedText && isConnected && !isTokenExpired && (<span className="block text-xs mt-1 text-muted-foreground">
              Last synced: {lastSyncedText}
            </span>)}
        </CardDescription>
        {!isLoading && (<Button onClick={onConnect} disabled={isConnecting} size="sm" variant={buttonConfig.variant} className="w-full">
            {isConnecting ? (<>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                Connecting...
              </>) : (buttonConfig.text)}
          </Button>)}
      </CardContent>
    </Card>);
}
//# sourceMappingURL=ConnectionStatus.jsx.map