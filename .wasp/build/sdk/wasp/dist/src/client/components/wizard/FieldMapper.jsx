import { AlertCircle, ArrowRight, Check, Info, Link2, Loader2, Sparkles, X, } from "lucide-react";
import { useEffect, useState } from "react";
import { getAirtableTableSchema, getSheetColumnHeaders, } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../utils";
export function FieldMapper({ value, onChange }) {
    const [fieldMappings, setFieldMappings] = useState(value.fieldMappings || {});
    const [airtableFields, setAirtableFields] = useState([]);
    const [sheetHeaders, setSheetHeaders] = useState([]);
    const [isLoadingFields, setIsLoadingFields] = useState(false);
    const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
    const [fieldsError, setFieldsError] = useState(null);
    const [headersError, setHeadersError] = useState(null);
    useEffect(() => {
        if (value.airtableBaseId && value.airtableTableId) {
            fetchAirtableFields();
        }
    }, [value.airtableBaseId, value.airtableTableId]);
    useEffect(() => {
        if (value.googleSpreadsheetId && value.googleSheetId) {
            fetchSheetHeaders();
        }
    }, [value.googleSpreadsheetId, value.googleSheetId]);
    const fetchAirtableFields = async () => {
        if (!value.airtableBaseId || !value.airtableTableId)
            return;
        setIsLoadingFields(true);
        setFieldsError(null);
        try {
            const schema = await getAirtableTableSchema({
                baseId: value.airtableBaseId,
                tableId: value.airtableTableId,
            });
            const fields = schema.fields || [];
            setAirtableFields(fields);
            if (fields.length > 0 && sheetHeaders.length > 0 && Object.keys(fieldMappings).length === 0) {
                autoSuggestMappings(fields, sheetHeaders);
            }
        }
        catch (error) {
            console.error("Failed to fetch Airtable fields:", error);
            setFieldsError(error instanceof Error ? error.message : "Failed to fetch fields");
        }
        finally {
            setIsLoadingFields(false);
        }
    };
    const fetchSheetHeaders = async () => {
        if (!value.googleSpreadsheetId || !value.googleSheetId)
            return;
        setIsLoadingHeaders(true);
        setHeadersError(null);
        try {
            const result = await getSheetColumnHeaders({
                spreadsheetId: value.googleSpreadsheetId,
                sheetId: value.googleSheetId,
            });
            const headers = result.headers || [];
            setSheetHeaders(headers);
            if (headers.length > 0 && airtableFields.length > 0 && Object.keys(fieldMappings).length === 0) {
                autoSuggestMappings(airtableFields, headers);
            }
        }
        catch (error) {
            console.error("Failed to fetch sheet headers:", error);
            setHeadersError(error instanceof Error ? error.message : "Failed to fetch headers");
        }
        finally {
            setIsLoadingHeaders(false);
        }
    };
    const autoSuggestMappings = (fields, headers) => {
        const newMappings = {};
        fields.forEach((field) => {
            const exactMatchIndex = headers.findIndex((header) => header.toLowerCase().trim() === field.name.toLowerCase().trim());
            if (exactMatchIndex !== -1) {
                newMappings[field.id] = exactMatchIndex;
                return;
            }
            const partialMatchIndex = headers.findIndex((header) => {
                const headerLower = header.toLowerCase().trim();
                const fieldLower = field.name.toLowerCase().trim();
                return headerLower.includes(fieldLower) || fieldLower.includes(headerLower);
            });
            if (partialMatchIndex !== -1) {
                newMappings[field.id] = partialMatchIndex;
            }
        });
        setFieldMappings(newMappings);
        onChange({ fieldMappings: newMappings });
    };
    const handleMappingChange = (fieldId, columnIndex) => {
        const newMappings = { ...fieldMappings };
        if (columnIndex === null) {
            delete newMappings[fieldId];
        }
        else {
            newMappings[fieldId] = columnIndex;
        }
        setFieldMappings(newMappings);
        onChange({ fieldMappings: newMappings });
    };
    const clearAllMappings = () => {
        setFieldMappings({});
        onChange({ fieldMappings: {} });
    };
    const autoMapAll = () => {
        autoSuggestMappings(airtableFields, sheetHeaders);
    };
    const formatFieldType = (type) => {
        const typeMap = {
            singleLineText: "Text",
            multilineText: "Long Text",
            richText: "Rich Text",
            number: "Number",
            percent: "Percent",
            currency: "Currency",
            singleSelect: "Select",
            multipleSelects: "Multi-select",
            date: "Date",
            dateTime: "Date & Time",
            checkbox: "Checkbox",
            url: "URL",
            email: "Email",
            phoneNumber: "Phone",
            multipleAttachments: "Attachments",
            multipleRecordLinks: "Linked",
            formula: "Formula",
            rollup: "Rollup",
            count: "Count",
            lookup: "Lookup",
            createdTime: "Created",
            lastModifiedTime: "Modified",
            createdBy: "Created By",
            lastModifiedBy: "Modified By",
            autoNumber: "Auto #",
            barcode: "Barcode",
            button: "Button",
            rating: "Rating",
        };
        return typeMap[type] || type;
    };
    // Prerequisite checks
    if (!value.airtableBaseId || !value.airtableTableId) {
        return (<Alert>
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>Please select an Airtable base and table first.</AlertDescription>
      </Alert>);
    }
    if (!value.googleSpreadsheetId || !value.googleSheetId) {
        return (<Alert>
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>Please select a Google Spreadsheet and sheet first.</AlertDescription>
      </Alert>);
    }
    if (isLoadingFields || isLoadingHeaders) {
        return (<div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500"/>
        <span className="ml-2 text-sm text-muted-foreground">
          {isLoadingFields ? "Loading fields..." : "Loading columns..."}
        </span>
      </div>);
    }
    if (fieldsError || headersError) {
        return (<Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>{fieldsError || headersError}</AlertDescription>
      </Alert>);
    }
    const mappedCount = Object.keys(fieldMappings).length;
    const totalFields = airtableFields.length;
    return (<div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Field Mappings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mappedCount} of {totalFields} fields mapped
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={autoMapAll} disabled={totalFields === 0} className="h-8 text-xs">
            <Sparkles className="h-3 w-3 mr-1.5"/>
            Auto-map
          </Button>
          {mappedCount > 0 && (<Button variant="ghost" size="sm" onClick={clearAllMappings} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </Button>)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style={{ width: `${totalFields > 0 ? (mappedCount / totalFields) * 100 : 0}%` }}/>
      </div>

      {/* Linked records info */}
      {airtableFields.some(f => f.type === 'multipleRecordLinks') && (<div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Linked records</span> will sync as readable names, not IDs.
          </p>
        </div>)}

      {/* Field mapping list */}
      <div className="space-y-2">
        {airtableFields.map((field) => {
            const isMapped = field.id in fieldMappings;
            const mappedColumnIndex = fieldMappings[field.id];
            const isLinked = field.type === 'multipleRecordLinks';
            return (<div key={field.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", isMapped
                    ? "border-cyan-500/30 bg-cyan-500/5"
                    : "border-border bg-card hover:border-border/80")}>
              {/* Field info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{field.name}</span>
                  {isLinked && (<Link2 className="h-3 w-3 text-blue-500 flex-shrink-0"/>)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatFieldType(field.type)}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className={cn("h-4 w-4 flex-shrink-0 transition-colors", isMapped ? "text-cyan-500" : "text-muted-foreground/50")}/>

              {/* Column selector */}
              <div className="w-48 flex-shrink-0">
                <Select value={isMapped ? mappedColumnIndex.toString() : ""} onValueChange={(val) => {
                    if (val === "none") {
                        handleMappingChange(field.id, null);
                    }
                    else {
                        handleMappingChange(field.id, parseInt(val, 10));
                    }
                }}>
                  <SelectTrigger className={cn("h-9 text-sm", isMapped && "border-cyan-500/30")}>
                    <SelectValue placeholder="Select column"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <X className="h-3 w-3"/>
                        Skip field
                      </span>
                    </SelectItem>
                    {sheetHeaders.map((header, index) => (<SelectItem key={index} value={index.toString()}>
                        <span className="flex items-center gap-2">
                          <span className="w-5 text-xs font-mono text-muted-foreground">
                            {String.fromCharCode(65 + (index % 26))}
                          </span>
                          {header || `Column ${index + 1}`}
                        </span>
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status indicator */}
              <div className="w-6 flex-shrink-0 flex justify-center">
                {isMapped && (<Check className="h-4 w-4 text-cyan-500"/>)}
              </div>
            </div>);
        })}
      </div>

      {/* Empty state */}
      {airtableFields.length === 0 && (<Alert>
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>No fields found in the selected Airtable table.</AlertDescription>
        </Alert>)}

      {/* Ready indicator */}
      {mappedCount > 0 && (<div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-500"/>
          <p className="text-sm">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{mappedCount} fields</span>
            <span className="text-muted-foreground"> ready to sync</span>
          </p>
        </div>)}
    </div>);
}
//# sourceMappingURL=FieldMapper.jsx.map