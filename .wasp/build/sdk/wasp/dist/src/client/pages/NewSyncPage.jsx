import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { AirtableSelector } from "../components/wizard/AirtableSelector";
import { GoogleSheetsSelector } from "../components/wizard/GoogleSheetsSelector";
import { FieldMapper } from "../components/wizard/FieldMapper";
import { SyncOptions } from "../components/wizard/SyncOptions";
import { ReviewStep } from "../components/wizard/ReviewStep";
import { ProgressStepper } from "../components/wizard/ProgressStepper";
// Wizard step configuration
const STEPS = [
    { id: 1, title: "Select Airtable", description: "Choose your Airtable base and table" },
    { id: 2, title: "Select Google Sheets", description: "Choose your spreadsheet and sheet" },
    { id: 3, title: "Map Fields", description: "Map Airtable fields to sheet columns" },
    { id: 4, title: "Configure Sync", description: "Set sync direction and conflict resolution" },
    { id: 5, title: "Review", description: "Review and create your sync" },
];
export default function NewSyncPage({ isEditMode = false, syncConfigId, initialData }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData || {});
    // Update form data
    const updateFormData = (data) => {
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
    const canGoNext = () => {
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
                return <AirtableSelectionStep formData={formData} updateFormData={updateFormData}/>;
            case 2:
                return <GoogleSheetsSelectionStep formData={formData} updateFormData={updateFormData}/>;
            case 3:
                return <FieldMappingStep formData={formData} updateFormData={updateFormData}/>;
            case 4:
                return <SyncConfigurationStep formData={formData} updateFormData={updateFormData}/>;
            case 5:
                return <ReviewStepWrapper formData={formData} isEditMode={isEditMode} syncConfigId={syncConfigId}/>;
            default:
                return null;
        }
    };
    return (<div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
        }}/>
        {/* Single subtle gradient orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/5 blur-3xl" aria-hidden="true"/>
        <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-blue-500/5 blur-3xl" aria-hidden="true"/>
      </div>

      <div className="relative z-10 py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Compact Header */}
          <div className="mb-10 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6 -ml-2 text-muted-foreground hover:text-foreground hover:bg-transparent">
              <ArrowLeft className="mr-1.5 h-4 w-4"/>
              Dashboard
            </Button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-4">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400"/>
              <span className="text-xs font-mono text-cyan-400">SYNC WIZARD</span>
            </div>

            <h1 className="text-foreground text-3xl md:text-4xl font-bold mb-2">
              {isEditMode ? "Edit Sync" : "New Sync"}
            </h1>
            <p className="text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper steps={STEPS} currentStep={currentStep}/>

          {/* Step Content - Clean Card */}
          <Card className="relative group mb-8 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
            <CardContent className="relative p-6 md:p-8">{renderStepContent()}</CardContent>
          </Card>

          {/* Clean Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goToPreviousStep} disabled={currentStep === 1} className="text-muted-foreground hover:text-foreground disabled:opacity-40">
              <ArrowLeft className="mr-2 h-4 w-4"/>
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep} of {STEPS.length}
            </span>

            {currentStep < STEPS.length && (<Button onClick={goToNextStep} disabled={!canGoNext()} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50">
                Continue
                <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>)}
          </div>
        </div>
      </div>
    </div>);
}
// Step Components
function AirtableSelectionStep({ formData, updateFormData, }) {
    return (<AirtableSelector value={{
            baseId: formData.airtableBaseId,
            baseName: formData.airtableBaseName,
            tableId: formData.airtableTableId,
            tableName: formData.airtableTableName,
            viewId: formData.airtableViewId,
        }} onChange={(data) => updateFormData({
            airtableBaseId: data.baseId,
            airtableBaseName: data.baseName,
            airtableTableId: data.tableId,
            airtableTableName: data.tableName,
            airtableViewId: data.viewId,
        })}/>);
}
function GoogleSheetsSelectionStep({ formData, updateFormData, }) {
    return (<GoogleSheetsSelector value={{
            spreadsheetId: formData.googleSpreadsheetId,
            spreadsheetName: formData.googleSpreadsheetName,
            sheetId: formData.googleSheetId,
            sheetName: formData.googleSheetName,
        }} onChange={(data) => updateFormData({
            googleSpreadsheetId: data.spreadsheetId,
            googleSpreadsheetName: data.spreadsheetName,
            googleSheetId: data.sheetId,
            googleSheetName: data.sheetName,
        })}/>);
}
function FieldMappingStep({ formData, updateFormData, }) {
    return (<FieldMapper value={{
            airtableBaseId: formData.airtableBaseId,
            airtableTableId: formData.airtableTableId,
            googleSpreadsheetId: formData.googleSpreadsheetId,
            googleSheetId: formData.googleSheetId,
            fieldMappings: formData.fieldMappings,
        }} onChange={(data) => updateFormData({
            fieldMappings: data.fieldMappings,
        })}/>);
}
function SyncConfigurationStep({ formData, updateFormData, }) {
    return (<SyncOptions value={{
            airtableBaseName: formData.airtableBaseName,
            airtableTableName: formData.airtableTableName,
            googleSpreadsheetName: formData.googleSpreadsheetName,
            googleSheetName: formData.googleSheetName,
            syncName: formData.syncName,
            syncDirection: formData.syncDirection,
            conflictResolution: formData.conflictResolution,
        }} onChange={(data) => updateFormData({
            syncName: data.syncName,
            syncDirection: data.syncDirection,
            conflictResolution: data.conflictResolution,
        })}/>);
}
function ReviewStepWrapper({ formData, isEditMode, syncConfigId }) {
    return <ReviewStep formData={formData} isEditMode={isEditMode} syncConfigId={syncConfigId}/>;
}
//# sourceMappingURL=NewSyncPage.jsx.map