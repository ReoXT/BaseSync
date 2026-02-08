export interface AirtableSelectionData {
    baseId?: string;
    baseName?: string;
    tableId?: string;
    tableName?: string;
    viewId?: string;
}
export interface AirtableSelectorProps {
    value: AirtableSelectionData;
    onChange: (data: AirtableSelectionData) => void;
}
export declare function AirtableSelector({ value, onChange }: AirtableSelectorProps): import("react").JSX.Element;
//# sourceMappingURL=AirtableSelector.d.ts.map