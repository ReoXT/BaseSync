import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Link2,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getAirtableTableSchema,
  getSheetColumnHeaders,
  useQuery,
} from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";

export interface FieldMappingData {
  fieldMappings?: Record<string, number>; // Airtable field ID -> Google Sheets column index (0-based)
}

export interface FieldMapperProps {
  /** Current selection data from previous steps */
  value: {
    airtableBaseId?: string;
    airtableTableId?: string;
    googleSpreadsheetId?: string;
    googleSheetId?: string;
    fieldMappings?: Record<string, number>;
  };
  /** Callback when mappings change */
  onChange: (data: FieldMappingData) => void;
}

interface AirtableField {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface TypeCompatibility {
  compatible: boolean;
  warning?: string;
  info?: string;
}

/**
 * Step 3: Field Mapping
 * Maps Airtable fields to Google Sheets columns with auto-suggestions and type compatibility warnings
 */
export function FieldMapper({ value, onChange }: FieldMapperProps) {
  const [fieldMappings, setFieldMappings] = useState<Record<string, number>>(
    value.fieldMappings || {}
  );
  const [airtableFields, setAirtableFields] = useState<AirtableField[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [headersError, setHeadersError] = useState<string | null>(null);

  // Fetch Airtable table schema when baseId and tableId are available
  useEffect(() => {
    if (value.airtableBaseId && value.airtableTableId) {
      fetchAirtableFields();
    }
  }, [value.airtableBaseId, value.airtableTableId]);

  // Fetch Google Sheets column headers when spreadsheetId and sheetId are available
  useEffect(() => {
    if (value.googleSpreadsheetId && value.googleSheetId) {
      fetchSheetHeaders();
    }
  }, [value.googleSpreadsheetId, value.googleSheetId]);

  // Fetch Airtable fields
  const fetchAirtableFields = async () => {
    if (!value.airtableBaseId || !value.airtableTableId) return;

    setIsLoadingFields(true);
    setFieldsError(null);

    try {
      const schema = await getAirtableTableSchema({
        baseId: value.airtableBaseId,
        tableId: value.airtableTableId,
      });

      const fields = (schema as any).fields || [];
      setAirtableFields(fields);

      // Auto-suggest mappings if we have both fields and headers
      if (fields.length > 0 && sheetHeaders.length > 0 && Object.keys(fieldMappings).length === 0) {
        autoSuggestMappings(fields, sheetHeaders);
      }
    } catch (error) {
      console.error("Failed to fetch Airtable fields:", error);
      setFieldsError(error instanceof Error ? error.message : "Failed to fetch Airtable fields");
    } finally {
      setIsLoadingFields(false);
    }
  };

  // Fetch Google Sheets column headers
  const fetchSheetHeaders = async () => {
    if (!value.googleSpreadsheetId || !value.googleSheetId) return;

    setIsLoadingHeaders(true);
    setHeadersError(null);

    try {
      const result = await getSheetColumnHeaders({
        spreadsheetId: value.googleSpreadsheetId,
        sheetId: parseInt(value.googleSheetId, 10),
      });

      const headers = (result as any).headers || [];
      setSheetHeaders(headers);

      // Auto-suggest mappings if we have both fields and headers
      if (headers.length > 0 && airtableFields.length > 0 && Object.keys(fieldMappings).length === 0) {
        autoSuggestMappings(airtableFields, headers);
      }
    } catch (error) {
      console.error("Failed to fetch sheet headers:", error);
      setHeadersError(error instanceof Error ? error.message : "Failed to fetch sheet headers");
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  // Auto-suggest field mappings based on name matching
  const autoSuggestMappings = (fields: AirtableField[], headers: string[]) => {
    const newMappings: Record<string, number> = {};

    fields.forEach((field) => {
      // Try exact match (case-insensitive)
      const exactMatchIndex = headers.findIndex(
        (header) => header.toLowerCase().trim() === field.name.toLowerCase().trim()
      );

      if (exactMatchIndex !== -1) {
        newMappings[field.id] = exactMatchIndex;
        return;
      }

      // Try partial match (field name contains header or vice versa)
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

  // Handle field mapping change
  const handleMappingChange = (fieldId: string, columnIndex: number | null) => {
    const newMappings = { ...fieldMappings };

    if (columnIndex === null) {
      // Unmap field
      delete newMappings[fieldId];
    } else {
      newMappings[fieldId] = columnIndex;
    }

    setFieldMappings(newMappings);
    onChange({ fieldMappings: newMappings });
  };

  // Clear all mappings
  const clearAllMappings = () => {
    setFieldMappings({});
    onChange({ fieldMappings: {} });
  };

  // Auto-map all fields
  const autoMapAll = () => {
    autoSuggestMappings(airtableFields, sheetHeaders);
  };

  // Check type compatibility between Airtable field and Sheets column
  const checkTypeCompatibility = (fieldType: string): TypeCompatibility => {
    const compatibilityMap: Record<string, TypeCompatibility> = {
      singleLineText: { compatible: true, info: "Will sync as text" },
      multilineText: { compatible: true, info: "Will sync as text" },
      richText: { compatible: true, info: "Will sync as plain text (formatting removed)" },
      number: { compatible: true, info: "Will sync as number" },
      percent: { compatible: true, info: "Will sync as percentage" },
      currency: { compatible: true, info: "Will sync as currency value" },
      singleSelect: { compatible: true, info: "Will sync as text" },
      multipleSelects: { compatible: true, info: "Will sync as comma-separated text" },
      date: { compatible: true, info: "Will sync as date" },
      dateTime: { compatible: true, info: "Will sync as date and time" },
      checkbox: { compatible: true, info: 'Will sync as TRUE/FALSE' },
      url: { compatible: true, info: "Will sync as text URL" },
      email: { compatible: true, info: "Will sync as text email" },
      phoneNumber: { compatible: true, info: "Will sync as text phone number" },
      multipleAttachments: {
        compatible: true,
        info: "Will sync as comma-separated URLs",
      },
      multipleRecordLinks: {
        compatible: true,
        info: "⚡ Will sync as record names (not IDs!)",
      },
      formula: {
        compatible: true,
        warning: "Formula result will sync, not the formula itself",
      },
      rollup: { compatible: true, info: "Rollup result will sync" },
      count: { compatible: true, info: "Count value will sync" },
      lookup: { compatible: true, info: "Lookup value will sync" },
      createdTime: { compatible: true, info: "Will sync as timestamp" },
      lastModifiedTime: { compatible: true, info: "Will sync as timestamp" },
      createdBy: { compatible: true, info: "Will sync as user name" },
      lastModifiedBy: { compatible: true, info: "Will sync as user name" },
      autoNumber: { compatible: true, info: "Will sync as number" },
      barcode: { compatible: true, info: "Will sync as barcode text" },
      button: {
        compatible: false,
        warning: "⚠️ Button fields cannot be synced",
      },
      rating: { compatible: true, info: "Will sync as number" },
    };

    return (
      compatibilityMap[fieldType] || {
        compatible: true,
        warning: "Unknown field type - will attempt to sync as text",
      }
    );
  };

  // Format field type for display
  const formatFieldType = (type: string): string => {
    const typeMap: Record<string, string> = {
      singleLineText: "Text",
      multilineText: "Long Text",
      richText: "Rich Text",
      number: "Number",
      percent: "Percent",
      currency: "Currency",
      singleSelect: "Single Select",
      multipleSelects: "Multiple Select",
      date: "Date",
      dateTime: "Date & Time",
      checkbox: "Checkbox",
      url: "URL",
      email: "Email",
      phoneNumber: "Phone",
      multipleAttachments: "Attachments",
      multipleRecordLinks: "Linked Records",
      formula: "Formula",
      rollup: "Rollup",
      count: "Count",
      lookup: "Lookup",
      createdTime: "Created Time",
      lastModifiedTime: "Last Modified",
      createdBy: "Created By",
      lastModifiedBy: "Last Modified By",
      autoNumber: "Auto Number",
      barcode: "Barcode",
      button: "Button",
      rating: "Rating",
    };

    return typeMap[type] || type;
  };

  // Check if prerequisites are met
  if (!value.airtableBaseId || !value.airtableTableId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an Airtable base and table first (Step 1).
        </AlertDescription>
      </Alert>
    );
  }

  if (!value.googleSpreadsheetId || !value.googleSheetId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a Google Spreadsheet and sheet first (Step 2).
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (isLoadingFields || isLoadingHeaders) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">
            {isLoadingFields && "Loading Airtable fields..."}
            {isLoadingHeaders && "Loading sheet columns..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (fieldsError || headersError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{fieldsError || headersError}</AlertDescription>
      </Alert>
    );
  }

  const mappedCount = Object.keys(fieldMappings).length;
  const totalFields = airtableFields.length;
  const mappingProgress = totalFields > 0 ? (mappedCount / totalFields) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="relative rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 p-6 overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50" />

        <div className="relative flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-emerald-500 rounded-full" />
              Field Mapping
            </h3>
            <p className="text-sm font-mono text-muted-foreground">
              {mappedCount} of {totalFields} fields configured
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={autoMapAll}
              disabled={totalFields === 0}
              className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2 text-cyan-400" />
              Auto-Map
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllMappings}
              disabled={mappedCount === 0}
              className="hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${mappingProgress}%` }}
          />
          {mappingProgress > 0 && (
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400/50 to-emerald-400/50 blur-sm"
              style={{ width: `${mappingProgress}%` }}
            />
          )}
        </div>
      </div>

      {/* Info card about linked records */}
      <Alert className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/5 animate-fade-in">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-foreground">
          <strong className="text-blue-400">⚡ Smart Linked Records:</strong> Linked record fields will automatically sync using record names instead of cryptic IDs. This is a key advantage over other sync tools!
        </AlertDescription>
      </Alert>

      {/* Mapping interface */}
      <div className="space-y-3">
        {airtableFields.map((field, index) => {
          const isMapped = field.id in fieldMappings;
          const mappedColumnIndex = fieldMappings[field.id];
          const compatibility = checkTypeCompatibility(field.type);

          return (
            <Card
              key={field.id}
              className={`relative group transition-all duration-300 overflow-hidden ${
                isMapped
                  ? "border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 shadow-lg shadow-cyan-500/5"
                  : "border-border/50 hover:border-border"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Glow effect for mapped fields */}
              {isMapped && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              <CardContent className="p-4 relative">
                <div className="flex items-start gap-4">
                  {/* Left: Airtable field info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{field.name}</h4>
                      <span className="text-xs px-2 py-1 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded font-mono">
                        {formatFieldType(field.type)}
                      </span>
                      {field.type === "multipleRecordLinks" && (
                        <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-blue-400" />
                          <span className="text-xs font-mono text-blue-400">LINKED</span>
                        </div>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {field.description}
                      </p>
                    )}
                    {/* Type compatibility info/warning */}
                    {compatibility.info && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">{compatibility.info}</span>
                      </div>
                    )}
                    {compatibility.warning && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
                        <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">{compatibility.warning}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Arrow indicator */}
                  <div className="flex items-center justify-center pt-1 flex-shrink-0">
                    <div className={`relative ${isMapped ? 'animate-pulse' : ''}`}>
                      <ArrowRight
                        className={`h-6 w-6 transition-all duration-300 ${
                          isMapped ? "text-cyan-400" : "text-muted-foreground"
                        }`}
                      />
                      {isMapped && (
                        <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md" />
                      )}
                    </div>
                  </div>

                  {/* Right: Google Sheets column selector */}
                  <div className="flex-1 min-w-0">
                    <Select
                      value={isMapped ? mappedColumnIndex.toString() : ""}
                      onValueChange={(value) => {
                        if (value === "none") {
                          handleMappingChange(field.id, null);
                        } else {
                          handleMappingChange(field.id, parseInt(value, 10));
                        }
                      }}
                    >
                      <SelectTrigger className={`transition-all duration-300 ${
                        isMapped
                          ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                          : "border-border hover:border-border/80"
                      }`}>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl bg-card/95">
                        <SelectItem value="none" className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4" />
                            <span>Skip this field</span>
                          </div>
                        </SelectItem>
                        <Separator className="my-1" />
                        {sheetHeaders.map((header, index) => (
                          <SelectItem key={index} value={index.toString()} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                {String.fromCharCode(65 + (index % 26))}
                                {index >= 26 ? String.fromCharCode(65 + Math.floor(index / 26) - 1) : ""}
                              </span>
                              <span className="font-medium">{header || `Column ${index + 1}`}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isMapped && (
                      <div className="flex items-center gap-2 mt-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-xs font-mono text-foreground">
                          {sheetHeaders[mappedColumnIndex] || `Column ${mappedColumnIndex + 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {airtableFields.length === 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            No fields found in the selected Airtable table.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {mappedCount > 0 && (
        <Alert className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-foreground">
            <strong className="text-emerald-400">Ready to sync!</strong> {mappedCount} field{mappedCount !== 1 ? "s" : ""} will be synced between Airtable and Google Sheets.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
