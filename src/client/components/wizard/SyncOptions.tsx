import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
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
      <div className="space-y-3 animate-fade-in">
        <Label htmlFor="sync-name" className="text-sm font-medium flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          Sync Configuration Name
        </Label>
        <div className="relative group">
          <Input
            id="sync-name"
            placeholder="e.g., Customer Data → Leads Sheet"
            value={syncName}
            onChange={(e) => handleSyncNameChange(e.target.value)}
            className="h-12 text-base border-cyan-500/20 hover:border-cyan-500/40 bg-card/50 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300"
          />
          {syncName && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Choose a descriptive name to identify this sync configuration
        </p>
      </div>

      <Separator className="bg-border/50" />

      {/* Sync Direction */}
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-emerald-500 rounded-full" />
          <div>
            <Label className="text-base font-semibold">Sync Direction</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how data should flow between Airtable and Google Sheets
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {/* Airtable to Sheets */}
          <Card
            className={cn(
              "relative cursor-pointer transition-all duration-300 overflow-hidden group",
              syncDirection === "AIRTABLE_TO_SHEETS"
                ? "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-red-500/5 shadow-lg shadow-orange-500/10"
                : "border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5"
            )}
            onClick={() => handleDirectionChange("AIRTABLE_TO_SHEETS")}
          >
            {syncDirection === "AIRTABLE_TO_SHEETS" && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            )}
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                    syncDirection === "AIRTABLE_TO_SHEETS"
                      ? "border-orange-500 bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30"
                      : "border-muted-foreground group-hover:border-orange-500/50"
                  )}
                >
                  {syncDirection === "AIRTABLE_TO_SHEETS" && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-semibold text-foreground">Airtable</span>
                    <ArrowRight className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      syncDirection === "AIRTABLE_TO_SHEETS" ? "text-orange-400" : "text-muted-foreground"
                    )} />
                    <span className="font-semibold text-foreground">Google Sheets</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    One-way sync from Airtable to Sheets. Changes in Sheets won't affect Airtable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sheets to Airtable */}
          <Card
            className={cn(
              "relative cursor-pointer transition-all duration-300 overflow-hidden group",
              syncDirection === "SHEETS_TO_AIRTABLE"
                ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-green-500/5 shadow-lg shadow-emerald-500/10"
                : "border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
            )}
            onClick={() => handleDirectionChange("SHEETS_TO_AIRTABLE")}
          >
            {syncDirection === "SHEETS_TO_AIRTABLE" && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            )}
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                    syncDirection === "SHEETS_TO_AIRTABLE"
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30"
                      : "border-muted-foreground group-hover:border-emerald-500/50"
                  )}
                >
                  {syncDirection === "SHEETS_TO_AIRTABLE" && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-semibold text-foreground">Google Sheets</span>
                    <ArrowRight className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      syncDirection === "SHEETS_TO_AIRTABLE" ? "text-emerald-400" : "text-muted-foreground"
                    )} />
                    <span className="font-semibold text-foreground">Airtable</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    One-way sync from Sheets to Airtable. Changes in Airtable won't affect Sheets.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bidirectional */}
          <Card
            className={cn(
              "relative cursor-pointer transition-all duration-300 overflow-hidden group",
              syncDirection === "BIDIRECTIONAL"
                ? "border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 shadow-lg shadow-cyan-500/10"
                : "border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5"
            )}
            onClick={() => handleDirectionChange("BIDIRECTIONAL")}
          >
            {syncDirection === "BIDIRECTIONAL" && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
            )}
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                    syncDirection === "BIDIRECTIONAL"
                      ? "border-cyan-500 bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30"
                      : "border-muted-foreground group-hover:border-cyan-500/50"
                  )}
                >
                  {syncDirection === "BIDIRECTIONAL" && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-semibold text-foreground">Airtable</span>
                    <ArrowLeftRight className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      syncDirection === "BIDIRECTIONAL" ? "text-cyan-400 animate-pulse" : "text-muted-foreground"
                    )} />
                    <span className="font-semibold text-foreground">Google Sheets</span>
                    {syncDirection === "BIDIRECTIONAL" && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Two-way sync keeps both Airtable and Sheets in sync. Recommended for most use cases.
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
          <Separator className="bg-border/50" />

          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              <div>
                <Label className="text-base font-semibold">Conflict Resolution</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  What happens when the same record is changed in both places?
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {/* Airtable Wins */}
              <Card
                className={cn(
                  "relative cursor-pointer transition-all duration-300 overflow-hidden group",
                  conflictResolution === "AIRTABLE_WINS"
                    ? "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-red-500/5 shadow-lg shadow-orange-500/10"
                    : "border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5"
                )}
                onClick={() => handleConflictResolutionChange("AIRTABLE_WINS")}
              >
                {conflictResolution === "AIRTABLE_WINS" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                )}
                <CardContent className="p-4 relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                        conflictResolution === "AIRTABLE_WINS"
                          ? "border-orange-500 bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30"
                          : "border-muted-foreground group-hover:border-orange-500/50"
                      )}
                    >
                      {conflictResolution === "AIRTABLE_WINS" && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-foreground">Airtable Wins</h4>
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
                  "relative cursor-pointer transition-all duration-300 overflow-hidden group",
                  conflictResolution === "SHEETS_WINS"
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-green-500/5 shadow-lg shadow-emerald-500/10"
                    : "border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                )}
                onClick={() => handleConflictResolutionChange("SHEETS_WINS")}
              >
                {conflictResolution === "SHEETS_WINS" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                )}
                <CardContent className="p-4 relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                        conflictResolution === "SHEETS_WINS"
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30"
                          : "border-muted-foreground group-hover:border-emerald-500/50"
                      )}
                    >
                      {conflictResolution === "SHEETS_WINS" && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-foreground">Google Sheets Wins</h4>
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
                  "relative cursor-pointer transition-all duration-300 overflow-hidden group",
                  conflictResolution === "NEWEST_WINS"
                    ? "border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-purple-500/5 shadow-lg shadow-blue-500/10"
                    : "border-border/50 hover:border-blue-500/30 hover:bg-blue-500/5"
                )}
                onClick={() => handleConflictResolutionChange("NEWEST_WINS")}
              >
                {conflictResolution === "NEWEST_WINS" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                )}
                <CardContent className="p-4 relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                        conflictResolution === "NEWEST_WINS"
                          ? "border-blue-500 bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
                          : "border-muted-foreground group-hover:border-blue-500/50"
                      )}
                    >
                      {conflictResolution === "NEWEST_WINS" && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">Newest Change Wins</h4>
                        {conflictResolution === "NEWEST_WINS" && (
                          <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
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

      <Separator className="bg-border/50" />

      {/* Sync Frequency Info */}
      <Alert className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 animate-fade-in">
        <Clock className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-blue-400">⚡ Automatic Sync Frequency</p>
            <p className="text-sm text-muted-foreground">
              Your sync will run automatically every <strong className="text-foreground">5 minutes</strong> when active. You can also trigger manual syncs anytime from the dashboard.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Prerequisites check */}
      {!value.airtableTableName && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Please complete the previous steps to select your Airtable table and Google Sheet.
          </AlertDescription>
        </Alert>
      )}

      {/* Success state */}
      {syncName && syncDirection && (
        <Alert className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5 animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-foreground">
            <strong className="text-emerald-400">Configuration complete!</strong> Click Next to review your sync setup.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
