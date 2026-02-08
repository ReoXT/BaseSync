import { AlertCircle, Loader2, Sheet } from "lucide-react";
import { useState } from "react";
import { listUserSpreadsheets, getSpreadsheetSheets, useQuery } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
export function GoogleSheetsSelector({ value, onChange }) {
    const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState(value.spreadsheetId);
    const [selectedSheetId, setSelectedSheetId] = useState(value.sheetId);
    const [sheets, setSheets] = useState(null);
    const [isLoadingSheets, setIsLoadingSheets] = useState(false);
    const [sheetsError, setSheetsError] = useState(null);
    const [sheetPreview, setSheetPreview] = useState(null);
    const { data: spreadsheets, isLoading: isLoadingSpreadsheets, error: spreadsheetsError, } = useQuery(listUserSpreadsheets);
    const handleSpreadsheetChange = async (spreadsheetId) => {
        const spreadsheet = spreadsheets?.find((s) => s.id === spreadsheetId);
        setSelectedSpreadsheetId(spreadsheetId);
        setSelectedSheetId(undefined);
        setSheetPreview(null);
        setSheets(null);
        setSheetsError(null);
        setIsLoadingSheets(true);
        onChange({
            spreadsheetId,
            spreadsheetName: spreadsheet?.name,
            sheetId: undefined,
            sheetName: undefined,
        });
        try {
            const response = await getSpreadsheetSheets({ spreadsheetId });
            setSheets(response.sheets || []);
        }
        catch (error) {
            console.error("Failed to fetch sheets:", error);
            setSheetsError(error instanceof Error ? error.message : "Failed to fetch sheets");
        }
        finally {
            setIsLoadingSheets(false);
        }
    };
    const handleSheetChange = (sheetIdAndName) => {
        if (!selectedSpreadsheetId)
            return;
        const [sheetIdStr, sheetName] = sheetIdAndName.split("|");
        const sheetId = parseInt(sheetIdStr, 10);
        setSelectedSheetId(sheetIdStr);
        const selectedSheet = sheets?.find((s) => s.sheetId === sheetId);
        if (selectedSheet) {
            setSheetPreview({
                sheetId: selectedSheet.sheetId,
                title: selectedSheet.title,
                rowCount: selectedSheet.rowCount || 0,
                columnCount: selectedSheet.columnCount || 0,
            });
        }
        onChange({
            spreadsheetId: selectedSpreadsheetId,
            spreadsheetName: spreadsheets?.find((s) => s.id === selectedSpreadsheetId)?.name,
            sheetId: sheetName,
            sheetName,
        });
    };
    if (!isLoadingSpreadsheets && (!spreadsheets || spreadsheets.length === 0)) {
        return (<Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>
          No Google Spreadsheets found. Make sure your Google account is connected.
        </AlertDescription>
      </Alert>);
    }
    if (spreadsheetsError) {
        return (<Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>
          Failed to load spreadsheets: {spreadsheetsError.message || "Unknown error"}
        </AlertDescription>
      </Alert>);
    }
    return (<div className="space-y-6">
      {/* Spreadsheet Selection */}
      <div className="space-y-2">
        <Label htmlFor="google-spreadsheet" className="text-sm font-medium">
          Google Spreadsheet
        </Label>
        {isLoadingSpreadsheets ? (<div className="h-11 flex items-center justify-center rounded-lg border border-border bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
            <span className="ml-2 text-sm text-muted-foreground">Loading spreadsheets...</span>
          </div>) : (<Select value={selectedSpreadsheetId} onValueChange={handleSpreadsheetChange}>
            <SelectTrigger id="google-spreadsheet" className="h-11">
              <SelectValue placeholder="Select a spreadsheet"/>
            </SelectTrigger>
            <SelectContent>
              {spreadsheets?.map((spreadsheet) => (<SelectItem key={spreadsheet.id} value={spreadsheet.id}>
                  <div className="flex items-center gap-2">
                    <img src="/google-sheets-icon.svg" alt="" className="w-4 h-4"/>
                    <span>{spreadsheet.name}</span>
                  </div>
                </SelectItem>))}
            </SelectContent>
          </Select>)}
      </div>

      {/* Sheet Selection */}
      {selectedSpreadsheetId && (<div className="space-y-2">
          <Label htmlFor="google-sheet" className="text-sm font-medium">
            Sheet
          </Label>
          {isLoadingSheets ? (<div className="h-11 flex items-center justify-center rounded-lg border border-border bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
              <span className="ml-2 text-sm text-muted-foreground">Loading sheets...</span>
            </div>) : sheetsError ? (<Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{sheetsError}</AlertDescription>
            </Alert>) : sheets && sheets.length > 0 ? (<Select value={selectedSheetId} onValueChange={handleSheetChange}>
              <SelectTrigger id="google-sheet" className="h-11">
                <SelectValue placeholder="Select a sheet"/>
              </SelectTrigger>
              <SelectContent>
                {sheets.map((sheet) => (<SelectItem key={sheet.sheetId} value={`${sheet.sheetId}|${sheet.title}`}>
                    <div className="flex items-center gap-2">
                      <Sheet className="w-4 h-4 text-muted-foreground"/>
                      <span>{sheet.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({sheet.rowCount} rows)
                      </span>
                    </div>
                  </SelectItem>))}
              </SelectContent>
            </Select>) : (<Alert>
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>No sheets found in this spreadsheet.</AlertDescription>
            </Alert>)}
        </div>)}

      {/* Sheet Preview */}
      {sheetPreview && (<div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Rows</span>
              <p className="font-medium">{sheetPreview.rowCount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Columns</span>
              <p className="font-medium">{sheetPreview.columnCount}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Column headers will be detected from the first row during field mapping.
          </p>
        </div>)}
    </div>);
}
//# sourceMappingURL=GoogleSheetsSelector.jsx.map