export interface FieldMappingData {
    fieldMappings?: Record<string, number>;
}
export interface FieldMapperProps {
    value: {
        airtableBaseId?: string;
        airtableTableId?: string;
        googleSpreadsheetId?: string;
        googleSheetId?: string;
        fieldMappings?: Record<string, number>;
    };
    onChange: (data: FieldMappingData) => void;
}
export declare function FieldMapper({ value, onChange }: FieldMapperProps): import("react").JSX.Element;
//# sourceMappingURL=FieldMapper.d.ts.map