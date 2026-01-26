import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../utils";
import { AirtableSelector } from "../components/wizard/AirtableSelector";
import { GoogleSheetsSelector } from "../components/wizard/GoogleSheetsSelector";
import { FieldMapper } from "../components/wizard/FieldMapper";
import { SyncOptions } from "../components/wizard/SyncOptions";
import { ReviewStep } from "../components/wizard/ReviewStep";

// Wizard step configuration
const STEPS = [
  { id: 1, title: "Select Airtable", description: "Choose your Airtable base and table" },
  { id: 2, title: "Select Google Sheets", description: "Choose your spreadsheet and sheet" },
  { id: 3, title: "Map Fields", description: "Map Airtable fields to sheet columns" },
  { id: 4, title: "Configure Sync", description: "Set sync direction and conflict resolution" },
  { id: 5, title: "Review", description: "Review and create your sync" },
] as const;

// Form data type
interface SyncFormData {
  // Step 1: Airtable selection
  airtableBaseId?: string;
  airtableBaseName?: string;
  airtableTableId?: string;
  airtableTableName?: string;

  // Step 2: Google Sheets selection
  googleSpreadsheetId?: string;
  googleSpreadsheetName?: string;
  googleSheetId?: string;
  googleSheetName?: string;

  // Step 3: Field mappings
  fieldMappings?: Record<string, number>;

  // Step 4: Sync configuration
  syncName?: string;
  syncDirection?: "AIRTABLE_TO_SHEETS" | "SHEETS_TO_AIRTABLE" | "BIDIRECTIONAL";
  conflictResolution?: "AIRTABLE_WINS" | "SHEETS_WINS" | "NEWEST_WINS";
}

export default function NewSyncPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SyncFormData>({});

  // Update form data
  const updateFormData = (data: Partial<SyncFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.airtableBaseId && formData.airtableTableId);
      case 2:
        return !!(formData.googleSpreadsheetId && formData.googleSheetId);
      case 3:
        return !!(formData.fieldMappings && Object.keys(formData.fieldMappings).length > 0);
      case 4:
        return !!(formData.syncName && formData.syncDirection);
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <AirtableSelectionStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <GoogleSheetsSelectionStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <FieldMappingStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <SyncConfigurationStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <ReviewStepWrapper formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Gradient Orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower"
          aria-hidden="true"
        />
      </div>

      <div className="py-10 lg:mt-10">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4 hover:bg-cyan-500/5 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">Setup Wizard</span>
            </div>

            <h1 className="text-foreground text-4xl md:text-5xl font-bold mb-2">
              Create New Sync
            </h1>
            <p className="text-muted-foreground text-lg">
              Set up a new sync configuration between Airtable and Google Sheets
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 animate-fade-in-delayed">
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />

              {/* Active Progress Bar */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 -z-10 transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                }}
              />

              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-background z-10",
                        {
                          "border-cyan-500 shadow-lg shadow-cyan-500/20": currentStep >= step.id,
                          "border-muted": currentStep < step.id,
                        }
                      )}
                    >
                      {currentStep > step.id ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full" />
                          <Check className="h-5 w-5 text-white relative z-10" />
                        </>
                      ) : (
                        <span
                          className={cn("text-sm font-bold font-mono", {
                            "text-gradient-sync": currentStep === step.id,
                            "text-muted-foreground": currentStep < step.id,
                          })}
                        >
                          {step.id}
                        </span>
                      )}

                      {/* Active Step Glow */}
                      {currentStep === step.id && (
                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md animate-pulse" />
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="mt-3 text-center max-w-[100px]">
                      <div
                        className={cn("text-xs font-medium transition-colors", {
                          "text-foreground": currentStep >= step.id,
                          "text-muted-foreground": currentStep < step.id,
                        })}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-6 border-cyan-500/20 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-delayed-more">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50 pointer-events-none" />

            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
                <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between animate-fade-in-delayed-more">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
              <span className="text-sm font-mono text-muted-foreground">
                Step <span className="text-gradient-sync font-bold">{currentStep}</span> of {STEPS.length}
              </span>
            </div>

            {currentStep < STEPS.length && (
              <Button
                onClick={goToNextStep}
                disabled={!canGoNext()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components

function AirtableSelectionStep({
  formData,
  updateFormData,
}: {
  formData: SyncFormData;
  updateFormData: (data: Partial<SyncFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <p className="text-sm text-muted-foreground">
          Select your Airtable base and table to sync from.
        </p>
      </div>
      <AirtableSelector
        value={{
          baseId: formData.airtableBaseId,
          baseName: formData.airtableBaseName,
          tableId: formData.airtableTableId,
          tableName: formData.airtableTableName,
        }}
        onChange={(data) => updateFormData({
          airtableBaseId: data.baseId,
          airtableBaseName: data.baseName,
          airtableTableId: data.tableId,
          airtableTableName: data.tableName,
        })}
      />
    </div>
  );
}

function GoogleSheetsSelectionStep({
  formData,
  updateFormData,
}: {
  formData: SyncFormData;
  updateFormData: (data: Partial<SyncFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <p className="text-sm text-muted-foreground">
          Select your Google Spreadsheet and sheet to sync to.
        </p>
      </div>
      <GoogleSheetsSelector
        value={{
          spreadsheetId: formData.googleSpreadsheetId,
          spreadsheetName: formData.googleSpreadsheetName,
          sheetId: formData.googleSheetId,
          sheetName: formData.googleSheetName,
        }}
        onChange={(data) => updateFormData({
          googleSpreadsheetId: data.spreadsheetId,
          googleSpreadsheetName: data.spreadsheetName,
          googleSheetId: data.sheetId,
          googleSheetName: data.sheetName,
        })}
      />
    </div>
  );
}

function FieldMappingStep({
  formData,
  updateFormData,
}: {
  formData: SyncFormData;
  updateFormData: (data: Partial<SyncFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 border border-cyan-500/20">
        <p className="text-sm text-muted-foreground">
          Map Airtable fields to Google Sheets columns. We'll automatically suggest mappings based on field names.
        </p>
      </div>
      <FieldMapper
        value={{
          airtableBaseId: formData.airtableBaseId,
          airtableTableId: formData.airtableTableId,
          googleSpreadsheetId: formData.googleSpreadsheetId,
          googleSheetId: formData.googleSheetId,
          fieldMappings: formData.fieldMappings,
        }}
        onChange={(data) => updateFormData({
          fieldMappings: data.fieldMappings,
        })}
      />
    </div>
  );
}

function SyncConfigurationStep({
  formData,
  updateFormData,
}: {
  formData: SyncFormData;
  updateFormData: (data: Partial<SyncFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-sm text-muted-foreground">
          Configure how your data will sync between Airtable and Google Sheets.
        </p>
      </div>
      <SyncOptions
        value={{
          airtableBaseName: formData.airtableBaseName,
          airtableTableName: formData.airtableTableName,
          googleSpreadsheetName: formData.googleSpreadsheetName,
          googleSheetName: formData.googleSheetName,
          syncName: formData.syncName,
          syncDirection: formData.syncDirection,
          conflictResolution: formData.conflictResolution,
        }}
        onChange={(data) => updateFormData({
          syncName: data.syncName,
          syncDirection: data.syncDirection,
          conflictResolution: data.conflictResolution,
        })}
      />
    </div>
  );
}

function ReviewStepWrapper({ formData }: { formData: SyncFormData }) {
  return (
    <div className="space-y-4">
      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20">
        <p className="text-sm text-muted-foreground">
          Review your sync configuration before creating.
        </p>
      </div>
      <ReviewStep formData={formData} />
    </div>
  );
}
