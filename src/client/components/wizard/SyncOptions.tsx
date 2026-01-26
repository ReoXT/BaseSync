import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Clock,
  Info,
  MoveRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { cn } from "../../utils";

export interface SyncOptionsData {
  syncName?: string;
  syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
  conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}

export interface SyncOptionsProps {
  /** Current selection data from previous steps */
  value: {
    airtableBaseName?: string;
    airtableTableName?: string;
    googleSpreadsheetName?: string;
    googleSheetName?: string;
    syncName?: string;
    syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
    conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
  };
  /** Callback when options change */
  onChange: (data: SyncOptionsData) => void;
}

/**
 * Step 4: Sync Configuration
 * Configure sync name, direction, and conflict resolution
 */
export function SyncOptions({ value, onChange }: SyncOptionsProps) {
  const [syncName, setSyncName] = useState(value.syncName || "");
  const [syncDirection, setSyncDirection] = useState<
    "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL" | undefined
  >(value.syncDirection);
  const [conflictResolution, setConflictResolution] = useState<
    "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS" | undefined
  >(value.conflictResolution);

  // Generate default sync name from source and destination
  useEffect(() => {
    if (!syncName && value.airtableTableName && value.googleSheetName) {
      const defaultName = `${value.airtableTableName} → ${value.googleSheetName}`;
      setSyncName(defaultName);
      onChange({ syncName: defaultName, syncDirection, conflictResolution });
    }
  }, [value.airtableTableName, value.googleSheetName]);

  // Update parent when values change
  const handleSyncNameChange = (newName: string) => {
    setSyncName(newName);
    onChange({ syncName: newName, syncDirection, conflictResolution });
  };

  const handleDirectionChange = (
    newDirection: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL"
  ) => {
    setSyncDirection(newDirection);

    // Reset conflict resolution if not bidirectional
    if (newDirection !== "BIDIRECTIONAL") {
      setConflictResolution(undefined);
      onChange({ syncName, syncDirection: newDirection, conflictResolution: undefined });
    } else {
      // Set default conflict resolution for bidirectional
      const defaultConflictResolution = conflictResolution || "NEWEST_WINS";
      setConflictResolution(defaultConflictResolution);
      onChange({
        syncName,
        syncDirection: newDirection,
        conflictResolution: defaultConflictResolution,
      });
    }
  };

  const handleConflictResolutionChange = (
    newResolution: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS"
  ) => {
    setConflictResolution(newResolution);
    onChange({ syncName, syncDirection, conflictResolution: newResolution });
  };

  return (
    <div className="space-y-6">
      {/* Sync Name */}
      <div className="space-y-2">
        <Label htmlFor="sync-name">Sync Configuration Name</Label>
        <Input
          id="sync-name"
          placeholder="e.g., Customer Data → Leads Sheet"
          value={syncName}
          onChange={(e) => handleSyncNameChange(e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Choose a descriptive name to identify this sync configuration
        </p>
      </div>

      <Separator />

      {/* Sync Direction */}
      <div className="space-y-3">
        <div>
          <Label className="text-base">Sync Direction</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Choose how data should flow between Airtable and Google Sheets
          </p>
        </div>

        <div className="grid gap-3">
          {/* Airtable to Sheets */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              syncDirection === "AIRTABLE_TO_SHEETS"
                ? "border-primary border-2 bg-primary/5"
                : "border-muted"
            )}
            onClick={() => handleDirectionChange("AIRTABLE_TO_SHEETS")}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                    syncDirection === "AIRTABLE_TO_SHEETS"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {syncDirection === "AIRTABLE_TO_SHEETS" && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Airtable</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Google Sheets</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    One-way sync from Airtable to Sheets. Changes in Sheets won't affect Airtable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sheets to Airtable */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              syncDirection === "SHEETS_TO_AIRTABLE"
                ? "border-primary border-2 bg-primary/5"
                : "border-muted"
            )}
            onClick={() => handleDirectionChange("SHEETS_TO_AIRTABLE")}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                    syncDirection === "SHEETS_TO_AIRTABLE"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {syncDirection === "SHEETS_TO_AIRTABLE" && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Google Sheets</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Airtable</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    One-way sync from Sheets to Airtable. Changes in Airtable won't affect Sheets.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bidirectional */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              syncDirection === "BIDIRECTIONAL"
                ? "border-primary border-2 bg-primary/5"
                : "border-muted"
            )}
            onClick={() => handleDirectionChange("BIDIRECTIONAL")}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                    syncDirection === "BIDIRECTIONAL"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {syncDirection === "BIDIRECTIONAL" && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Airtable</span>
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Google Sheets</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Two-way sync keeps both Airtable and Sheets in sync. Recommended for most use
                    cases.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conflict Resolution - Only shown for bidirectional */}
      {syncDirection === "BIDIRECTIONAL" && (
        <>
          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-base">Conflict Resolution</Label>
              <p className="text-xs text-muted-foreground mt-1">
                What happens when the same record is changed in both places?
              </p>
            </div>

            <div className="grid gap-3">
              {/* Airtable Wins */}
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  conflictResolution === "AIRTABLE_WINS"
                    ? "border-primary border-2 bg-primary/5"
                    : "border-muted"
                )}
                onClick={() => handleConflictResolutionChange("AIRTABLE_WINS")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                        conflictResolution === "AIRTABLE_WINS"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {conflictResolution === "AIRTABLE_WINS" && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Airtable Wins</h4>
                      <p className="text-sm text-muted-foreground">
                        Airtable always takes priority. Use when Airtable is your source of truth.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sheets Wins */}
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  conflictResolution === "SHEETS_WINS"
                    ? "border-primary border-2 bg-primary/5"
                    : "border-muted"
                )}
                onClick={() => handleConflictResolutionChange("SHEETS_WINS")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                        conflictResolution === "SHEETS_WINS"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {conflictResolution === "SHEETS_WINS" && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Google Sheets Wins</h4>
                      <p className="text-sm text-muted-foreground">
                        Sheets always takes priority. Use when your team primarily works in Sheets.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Newest Wins */}
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  conflictResolution === "NEWEST_WINS"
                    ? "border-primary border-2 bg-primary/5"
                    : "border-muted"
                )}
                onClick={() => handleConflictResolutionChange("NEWEST_WINS")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full border-2 mt-0.5",
                        conflictResolution === "NEWEST_WINS"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {conflictResolution === "NEWEST_WINS" && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Newest Change Wins (Recommended)</h4>
                      <p className="text-sm text-muted-foreground">
                        Most recent change takes priority, regardless of source. Smart and flexible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Sync Frequency Info */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <div className="space-y-1">
            <p className="font-medium">Automatic Sync Frequency</p>
            <p className="text-sm">
              Your sync will run automatically every <strong>5 minutes</strong> when active. You can
              also trigger manual syncs anytime from the dashboard.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Prerequisites check */}
      {!value.airtableTableName && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete the previous steps to select your Airtable table and Google Sheet.
          </AlertDescription>
        </Alert>
      )}

      {/* Success state */}
      {syncName && syncDirection && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>Configuration complete!</strong> Click Next to review your sync setup.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
