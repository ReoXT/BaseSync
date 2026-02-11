export interface SyncConfig {
    id: string;
    name: string;
    airtableTableName?: string;
    googleSheetName?: string;
    syncDirection: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
    lastSyncAt?: Date | string;
    lastSyncStatus?: "success" | "failed" | "partial";
    isActive: boolean;
}
export interface SyncConfigListProps {
    /** Array of sync configurations to display */
    syncConfigs: SyncConfig[];
    /** Whether the list is loading */
    isLoading?: boolean;
    /** Callback when user clicks Edit */
    onEdit?: (syncConfig: SyncConfig) => void;
    /** Callback when user clicks Sync Now */
    onSyncNow?: (syncConfig: SyncConfig) => void;
    /** Callback when user clicks Delete */
    onDelete?: (syncConfig: SyncConfig) => void;
}
/**
 * Display user's sync configurations in a table/list view
 * Shows: Name, Source→Destination, Status, Last Sync, Actions
 */
export declare function SyncConfigList({ syncConfigs, isLoading, onEdit, onSyncNow, onDelete, }: SyncConfigListProps): import("react").JSX.Element;
//# sourceMappingURL=SyncConfigList.d.ts.map