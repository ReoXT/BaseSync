import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../utils";

export interface SyncOptionsData {
  syncName?: string;
  syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
  conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}

export interface SyncOptionsProps {
  value: {
    airtableBaseName?: string;
    airtableTableName?: string;
    googleSpreadsheetName?: string;
    googleSheetName?: string;
    syncName?: string;
    syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
    conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
  };
  onChange: (data: SyncOptionsData) => void;
}

export function SyncOptions({ value, onChange }: SyncOptionsProps) {
  const [syncName, setSyncName] = useState(value.syncName || "");
  const [syncDirection, setSyncDirection] = useState<
    "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL" | undefined
  >(value.syncDirection);
  const [conflictResolution, setConflictResolution] = useState<
    "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS" | undefined
  >(value.conflictResolution);

  useEffect(() => {
    if (!syncName && value.airtableTableName && value.googleSheetName) {
      const defaultName = `${value.airtableTableName} → ${value.googleSheetName}`;
      setSyncName(defaultName);
      onChange({ syncName: defaultName, syncDirection, conflictResolution });
    }
  }, [value.airtableTableName, value.googleSheetName]);

  const handleSyncNameChange = (newName: string) => {
    setSyncName(newName);
    onChange({ syncName: newName, syncDirection, conflictResolution });
  };

  const handleDirectionChange = (
    newDirection: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL"
  ) => {
    setSyncDirection(newDirection);

    if (newDirection !== "BIDIRECTIONAL") {
      setConflictResolution(undefined);
      onChange({ syncName, syncDirection: newDirection, conflictResolution: undefined });
    } else {
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

  const directionOptions = [
    {
      value: "AIRTABLE_TO_SHEETS" as const,
      icon: <ArrowRight className="h-4 w-4" />,
      label: "Airtable → Sheets",
      description: "One-way sync from Airtable",
    },
    {
      value: "SHEETS_TO_AIRTABLE" as const,
      icon: <ArrowRight className="h-4 w-4 rotate-180" />,
      label: "Sheets → Airtable",
      description: "One-way sync from Sheets",
    },
    {
      value: "BIDIRECTIONAL" as const,
      icon: <ArrowLeftRight className="h-4 w-4" />,
      label: "Bidirectional",
      description: "Two-way sync",
      recommended: true,
    },
  ];

  const conflictOptions = [
    {
      value: "AIRTABLE_WINS" as const,
      label: "Airtable wins",
      description: "Airtable takes priority",
    },
    {
      value: "SHEETS_WINS" as const,
      label: "Sheets wins",
      description: "Sheets takes priority",
    },
    {
      value: "NEWEST_WINS" as const,
      label: "Newest wins",
      description: "Most recent change wins",
      recommended: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Sync Name */}
      <div className="space-y-2">
        <Label htmlFor="sync-name" className="text-sm font-medium">
          Sync Name
        </Label>
        <Input
          id="sync-name"
          placeholder="e.g., Customer Data Sync"
          value={syncName}
          onChange={(e) => handleSyncNameChange(e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Choose a name to identify this sync
        </p>
      </div>

      {/* Sync Direction */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sync Direction</Label>
        <div className="grid gap-2">
          {directionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDirectionChange(option.value)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                syncDirection === option.value
                  ? "border-cyan-500 bg-cyan-500/5"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                syncDirection === option.value
                  ? "bg-cyan-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {syncDirection === option.value ? (
                  <Check className="h-4 w-4" />
                ) : (
                  option.icon
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      Recommended
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conflict Resolution - Only for bidirectional */}
      {syncDirection === "BIDIRECTIONAL" && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Conflict Resolution</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            How to handle simultaneous changes
          </p>
          <div className="grid gap-2">
            {conflictOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleConflictResolutionChange(option.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  conflictResolution === option.value
                    ? "border-cyan-500 bg-cyan-500/5"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full border-2",
                  conflictResolution === option.value
                    ? "border-cyan-500 bg-cyan-500"
                    : "border-muted-foreground/30"
                )}>
                  {conflictResolution === option.value && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.recommended && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sync frequency info */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium">Automatic sync every 5 minutes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You can also trigger manual syncs anytime from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
