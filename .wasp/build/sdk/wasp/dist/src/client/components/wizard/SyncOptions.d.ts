export interface SyncOptionsData {
    syncName?: string;
    syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
    conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}
export interface SyncOptionsProps {
    value: {
        airtableBaseName?: string;
        airtableTableName?: string;
        googleSpreadsheetName?: string;
        googleSheetName?: string;
        syncName?: string;
        syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
        conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
    };
    onChange: (data: SyncOptionsData) => void;
}
export declare function SyncOptions({ value, onChange }: SyncOptionsProps): import("react").JSX.Element;
//# sourceMappingURL=SyncOptions.d.ts.map