export interface ReviewStepData {
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
export interface ReviewStepProps {
    formData: ReviewStepData;
    isEditMode?: boolean;
    syncConfigId?: string;
}
export declare function ReviewStep({ formData, isEditMode, syncConfigId }: ReviewStepProps): import("react").JSX.Element;
//# sourceMappingURL=ReviewStep.d.ts.map