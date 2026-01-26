import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
    // TODO: Add validation for each step
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
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-foreground text-4xl font-bold">Create New Sync</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new sync configuration between Airtable and Google Sheets
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                      {
                        "bg-primary border-primary text-primary-foreground": currentStep > step.id,
                        "border-primary text-primary": currentStep === step.id,
                        "border-muted text-muted-foreground": currentStep < step.id,
                      }
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <div
                      className={cn("text-xs font-medium", {
                        "text-foreground": currentStep >= step.id,
                        "text-muted-foreground": currentStep < step.id,
                      })}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn("flex-1 h-0.5 mx-2 transition-all", {
                      "bg-primary": currentStep > step.id,
                      "bg-muted": currentStep <= step.id,
                    })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </div>
          {currentStep < STEPS.length && (
            <Button onClick={goToNextStep} disabled={!canGoNext()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components (Placeholders - to be implemented)

function AirtableSelectionStep({
  formData,
  updateFormData,
}: {
  formData: SyncFormData;
  updateFormData: (data: Partial<SyncFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select your Airtable base and table to sync from.
      </p>
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
      <p className="text-muted-foreground text-sm">
        Select your Google Spreadsheet and sheet to sync to.
      </p>
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
      <p className="text-muted-foreground text-sm">
        Map Airtable fields to Google Sheets columns. We'll automatically suggest mappings based on field names.
      </p>
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
      <p className="text-muted-foreground text-sm">
        Configure how your data will sync between Airtable and Google Sheets.
      </p>
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
      <p className="text-muted-foreground text-sm">
        Review your sync configuration before creating.
      </p>
      <ReviewStep formData={formData} />
    </div>
  );
}
