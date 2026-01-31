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
        sheetId: sheetName, // Use sheet name instead of gid for better compatibility
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
      <div className="space-y-3 animate-fade-in">
        <Label htmlFor="google-spreadsheet" className="text-sm font-medium flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
          Google Spreadsheet
        </Label>
        {isLoadingSpreadsheets ? (
          <div className="relative rounded-xl border border-emerald-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <div className="flex flex-col items-center justify-center gap-3 relative">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <span className="text-sm font-mono text-emerald-400">Fetching spreadsheets...</span>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <Select value={selectedSpreadsheetId} onValueChange={handleSpreadsheetChange}>
              <SelectTrigger id="google-spreadsheet" className="h-12 border-emerald-500/20 hover:border-emerald-500/40 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                <SelectValue placeholder="Choose your spreadsheet..." />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-card/95 border-emerald-500/20">
                {spreadsheets?.map((spreadsheet: GoogleSpreadsheet) => (
                  <SelectItem key={spreadsheet.id} value={spreadsheet.id} className="cursor-pointer">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                        <FileSpreadsheet className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{spreadsheet.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpreadsheetId && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-mono text-foreground">
                  {spreadsheets?.find((s: GoogleSpreadsheet) => s.id === selectedSpreadsheetId)?.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheet Selection */}
      {selectedSpreadsheetId && (
        <div className="space-y-3 animate-fade-in">
          <Label htmlFor="google-sheet" className="text-sm font-medium flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            Sheet
          </Label>
          {isLoadingSheets ? (
            <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="flex flex-col items-center justify-center gap-3 relative">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="text-sm font-mono text-blue-400">Loading sheets...</span>
              </div>
            </div>
          ) : sheetsError ? (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sheetsError}</AlertDescription>
            </Alert>
          ) : sheets && sheets.length > 0 ? (
            <>
              <div className="relative group">
                <Select value={selectedSheetId} onValueChange={(value) => handleSheetChange(value)}>
                  <SelectTrigger id="google-sheet" className="h-12 border-blue-500/20 hover:border-blue-500/40 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                    <SelectValue placeholder="Choose your sheet..." />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-card/95 border-blue-500/20">
                    {sheets.map((sheet: GoogleSheet) => (
                      <SelectItem key={sheet.sheetId} value={`${sheet.sheetId}|${sheet.title}`} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                            <Sheet className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{sheet.title}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {sheet.rowCount} rows × {sheet.columnCount} cols
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSheetId && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
                    <Sheet className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-mono text-foreground">
                      {sheets.find((s: GoogleSheet) => s.sheetId.toString() === selectedSheetId)?.title}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Alert className="border-yellow-500/50 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                No sheets found in this spreadsheet.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sheet Preview */}
      {isLoadingPreview && (
        <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <div className="flex flex-col items-center justify-center gap-3 relative">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">Loading sheet preview...</span>
          </div>
        </div>
      )}

      {previewError && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/5 animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{previewError}</AlertDescription>
        </Alert>
      )}

      {sheetPreview && !isLoadingPreview && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full" />
            <Label className="text-sm font-medium">Sheet Details</Label>
          </div>

          <div className="relative rounded-xl border border-emerald-500/20 bg-card/50 backdrop-blur-sm overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-6 space-y-4">
              {/* Sheet Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Sheet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Sheet Name</p>
                      <p className="text-sm font-semibold text-foreground truncate">{sheetPreview.title}</p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-lg border border-blue-500/10 bg-blue-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Sheet ID</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{sheetPreview.sheetId}</p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-cyan-400">{sheetPreview.rowCount}</span>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Total Rows</p>
                      <p className="text-sm font-semibold text-foreground">Available for sync</p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-lg border border-purple-500/10 bg-purple-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-400">{sheetPreview.columnCount}</span>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Total Columns</p>
                      <p className="text-sm font-semibold text-foreground">Ready to map</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-500/10 bg-muted/50 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-mono text-muted-foreground">
                  Sheet structure ready for field mapping
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-cyan-500/30 bg-cyan-500/5">
            <AlertCircle className="h-4 w-4 text-cyan-400" />
            <AlertDescription className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Column headers will be automatically detected during field mapping. Make sure your sheet has headers in the first row.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Helper Text */}
      {!selectedSpreadsheetId && (
        <div className="relative rounded-xl border border-dashed border-emerald-500/20 bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
              }}
              className="w-full h-full"
            />
          </div>
          <div className="relative flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Ready to connect</p>
              <p className="text-xs text-muted-foreground">
                Select a Google Spreadsheet from the dropdown above to view available sheets and begin the sync setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Feature */}
      {selectedSpreadsheetId && sheets && sheets.length > 0 && (
        <div className="relative rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
          <div className="relative flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sheet className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Coming soon</p>
              <p className="text-xs text-muted-foreground">
                Create a new sheet directly from this wizard without leaving the setup flow.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
