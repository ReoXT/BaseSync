import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getSyncConfigById, useQuery } from "wasp/client/operations";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import NewSyncPage from "./NewSyncPage";

/**
 * EditSyncPage - Wrapper component for editing existing sync configurations
 * Fetches the sync config and renders NewSyncPage in edit mode
 */
export default function EditSyncPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch the existing sync configuration
  const {
    data: syncConfig,
    isLoading,
    error,
  } = useQuery(getSyncConfigById, { syncConfigId: id || "" });

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen pb-20 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 py-10 lg:mt-10">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4 hover:bg-cyan-500/5 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
              <div className="flex flex-col items-center justify-center gap-3 relative">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                <span className="text-lg font-mono text-cyan-400">Loading sync configuration...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !syncConfig) {
    return (
      <div className="relative min-h-screen pb-20 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 py-10 lg:mt-10">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4 hover:bg-cyan-500/5 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <Alert variant="destructive" className="border-red-500/50 bg-red-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error
                  ? `Failed to load sync configuration: ${error.message}`
                  : "Sync configuration not found"}
              </AlertDescription>
            </Alert>

            <div className="mt-4">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parse field mappings from JSON
  let fieldMappings: Record<string, number> = {};
  try {
    if (syncConfig.fieldMappings) {
      if (typeof syncConfig.fieldMappings === 'string') {
        fieldMappings = JSON.parse(syncConfig.fieldMappings);
      } else {
        fieldMappings = syncConfig.fieldMappings as Record<string, number>;
      }
    }
  } catch (e) {
    console.error("Failed to parse field mappings:", e);
  }

  // Prepare initial data for the wizard
  const initialData = {
    airtableBaseId: syncConfig.airtableBaseId,
    airtableBaseName: (syncConfig as any).airtableBaseName || undefined,
    airtableTableId: syncConfig.airtableTableId,
    airtableTableName: syncConfig.airtableTableName || undefined,
    airtableViewId: (syncConfig as any).airtableViewId || undefined,
    googleSpreadsheetId: syncConfig.googleSpreadsheetId,
    googleSpreadsheetName: (syncConfig as any).googleSpreadsheetName || undefined,
    googleSheetId: syncConfig.googleSheetId,
    googleSheetName: syncConfig.googleSheetName || undefined,
    fieldMappings,
    syncName: syncConfig.name,
    syncDirection: syncConfig.syncDirection as "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL",
    conflictResolution: syncConfig.conflictResolution as "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS" | undefined,
  };

  // Render NewSyncPage in edit mode
  return <NewSyncPage isEditMode={true} syncConfigId={id} initialData={initialData} />;
}
