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
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Your Sync Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Please review all settings before creating your sync. You can go back to edit any step.
        </p>
      </div>

      {/* Sync Name Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sync Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{formData.syncName || "Not configured"}</p>
        </CardContent>
      </Card>

      {/* Source & Destination Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Airtable */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Airtable</span>
            </div>
            <div className="pl-6">
              <p className="font-medium">
                {formData.airtableBaseName || "Unknown Base"}
                <ArrowRight className="inline-block h-4 w-4 mx-2 text-muted-foreground" />
                {formData.airtableTableName || "Unknown Table"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Google Sheets */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Google Sheets</span>
            </div>
            <div className="pl-6">
              <p className="font-medium">
                {formData.googleSpreadsheetName || "Unknown Spreadsheet"}
                <ArrowRight className="inline-block h-4 w-4 mx-2 text-muted-foreground" />
                {formData.googleSheetName || "Unknown Sheet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Mappings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Table className="h-4 w-4" />
            Field Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="font-medium">
              {mappedFieldCount} field{mappedFieldCount !== 1 ? "s" : ""} mapped
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {mappedFieldCount === 0
              ? "No fields mapped"
              : `${mappedFieldCount} Airtable field${
                  mappedFieldCount !== 1 ? "s" : ""
                } will sync to Google Sheets columns`}
          </p>
        </CardContent>
      </Card>

      {/* Sync Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Direction */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Sync Direction</p>
            <div className="flex items-center gap-2">
              {syncDirection.icon}
              <div>
                <p className="font-medium">{syncDirection.text}</p>
                <p className="text-sm text-muted-foreground">{syncDirection.description}</p>
              </div>
            </div>
          </div>

          {/* Conflict Resolution (if bidirectional) */}
          {formData.syncDirection === "BIDIRECTIONAL" && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Conflict Resolution
                </p>
                <p className="font-medium">{getConflictResolutionDisplay()}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Sync Frequency */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Sync Frequency</p>
            <p className="font-medium">Every 5 minutes (automatic)</p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Success Indicator */}
      {!createError && mappedFieldCount > 0 && formData.syncDirection && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>Configuration looks good!</strong> Click "Create Sync" to start syncing your
            data.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if incomplete */}
      {(!formData.syncName ||
        !formData.airtableTableId ||
        !formData.googleSheetId ||
        mappedFieldCount === 0 ||
        !formData.syncDirection) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
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
        >
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
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Sync...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Sync
            </>
          )}
        </Button>
      </div>

      {/* Info about what happens next */}
      {!isCreating && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Initial bulk sync will run to transfer existing data</li>
              <li>Automatic sync will run every 5 minutes to keep data in sync</li>
              <li>You can manually trigger syncs anytime from the dashboard</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
