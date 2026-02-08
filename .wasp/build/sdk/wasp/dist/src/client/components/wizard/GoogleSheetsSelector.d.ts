export interface GoogleSheetsSelectionData {
    spreadsheetId?: string;
    spreadsheetName?: string;
    sheetId?: string;
    sheetName?: string;
}
export interface GoogleSheetsSelectorProps {
    value: GoogleSheetsSelectionData;
    onChange: (data: GoogleSheetsSelectionData) => void;
}
export declare function GoogleSheetsSelector({ value, onChange }: GoogleSheetsSelectorProps): import("react").JSX.Element;
//# sourceMappingURL=GoogleSheetsSelector.d.ts.map