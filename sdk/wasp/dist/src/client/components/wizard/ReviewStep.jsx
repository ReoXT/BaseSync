import { AlertCircle, Check, Loader2, } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSyncConfig, updateSyncConfig, runInitialSync } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
export function ReviewStep({ formData, isEditMode = false, syncConfigId }) {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const getSyncDirectionLabel = () => {
        switch (formData.syncDirection) {
            case "AIRTABLE_TO_SHEETS":
                return "Airtable → Sheets";
            case "SHEETS_TO_AIRTABLE":
                return "Sheets → Airtable";
            case "BIDIRECTIONAL":
                return "Bidirectional";
            default:
                return "Not set";
        }
    };
    const getConflictLabel = () => {
        switch (formData.conflictResolution) {
            case "AIRTABLE_WINS":
                return "Airtable wins";
            case "SHEETS_WINS":
                return "Sheets wins";
            case "NEWEST_WINS":
                return "Newest wins";
            default:
                return "—";
        }
    };
    const handleCreateSync = async () => {
        setIsCreating(true);
        setCreateError(null);
        try {
            if (!formData.syncName)
                throw new Error("Sync name is required");
            if (!formData.fieldMappings || Object.keys(formData.fieldMappings).length === 0) {
                throw new Error("At least one field mapping is required");
            }
            if (!formData.syncDirection)
                throw new Error("Sync direction is required");
            if (isEditMode && syncConfigId) {
                await updateSyncConfig({
                    syncConfigId,
                    name: formData.syncName,
                    fieldMappings: formData.fieldMappings,
                    syncDirection: formData.syncDirection,
                    conflictResolution: formData.conflictResolution,
                });
                navigate("/dashboard", {
                    state: { successMessage: `Sync "${formData.syncName}" updated successfully!` },
                });
            }
            else {
                if (!formData.airtableBaseId || !formData.airtableTableId) {
                    throw new Error("Airtable base and table are required");
                }
                if (!formData.googleSpreadsheetId || !formData.googleSheetId) {
                    throw new Error("Google Spreadsheet and sheet are required");
                }
                const result = await createSyncConfig({
                    name: formData.syncName,
                    airtableBaseId: formData.airtableBaseId,
                    airtableBaseName: formData.airtableBaseName,
                    airtableTableId: formData.airtableTableId,
                    airtableTableName: formData.airtableTableName,
                    airtableViewId: formData.airtableViewId,
                    googleSpreadsheetId: formData.googleSpreadsheetId,
                    googleSpreadsheetName: formData.googleSpreadsheetName,
                    googleSheetId: formData.googleSheetId,
                    googleSheetName: formData.googleSheetName,
                    fieldMappings: formData.fieldMappings,
                    syncDirection: formData.syncDirection,
                    conflictResolution: formData.conflictResolution,
                });
                try {
                    await runInitialSync({ syncConfigId: result.id });
                }
                catch (syncError) {
                    console.warn("Initial sync trigger failed:", syncError);
                }
                navigate("/dashboard", {
                    state: { successMessage: `Sync "${formData.syncName}" created! Initial sync is running.` },
                });
            }
        }
        catch (error) {
            console.error(`Failed to ${isEditMode ? "update" : "create"} sync:`, error);
            setCreateError(error instanceof Error ? error.message : `Failed to ${isEditMode ? "update" : "create"} sync`);
            setIsCreating(false);
        }
    };
    const mappedFieldCount = Object.keys(formData.fieldMappings || {}).length;
    const isComplete = !!(formData.syncName &&
        formData.airtableTableId &&
        formData.googleSheetId &&
        mappedFieldCount > 0 &&
        formData.syncDirection);
    const summaryRows = [
        { label: "Name", value: formData.syncName || "—" },
        {
            label: "Airtable",
            value: formData.airtableBaseName && formData.airtableTableName
                ? `${formData.airtableBaseName} › ${formData.airtableTableName}`
                : "—",
        },
        {
            label: "Google Sheets",
            value: formData.googleSpreadsheetName && formData.googleSheetName
                ? `${formData.googleSpreadsheetName} › ${formData.googleSheetName}`
                : "—",
        },
        { label: "Direction", value: getSyncDirectionLabel() },
        ...(formData.syncDirection === "BIDIRECTIONAL"
            ? [{ label: "Conflicts", value: getConflictLabel() }]
            : []),
        { label: "Fields", value: `${mappedFieldCount} mapped` },
        { label: "Frequency", value: "Every 5 minutes" },
    ];
    return (<div className="space-y-6">
      {/* Summary Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {summaryRows.map((row, index) => (<tr key={index} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground w-32">{row.label}</td>
                <td className="px-4 py-3 font-medium">{row.value}</td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Error */}
      {createError && (<Alert variant="destructive">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>{createError}</AlertDescription>
        </Alert>)}

      {/* Incomplete Warning */}
      {!isComplete && (<Alert>
          <AlertCircle className="h-4 w-4 text-yellow-500"/>
          <AlertDescription className="text-muted-foreground">
            Complete all previous steps before {isEditMode ? "updating" : "creating"} the sync.
          </AlertDescription>
        </Alert>)}

      {/* Create Button */}
      <Button onClick={handleCreateSync} disabled={isCreating || !isComplete} className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50">
        {isCreating ? (<>
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            {isEditMode ? "Updating..." : "Creating..."}
          </>) : (<>
            <Check className="mr-2 h-4 w-4"/>
            {isEditMode ? "Update Sync" : "Create Sync"}
          </>)}
      </Button>

      {/* What happens next - Minimal */}
      {isComplete && !isCreating && (<p className="text-xs text-muted-foreground text-center">
          {isEditMode
                ? "Changes apply on the next sync run."
                : "We'll run an initial sync, then sync automatically every 5 minutes."}
        </p>)}
    </div>);
}
//# sourceMappingURL=ReviewStep.jsx.map