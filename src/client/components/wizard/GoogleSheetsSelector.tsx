import { AlertCircle, FileSpreadsheet, Loader2, Sheet } from "lucide-react";
import { useEffect, useState } from "react";
import { listUserSpreadsheets, getSpreadsheetSheets, useQuery } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface GoogleSheetsSelectionData {
  spreadsheetId?: string;
  spreadsheetName?: string;
  sheetId?: string;
  sheetName?: string;
}

export interface GoogleSheetsSelectorProps {
  /** Current selection data */
  value: GoogleSheetsSelectionData;
  /** Callback when selection changes */
  onChange: (data: GoogleSheetsSelectionData) => void;
}

interface GoogleSpreadsheet {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
}

interface GoogleSheet {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
  hidden?: boolean;
}

interface SheetData {
  sheetId: number;
  title: string;
  columnHeaders: string[];
  rowCount: number;
  columnCount: number;
}

/**
 * Step 2: Google Sheets Spreadsheet and Sheet Selection
 * Allows users to select a Google Spreadsheet and specific sheet for syncing
 */
export function GoogleSheetsSelector({ value, onChange }: GoogleSheetsSelectorProps) {
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | undefined>(
    value.spreadsheetId
  );
  const [selectedSheetId, setSelectedSheetId] = useState<string | undefined>(value.sheetId);
  const [sheets, setSheets] = useState<GoogleSheet[] | null>(null);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [sheetPreview, setSheetPreview] = useState<SheetData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Fetch user's Google Spreadsheets
  const {
    data: spreadsheets,
    isLoading: isLoadingSpreadsheets,
    error: spreadsheetsError,
  } = useQuery(listUserSpreadsheets);

  // Handle spreadsheet selection
  const handleSpreadsheetChange = async (spreadsheetId: string) => {
    const spreadsheet = spreadsheets?.find((s: GoogleSpreadsheet) => s.id === spreadsheetId);
    setSelectedSpreadsheetId(spreadsheetId);
    setSelectedSheetId(undefined);
    setSheetPreview(null);
    setPreviewError(null);
    setSheets(null);
    setSheetsError(null);
    setIsLoadingSheets(true);

    onChange({
      spreadsheetId,
      spreadsheetName: spreadsheet?.name,
      sheetId: undefined,
      sheetName: undefined,
    });

    // Fetch sheets for the selected spreadsheet
    try {
      const response = await getSpreadsheetSheets({ spreadsheetId });
      // getSpreadsheetSheets returns an object with a 'sheets' array
      setSheets((response as any).sheets || []);
    } catch (error) {
      console.error("Failed to fetch sheets:", error);
      setSheetsError(error instanceof Error ? error.message : "Failed to fetch sheets");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Handle sheet selection
  const handleSheetChange = async (sheetIdAndName: string) => {
    if (!selectedSpreadsheetId) return;

    // Parse the combined value (format: "sheetId|sheetName")
    const [sheetIdStr, sheetName] = sheetIdAndName.split("|");
    const sheetId = parseInt(sheetIdStr, 10);

    setSelectedSheetId(sheetIdStr);
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      // Find the selected sheet details
      const selectedSheet = sheets?.find((s) => s.sheetId === sheetId);

      if (!selectedSheet) {
        throw new Error("Selected sheet not found");
      }

      // Create preview data
      // Note: In a real implementation, you'd fetch actual column headers from the sheet
      // For now, we'll use the row/column counts to show what's available
      const preview: SheetData = {
        sheetId: selectedSheet.sheetId,
        title: selectedSheet.title,
        columnHeaders: [], // TODO: Fetch actual headers from row 1
        rowCount: selectedSheet.rowCount || 0,
        columnCount: selectedSheet.columnCount || 0,
      };

      setSheetPreview(preview);

      onChange({
        spreadsheetId: selectedSpreadsheetId,
        spreadsheetName: spreadsheets?.find((s: GoogleSpreadsheet) => s.id === selectedSpreadsheetId)
          ?.name,
        sheetId: sheetIdStr,
        sheetName,
      });
    } catch (error) {
      console.error("Failed to load sheet preview:", error);
      setPreviewError(error instanceof Error ? error.message : "Failed to load sheet preview");
      setSheetPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // No spreadsheets found state
  if (!isLoadingSpreadsheets && (!spreadsheets || spreadsheets.length === 0)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No Google Spreadsheets found. Please make sure your Google account is connected and you
          have access to at least one spreadsheet.
        </AlertDescription>
      </Alert>
    );
  }

  // Error loading spreadsheets
  if (spreadsheetsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Google Spreadsheets: {spreadsheetsError.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spreadsheet Selection */}
      <div className="space-y-2">
        <Label htmlFor="google-spreadsheet">Google Spreadsheet</Label>
        {isLoadingSpreadsheets ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select value={selectedSpreadsheetId} onValueChange={handleSpreadsheetChange}>
            <SelectTrigger id="google-spreadsheet">
              <SelectValue placeholder="Select a Google Spreadsheet" />
            </SelectTrigger>
            <SelectContent>
              {spreadsheets?.map((spreadsheet: GoogleSpreadsheet) => (
                <SelectItem key={spreadsheet.id} value={spreadsheet.id}>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>{spreadsheet.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedSpreadsheetId && (
          <p className="text-xs text-muted-foreground">
            Selected:{" "}
            {spreadsheets?.find((s: GoogleSpreadsheet) => s.id === selectedSpreadsheetId)?.name}
          </p>
        )}
      </div>

      {/* Sheet Selection */}
      {selectedSpreadsheetId && (
        <div className="space-y-2">
          <Label htmlFor="google-sheet">Sheet</Label>
          {isLoadingSheets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sheetsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sheetsError}</AlertDescription>
            </Alert>
          ) : sheets && sheets.length > 0 ? (
            <>
              <Select value={selectedSheetId} onValueChange={(value) => handleSheetChange(value)}>
                <SelectTrigger id="google-sheet">
                  <SelectValue placeholder="Select a sheet" />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((sheet: GoogleSheet) => (
                    <SelectItem key={sheet.sheetId} value={`${sheet.sheetId}|${sheet.title}`}>
                      <div className="flex items-center gap-2">
                        <Sheet className="h-4 w-4 text-blue-600" />
                        <span>{sheet.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({sheet.rowCount} rows × {sheet.columnCount} cols)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSheetId && (
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  {sheets.find((s: GoogleSheet) => s.sheetId.toString() === selectedSheetId)?.title}
                </p>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No sheets found in this spreadsheet.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sheet Preview */}
      {isLoadingPreview && (
        <div className="rounded-md border p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading sheet preview...</span>
          </div>
        </div>
      )}

      {previewError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{previewError}</AlertDescription>
        </Alert>
      )}

      {sheetPreview && !isLoadingPreview && (
        <div className="space-y-4">
          <div>
            <Label>Sheet Preview</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {sheetPreview.rowCount} rows × {sheetPreview.columnCount} columns
            </p>
          </div>

          <div className="rounded-md border">
            <div className="max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Property
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm font-medium">Sheet Name</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {sheetPreview.title}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm font-medium">Total Rows</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {sheetPreview.rowCount}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm font-medium">Total Columns</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {sheetPreview.columnCount}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm font-medium">Sheet ID</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {sheetPreview.sheetId}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/50 px-4 py-2">
              <p className="text-xs text-muted-foreground">
                Sheet structure ready for field mapping
              </p>
            </div>
          </div>

          {/* Future feature note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Column headers will be automatically detected during field
              mapping. Make sure your sheet has headers in the first row.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Helper Text */}
      {!selectedSpreadsheetId && (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Select a Google Spreadsheet to get started. You'll then be able to choose a specific
            sheet from that spreadsheet.
          </p>
        </div>
      )}

      {/* Create New Sheet Option - Future Feature */}
      {selectedSpreadsheetId && sheets && sheets.length > 0 && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Coming soon:</strong> Create a new sheet directly from this wizard.
          </p>
        </div>
      )}
    </div>
  );
}
