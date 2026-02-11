interface SyncFormData {
    airtableBaseId?: string;
    airtableBaseName?: string;
    airtableTableId?: string;
    airtableTableName?: string;
    airtableViewId?: string;
    googleSpreadsheetId?: string;
    googleSpreadsheetName?: string;
    googleSheetId?: string;
    googleSheetName?: string;
    fieldMappings?: Record<string, number>;
    syncName?: string;
    syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
    conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}
interface NewSyncPageProps {
    isEditMode?: boolean;
    syncConfigId?: string;
    initialData?: SyncFormData;
}
export default function NewSyncPage({ isEditMode, syncConfigId, initialData }: NewSyncPageProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=NewSyncPage.d.ts.map