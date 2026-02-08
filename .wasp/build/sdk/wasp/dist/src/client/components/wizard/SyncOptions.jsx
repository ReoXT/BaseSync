import { ArrowLeftRight, ArrowRight, Check, Clock, } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../utils";
export function SyncOptions({ value, onChange }) {
    const [syncName, setSyncName] = useState(value.syncName || "");
    const [syncDirection, setSyncDirection] = useState(value.syncDirection);
    const [conflictResolution, setConflictResolution] = useState(value.conflictResolution);
    useEffect(() => {
        if (!syncName && value.airtableTableName && value.googleSheetName) {
            const defaultName = `${value.airtableTableName} → ${value.googleSheetName}`;
            setSyncName(defaultName);
            onChange({ syncName: defaultName, syncDirection, conflictResolution });
        }
    }, [value.airtableTableName, value.googleSheetName]);
    const handleSyncNameChange = (newName) => {
        setSyncName(newName);
        onChange({ syncName: newName, syncDirection, conflictResolution });
    };
    const handleDirectionChange = (newDirection) => {
        setSyncDirection(newDirection);
        if (newDirection !== "BIDIRECTIONAL") {
            setConflictResolution(undefined);
            onChange({ syncName, syncDirection: newDirection, conflictResolution: undefined });
        }
        else {
            const defaultConflictResolution = conflictResolution || "NEWEST_WINS";
            setConflictResolution(defaultConflictResolution);
            onChange({
                syncName,
                syncDirection: newDirection,
                conflictResolution: defaultConflictResolution,
            });
        }
    };
    const handleConflictResolutionChange = (newResolution) => {
        setConflictResolution(newResolution);
        onChange({ syncName, syncDirection, conflictResolution: newResolution });
    };
    const directionOptions = [
        {
            value: "AIRTABLE_TO_SHEETS",
            icon: <ArrowRight className="h-4 w-4"/>,
            label: "Airtable → Sheets",
            description: "One-way sync from Airtable",
        },
        {
            value: "SHEETS_TO_AIRTABLE",
            icon: <ArrowRight className="h-4 w-4 rotate-180"/>,
            label: "Sheets → Airtable",
            description: "One-way sync from Sheets",
        },
        {
            value: "BIDIRECTIONAL",
            icon: <ArrowLeftRight className="h-4 w-4"/>,
            label: "Bidirectional",
            description: "Two-way sync",
            recommended: true,
        },
    ];
    const conflictOptions = [
        {
            value: "AIRTABLE_WINS",
            label: "Airtable wins",
            description: "Airtable takes priority",
        },
        {
            value: "SHEETS_WINS",
            label: "Sheets wins",
            description: "Sheets takes priority",
        },
        {
            value: "NEWEST_WINS",
            label: "Newest wins",
            description: "Most recent change wins",
            recommended: true,
        },
    ];
    return (<div className="space-y-8">
      {/* Sync Name */}
      <div className="space-y-2">
        <Label htmlFor="sync-name" className="text-sm font-medium">
          Sync Name
        </Label>
        <Input id="sync-name" placeholder="e.g., Customer Data Sync" value={syncName} onChange={(e) => handleSyncNameChange(e.target.value)} className="h-11 bg-card/60 border-border/60 focus-visible:ring-cyan-500/30"/>
        <p className="text-xs text-muted-foreground">
          Choose a name to identify this sync
        </p>
      </div>

      {/* Sync Direction */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sync Direction</Label>
        <div className="grid gap-2">
          {directionOptions.map((option) => (<button key={option.value} type="button" onClick={() => handleDirectionChange(option.value)} className={cn("flex items-center gap-3 p-4 rounded-lg border text-left transition-all bg-card/50 backdrop-blur-sm", syncDirection === option.value
                ? "border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 shadow-sm"
                : "border-border/60 hover:border-cyan-500/30 hover:bg-muted/40")}>
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", syncDirection === option.value
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm shadow-cyan-500/30"
                : "bg-muted text-muted-foreground")}>
                {syncDirection === option.value ? (<Check className="h-4 w-4"/>) : (option.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.recommended && (<span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono">
                      Recommended
                    </span>)}
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </button>))}
        </div>
      </div>

      {/* Conflict Resolution - Only for bidirectional */}
      {syncDirection === "BIDIRECTIONAL" && (<div className="space-y-3">
          <Label className="text-sm font-medium">Conflict Resolution</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            How to handle simultaneous changes
          </p>
          <div className="grid gap-2">
            {conflictOptions.map((option) => (<button key={option.value} type="button" onClick={() => handleConflictResolutionChange(option.value)} className={cn("flex items-center gap-3 p-3 rounded-lg border text-left transition-all bg-card/50 backdrop-blur-sm", conflictResolution === option.value
                    ? "border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 shadow-sm"
                    : "border-border/60 hover:border-cyan-500/30 hover:bg-muted/40")}>
              <div className={cn("flex items-center justify-center w-6 h-6 rounded-full border-2", conflictResolution === option.value
                    ? "border-cyan-500 bg-gradient-to-r from-cyan-500 to-blue-500"
                    : "border-muted-foreground/30")}>
                {conflictResolution === option.value && (<Check className="h-3 w-3 text-white"/>)}
              </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.recommended && (<span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono">
                      Recommended
                    </span>)}
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </button>))}
          </div>
        </div>)}

      {/* Sync frequency info */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-sm">
        <Clock className="h-4 w-4 text-cyan-500 mt-0.5"/>
        <div>
          <p className="text-sm font-medium">Automatic sync every 5 minutes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You can also trigger manual syncs anytime from the dashboard.
          </p>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SyncOptions.jsx.map