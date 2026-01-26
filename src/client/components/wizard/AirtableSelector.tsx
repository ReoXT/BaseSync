import { AlertCircle, Database, Loader2, Table } from "lucide-react";
import { useEffect, useState } from "react";
import { listUserAirtableBases, getAirtableTableSchema, getAirtableBaseTables, useQuery } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface AirtableSelectionData {
  baseId?: string;
  baseName?: string;
  tableId?: string;
  tableName?: string;
}

export interface AirtableSelectorProps {
  /** Current selection data */
  value: AirtableSelectionData;
  /** Callback when selection changes */
  onChange: (data: AirtableSelectionData) => void;
}

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableTableWithFields {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
  fields: AirtableField[];
}

interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
}

interface AirtableField {
  id: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Step 1: Airtable Base and Table Selection
 * Allows users to select an Airtable base and table for syncing
 */
export function AirtableSelector({ value, onChange }: AirtableSelectorProps) {
  const [selectedBaseId, setSelectedBaseId] = useState<string | undefined>(value.baseId);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(value.tableId);
  const [tableSchema, setTableSchema] = useState<AirtableTableWithFields | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [tables, setTables] = useState<AirtableTable[] | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);

  // Fetch user's Airtable bases
  const {
    data: bases,
    isLoading: isLoadingBases,
    error: basesError,
  } = useQuery(listUserAirtableBases);

  // Handle base selection
  const handleBaseChange = async (baseId: string) => {
    const base = bases?.find((b: AirtableBase) => b.id === baseId);
    setSelectedBaseId(baseId);
    setSelectedTableId(undefined);
    setTableSchema(null);
    setSchemaError(null);
    setTables(null);
    setTablesError(null);
    setIsLoadingTables(true);

    onChange({
      baseId,
      baseName: base?.name,
      tableId: undefined,
      tableName: undefined,
    });

    // Fetch tables for the selected base
    try {
      const fetchedTables = await getAirtableBaseTables({ baseId });
      setTables(fetchedTables as AirtableTable[]);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      setTablesError(error instanceof Error ? error.message : 'Failed to fetch tables');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Fetch table schema when table is selected
  const handleTableChange = async (tableIdAndName: string) => {
    if (!selectedBaseId) return;

    // Parse the combined value (format: "tableId|tableName")
    const [tableId, tableName] = tableIdAndName.split("|");

    setSelectedTableId(tableId);
    setIsLoadingSchema(true);
    setSchemaError(null);

    try {
      const schema = await getAirtableTableSchema({
        baseId: selectedBaseId,
        tableId: tableId,
      });

      setTableSchema(schema as AirtableTableWithFields);

      onChange({
        baseId: selectedBaseId,
        baseName: bases?.find((b: AirtableBase) => b.id === selectedBaseId)?.name,
        tableId,
        tableName,
      });
    } catch (error) {
      console.error("Failed to fetch table schema:", error);
      setSchemaError(error instanceof Error ? error.message : "Failed to fetch table schema");
      setTableSchema(null);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Format field type for display
  const formatFieldType = (type: string): string => {
    const typeMap: Record<string, string> = {
      singleLineText: "Text",
      multilineText: "Long Text",
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

  // No bases found state
  if (!isLoadingBases && (!bases || bases.length === 0)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No Airtable bases found. Please make sure your Airtable account is connected and you have
          access to at least one base.
        </AlertDescription>
      </Alert>
    );
  }

  // Error loading bases
  if (basesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Airtable bases: {basesError.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Base Selection */}
      <div className="space-y-2">
        <Label htmlFor="airtable-base">Airtable Base</Label>
        {isLoadingBases ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select value={selectedBaseId} onValueChange={handleBaseChange}>
            <SelectTrigger id="airtable-base">
              <SelectValue placeholder="Select an Airtable base" />
            </SelectTrigger>
            <SelectContent>
              {bases?.map((base: AirtableBase) => (
                <SelectItem key={base.id} value={base.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-600" />
                    <span>{base.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedBaseId && (
          <p className="text-xs text-muted-foreground">
            Selected: {bases?.find((b: AirtableBase) => b.id === selectedBaseId)?.name}
          </p>
        )}
      </div>

      {/* Table Selection */}
      {selectedBaseId && (
        <div className="space-y-2">
          <Label htmlFor="airtable-table">Airtable Table</Label>
          {isLoadingTables ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tablesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tablesError}</AlertDescription>
            </Alert>
          ) : tables && tables.length > 0 ? (
            <>
              <Select
                value={selectedTableId}
                onValueChange={(value) => handleTableChange(value)}
              >
                <SelectTrigger id="airtable-table">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table: AirtableTable) => (
                    <SelectItem key={table.id} value={`${table.id}|${table.name}`}>
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-blue-600" />
                        <span>{table.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTableId && (
                <p className="text-xs text-muted-foreground">
                  Selected: {tables.find((t: AirtableTable) => t.id === selectedTableId)?.name}
                </p>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tables found in this base.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Table Schema Preview */}
      {isLoadingSchema && (
        <div className="rounded-md border p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading table schema...</span>
          </div>
        </div>
      )}

      {schemaError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{schemaError}</AlertDescription>
        </Alert>
      )}

      {tableSchema && !isLoadingSchema && (
        <div className="space-y-4">
          <div>
            <Label>Table Preview</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {tableSchema.description || "No description available"}
            </p>
          </div>

          <div className="rounded-md border">
            <div className="max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Field Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tableSchema.fields.map((field: AirtableField) => (
                    <tr key={field.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2 text-sm font-medium">
                        {field.name}
                        {field.id === tableSchema.primaryFieldId && (
                          <span className="ml-2 text-xs text-primary">(Primary)</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {formatFieldType(field.type)}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {field.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/50 px-4 py-2">
              <p className="text-xs text-muted-foreground">
                {tableSchema.fields.length} field{tableSchema.fields.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!selectedBaseId && (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Select an Airtable base to get started. You'll then be able to choose a table from that
            base.
          </p>
        </div>
      )}
    </div>
  );
}
