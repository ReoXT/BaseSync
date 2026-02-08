import { LucideIcon } from "lucide-react";
export interface ConnectionStatusProps {
    /** The service name (e.g., "Airtable", "Google Sheets") */
    serviceName: string;
    /** Icon component to display for the service */
    serviceIcon: LucideIcon;
    /** Color class for the service icon */
    iconColor?: string;
    /** Whether the connection is currently loading */
    isLoading: boolean;
    /** Whether the user is connected to the service */
    isConnected: boolean;
    /** Optional account identifier (e.g., email, account ID) */
    accountInfo?: string;
    /** Whether the token has expired */
    isTokenExpired?: boolean;
    /** Timestamp of last sync (ISO string or Date) */
    lastSyncedAt?: string | Date;
    /** Callback when user clicks connect/reconnect button */
    onConnect: () => void;
    /** Whether the connection process is in progress */
    isConnecting?: boolean;
}
/**
 * Reusable component for displaying OAuth connection status
 * Shows connection state, account info, and provides connect/reconnect action
 */
export declare function ConnectionStatus({ serviceName, serviceIcon: ServiceIcon, iconColor, isLoading, isConnected, accountInfo, isTokenExpired, lastSyncedAt, onConnect, isConnecting, }: ConnectionStatusProps): import("react").JSX.Element;
//# sourceMappingURL=ConnectionStatus.d.ts.map