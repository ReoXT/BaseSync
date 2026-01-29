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
      <div className="space-y-3 animate-fade-in">
        <Label htmlFor="airtable-base" className="text-sm font-medium flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
          Airtable Base
        </Label>
        {isLoadingBases ? (
          <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <div className="flex flex-col items-center justify-center gap-3 relative">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <span className="text-sm font-mono text-orange-400">Fetching bases...</span>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <Select value={selectedBaseId} onValueChange={handleBaseChange}>
              <SelectTrigger id="airtable-base" className="h-12 border-orange-500/20 hover:border-orange-500/40 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-orange-500/10">
                <SelectValue placeholder="Choose your Airtable base..." />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-card/95 border-orange-500/20">
                {bases?.map((base: AirtableBase) => (
                  <SelectItem key={base.id} value={base.id} className="cursor-pointer">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                        <Database className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{base.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBaseId && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 w-fit">
                <Database className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-mono text-foreground">
                  {bases?.find((b: AirtableBase) => b.id === selectedBaseId)?.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Selection */}
      {selectedBaseId && (
        <div className="space-y-3 animate-fade-in">
          <Label htmlFor="airtable-table" className="text-sm font-medium flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            Airtable Table
          </Label>
          {isLoadingTables ? (
            <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="flex flex-col items-center justify-center gap-3 relative">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="text-sm font-mono text-blue-400">Loading tables...</span>
              </div>
            </div>
          ) : tablesError ? (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tablesError}</AlertDescription>
            </Alert>
          ) : tables && tables.length > 0 ? (
            <>
              <div className="relative group">
                <Select
                  value={selectedTableId}
                  onValueChange={(value) => handleTableChange(value)}
                >
                  <SelectTrigger id="airtable-table" className="h-12 border-blue-500/20 hover:border-blue-500/40 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                    <SelectValue placeholder="Choose your table..." />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-card/95 border-blue-500/20">
                    {tables.map((table: AirtableTable) => (
                      <SelectItem key={table.id} value={`${table.id}|${table.name}`} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                            <Table className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{table.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTableId && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
                    <Table className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-mono text-foreground">
                      {tables.find((t: AirtableTable) => t.id === selectedTableId)?.name}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Alert className="border-yellow-500/50 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                No tables found in this base.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Table Schema Preview */}
      {isLoadingSchema && (
        <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm p-8 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <div className="flex flex-col items-center justify-center gap-3 relative">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">Loading table schema...</span>
          </div>
        </div>
      )}

      {schemaError && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/5 animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{schemaError}</AlertDescription>
        </Alert>
      )}

      {tableSchema && !isLoadingSchema && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
            <Label className="text-sm font-medium">Field Schema</Label>
          </div>
          {tableSchema.description && (
            <div className="px-4 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-xs text-muted-foreground">{tableSchema.description}</p>
            </div>
          )}

          <div className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur-sm overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="max-h-96 overflow-auto relative">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur-sm border-b border-cyan-500/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Field Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tableSchema.fields.map((field: AirtableField, index: number) => (
                    <tr
                      key={field.id}
                      className="hover:bg-cyan-500/5 transition-colors duration-200"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {field.name}
                          {field.id === tableSchema.primaryFieldId && (
                            <span className="px-2 py-0.5 text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded">
                              PRIMARY
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-mono">
                          {formatFieldType(field.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {field.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-cyan-500/10 bg-muted/50 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-xs font-mono text-muted-foreground">
                  {tableSchema.fields.length} field{tableSchema.fields.length !== 1 ? "s" : ""} available for sync
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!selectedBaseId && (
        <div className="relative rounded-xl border border-dashed border-cyan-500/20 bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
              }}
              className="w-full h-full"
            />
          </div>
          <div className="relative flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Ready to connect</p>
              <p className="text-xs text-muted-foreground">
                Select an Airtable base from the dropdown above to view available tables and begin mapping fields.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
