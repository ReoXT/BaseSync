import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Layers,
  Loader2,
  Settings,
  Table,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSyncConfig, runInitialSync } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

export interface ReviewStepData {
  airtableBaseId?: string;
  airtableBaseName?: string;
  airtableTableId?: string;
  airtableTableName?: string;
  airtableViewId?: string;
  googleSpreadsheetId?: string;
  googleSpreadsheetName?: string;
  googleSheetId?: string;
  googleSheetName?: string;
  fieldMappings?: Record<string, number>;
  syncName?: string;
  syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
  conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}

export interface ReviewStepProps {
  /** All configuration data from previous steps */
  formData: ReviewStepData;
}

/**
 * Step 5: Review and Create
 * Final review of all configuration before creating the sync
 */
export function ReviewStep({ formData }: ReviewStepProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Format sync direction for display
  const getSyncDirectionDisplay = () => {
    switch (formData.syncDirection) {
      case "AIRTABLE_TO_SHEETS":
        return {
          icon: <ArrowRight className="h-5 w-5" />,
          text: "Airtable → Google Sheets",
          description: "One-way sync from Airtable to Sheets",
        };
      case "SHEETS_TO_AIRTABLE":
        return {
          icon: <ArrowRight className="h-5 w-5 rotate-180" />,
          text: "Google Sheets → Airtable",
          description: "One-way sync from Sheets to Airtable",
        };
      case "BIDIRECTIONAL":
        return {
          icon: <ArrowLeftRight className="h-5 w-5" />,
          text: "Bidirectional",
          description: "Two-way sync between Airtable and Sheets",
        };
      default:
        return {
          icon: <Settings className="h-5 w-5" />,
          text: "Not configured",
          description: "",
        };
    }
  };

  // Format conflict resolution for display
  const getConflictResolutionDisplay = () => {
    switch (formData.conflictResolution) {
      case "AIRTABLE_WINS":
        return "Airtable always wins";
      case "SHEETS_WINS":
        return "Google Sheets always wins";
      case "NEWEST_WINS":
        return "Newest change wins";
      default:
        return "Not applicable";
    }
  };

  // Handle sync creation
  const handleCreateSync = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      // Validate required fields
      if (!formData.syncName) {
        throw new Error("Sync name is required");
      }
      if (!formData.airtableBaseId || !formData.airtableTableId) {
        throw new Error("Airtable base and table are required");
      }
      if (!formData.googleSpreadsheetId || !formData.googleSheetId) {
        throw new Error("Google Spreadsheet and sheet are required");
      }
      if (!formData.fieldMappings || Object.keys(formData.fieldMappings).length === 0) {
        throw new Error("At least one field mapping is required");
      }
      if (!formData.syncDirection) {
        throw new Error("Sync direction is required");
      }

      // Create the sync configuration
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

      console.log("Sync configuration created:", result);

      // Trigger initial sync in the background
      try {
        await runInitialSync({ syncConfigId: result.id });
        console.log("Initial sync triggered for:", result.id);
      } catch (syncError) {
        console.warn("Initial sync trigger failed (will retry automatically):", syncError);
        // Don't fail the whole creation if initial sync fails - it will run on schedule
      }

      // Redirect to dashboard with success message
      navigate("/dashboard", {
        state: {
          successMessage: `Sync "${formData.syncName}" created successfully! Initial sync is running.`,
        },
      });
    } catch (error) {
      console.error("Failed to create sync:", error);
      setCreateError(error instanceof Error ? error.message : "Failed to create sync configuration");
      setIsCreating(false);
    }
  };

  const syncDirection = getSyncDirectionDisplay();
  const mappedFieldCount = Object.keys(formData.fieldMappings || {}).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <h3 className="text-lg font-bold text-foreground">Review Your Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify all settings before creating your sync. You can go back to edit any step.
        </p>
      </div>

      {/* Sync Name Card */}
      <Card className="relative border-cyan-500/20 bg-card/80 backdrop-blur-sm overflow-hidden group animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-cyan-400" />
            </div>
            <span>Sync Name</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="font-semibold text-foreground text-lg">{formData.syncName || "Not configured"}</p>
        </CardContent>
      </Card>

      {/* Source & Destination Card */}
      <Card className="relative border-emerald-500/20 bg-card/80 backdrop-blur-sm overflow-hidden group animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-emerald-500/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-cyan-400" />
            </div>
            <span>Data Sources</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Airtable */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Database className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Airtable</span>
            </div>
            <div className="pl-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 font-medium text-sm">
                  {formData.airtableBaseName || "Unknown Base"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium text-sm">
                  {formData.airtableTableName || "Unknown Table"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Google Sheets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Google Sheets</span>
            </div>
            <div className="pl-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-medium text-sm">
                  {formData.googleSpreadsheetName || "Unknown Spreadsheet"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium text-sm">
                  {formData.googleSheetName || "Unknown Sheet"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Mappings Card */}
      <Card className="relative border-purple-500/20 bg-card/80 backdrop-blur-sm overflow-hidden group animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Table className="h-4 w-4 text-purple-400" />
            </div>
            <span>Field Mappings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md" />
            </div>
            <div>
              <p className="font-bold text-2xl text-foreground">
                {mappedFieldCount}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                field{mappedFieldCount !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
            {mappedFieldCount === 0
              ? "No fields mapped"
              : `${mappedFieldCount} Airtable field${
                  mappedFieldCount !== 1 ? "s" : ""
                } will sync to Google Sheets columns`}
          </p>
        </CardContent>
      </Card>

      {/* Sync Configuration Card */}
      <Card className="relative border-blue-500/20 bg-card/80 backdrop-blur-sm overflow-hidden group animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <span>Sync Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Sync Direction */}
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Sync Direction</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                {syncDirection.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{syncDirection.text}</p>
                <p className="text-sm text-muted-foreground">{syncDirection.description}</p>
              </div>
            </div>
          </div>

          {/* Conflict Resolution (if bidirectional) */}
          {formData.syncDirection === "BIDIRECTIONAL" && (
            <>
              <Separator className="bg-border/50" />
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                  Conflict Resolution
                </p>
                <div className="px-4 py-3 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20">
                  <p className="font-semibold text-foreground">{getConflictResolutionDisplay()}</p>
                </div>
              </div>
            </>
          )}

          <Separator className="bg-border/50" />

          {/* Sync Frequency */}
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Sync Frequency</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/20">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Every 5 minutes</p>
                <p className="text-sm text-muted-foreground">Automatic background sync</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {createError && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/5 animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Success Indicator */}
      {!createError && mappedFieldCount > 0 && formData.syncDirection && (
        <Alert className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-foreground">
            <strong className="text-emerald-400">Configuration looks good!</strong> Click "Create Sync" to start syncing your data.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if incomplete */}
      {(!formData.syncName ||
        !formData.airtableTableId ||
        !formData.googleSheetId ||
        mappedFieldCount === 0 ||
        !formData.syncDirection) && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Please complete all previous steps before creating the sync configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isCreating}
          className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all duration-300"
        >
          <ArrowLeftRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Edit
        </Button>

        <Button
          onClick={handleCreateSync}
          disabled={
            isCreating ||
            !formData.syncName ||
            !formData.airtableTableId ||
            !formData.googleSheetId ||
            mappedFieldCount === 0 ||
            !formData.syncDirection
          }
          size="lg"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="font-mono">Creating Sync...</span>
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              <span className="font-semibold">Create Sync</span>
            </>
          )}
        </Button>
      </div>

      {/* Info about what happens next */}
      {!isCreating && (
        <Alert className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
          <Zap className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-foreground">
            <p className="font-semibold text-blue-400 mb-2">⚡ What happens next?</p>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Initial bulk sync will run to transfer existing data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Automatic sync will run every 5 minutes to keep data in sync</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>You can manually trigger syncs anytime from the dashboard</span>
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
