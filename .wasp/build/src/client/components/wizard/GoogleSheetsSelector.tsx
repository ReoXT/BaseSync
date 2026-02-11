import { AlertCircle, Loader2, Sheet, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { validateSpreadsheetUrl } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

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

interface ValidatedSpreadsheet {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheets: Array<{
    sheetId: number;
    title: string;
  }>;
}

interface GoogleSheet {
  sheetId: number;
  title: string;
}

export function GoogleSheetsSelector({ value, onChange }: GoogleSheetsSelectorProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedSpreadsheet, setValidatedSpreadsheet] = useState<ValidatedSpreadsheet | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | undefined>(value.sheetId);

  // Initialize state from props if editing existing selection
  useEffect(() => {
    if (value.spreadsheetId && value.spreadsheetName) {
      // If we have existing spreadsheet data, reconstruct the validated state
      setValidatedSpreadsheet({
        spreadsheetId: value.spreadsheetId,
        spreadsheetTitle: value.spreadsheetName,
        sheets: value.sheetId && value.sheetName ? [{
          sheetId: parseInt(value.sheetId) || 0,
          title: value.sheetName
        }] : []
      });
    }
    if (value.sheetId) {
      setSelectedSheetId(value.sheetId);
    }
  }, [value.spreadsheetId, value.spreadsheetName, value.sheetId, value.sheetName]);

  const handleValidateUrl = async () => {
    if (!spreadsheetUrl.trim()) {
      setValidationError("Please enter a Google Sheets URL");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidatedSpreadsheet(null);
    setSelectedSheetId(undefined);

    try {
      const result = await validateSpreadsheetUrl({ url: spreadsheetUrl });
      setValidatedSpreadsheet(result);

      // Update parent with spreadsheet info (no sheet selected yet)
      onChange({
        spreadsheetId: result.spreadsheetId,
        spreadsheetName: result.spreadsheetTitle,
        sheetId: undefined,
        sheetName: undefined,
      });
    } catch (error) {
      console.error("Failed to validate spreadsheet URL:", error);
      setValidationError(
        error instanceof Error ? error.message : "Failed to validate spreadsheet URL"
      );
      setValidatedSpreadsheet(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSheetChange = (sheetIdAndName: string) => {
    if (!validatedSpreadsheet) return;

    // Split only on first occurrence to handle sheet names containing "|"
    const pipeIndex = sheetIdAndName.indexOf("|");
    if (pipeIndex === -1) return; // Invalid format

    const sheetIdStr = sheetIdAndName.substring(0, pipeIndex);
    const sheetName = sheetIdAndName.substring(pipeIndex + 1);
    setSelectedSheetId(sheetIdStr);

    onChange({
      spreadsheetId: validatedSpreadsheet.spreadsheetId,
      spreadsheetName: validatedSpreadsheet.spreadsheetTitle,
      sheetId: sheetName,
      sheetName,
    });
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="google-sheets-url" className="text-sm font-medium">
          Google Sheets URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="google-sheets-url"
            type="text"
            placeholder="Paste your Google Sheets URL here"
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleValidateUrl();
              }
            }}
            disabled={isValidating}
            className="h-11"
          />
          <Button
            onClick={handleValidateUrl}
            disabled={isValidating || !spreadsheetUrl.trim()}
            className="h-11 px-6"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Validating...
              </>
            ) : (
              "Validate"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Open your Google Sheet and copy the URL from your browser's address bar
        </p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Validated Spreadsheet Info */}
      {validatedSpreadsheet && (
        <div className="space-y-4">
          {/* Spreadsheet Title Display */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <img src="/google-sheets-icon.svg" alt="" className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Spreadsheet found</p>
                <p className="text-sm text-green-700 truncate">{validatedSpreadsheet.spreadsheetTitle}</p>
                <p className="text-xs text-green-600 mt-1">
                  {validatedSpreadsheet.sheets.length} sheet{validatedSpreadsheet.sheets.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
          </div>

          {/* Sheet Selection */}
          <div className="space-y-2">
            <Label htmlFor="google-sheet" className="text-sm font-medium">
              Select Sheet
            </Label>
            <Select value={selectedSheetId} onValueChange={handleSheetChange}>
              <SelectTrigger id="google-sheet" className="h-11">
                <SelectValue placeholder="Select a sheet" />
              </SelectTrigger>
              <SelectContent>
                {validatedSpreadsheet.sheets.map((sheet: GoogleSheet) => (
                  <SelectItem key={sheet.sheetId} value={`${sheet.sheetId}|${sheet.title}`}>
                    <div className="flex items-center gap-2">
                      <Sheet className="w-4 h-4 text-muted-foreground" />
                      <span>{sheet.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select which sheet (tab) to sync with your Airtable table
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
