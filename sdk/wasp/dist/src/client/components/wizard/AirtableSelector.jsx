import { AlertCircle, Loader2, Table } from "lucide-react";
import { useState } from "react";
import { listUserAirtableBases, getAirtableTableSchema, getAirtableBaseTables, useQuery } from "wasp/client/operations";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
export function AirtableSelector({ value, onChange }) {
    const [selectedBaseId, setSelectedBaseId] = useState(value.baseId);
    const [selectedTableId, setSelectedTableId] = useState(value.tableId);
    const [viewId, setViewId] = useState(value.viewId);
    const [tableSchema, setTableSchema] = useState(null);
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);
    const [schemaError, setSchemaError] = useState(null);
    const [tables, setTables] = useState(null);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [tablesError, setTablesError] = useState(null);
    const { data: bases, isLoading: isLoadingBases, error: basesError, } = useQuery(listUserAirtableBases);
    const handleBaseChange = async (baseId) => {
        const base = bases?.find((b) => b.id === baseId);
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
        try {
            const fetchedTables = await getAirtableBaseTables({ baseId });
            setTables(fetchedTables);
        }
        catch (error) {
            console.error('Failed to fetch tables:', error);
            setTablesError(error instanceof Error ? error.message : 'Failed to fetch tables');
        }
        finally {
            setIsLoadingTables(false);
        }
    };
    const handleTableChange = async (tableIdAndName) => {
        if (!selectedBaseId)
            return;
        const [tableId, tableName] = tableIdAndName.split("|");
        setSelectedTableId(tableId);
        setIsLoadingSchema(true);
        setSchemaError(null);
        try {
            const schema = await getAirtableTableSchema({
                baseId: selectedBaseId,
                tableId: tableId,
            });
            setTableSchema(schema);
            onChange({
                baseId: selectedBaseId,
                baseName: bases?.find((b) => b.id === selectedBaseId)?.name,
                tableId,
                tableName,
                viewId,
            });
        }
        catch (error) {
            console.error("Failed to fetch table schema:", error);
            setSchemaError(error instanceof Error ? error.message : "Failed to fetch table schema");
            setTableSchema(null);
        }
        finally {
            setIsLoadingSchema(false);
        }
    };
    const handleViewIdChange = (newViewId) => {
        setViewId(newViewId);
        onChange({
            baseId: selectedBaseId,
            baseName: bases?.find((b) => b.id === selectedBaseId)?.name,
            tableId: selectedTableId,
            tableName: tables?.find((t) => t.id === selectedTableId)?.name,
            viewId: newViewId || undefined,
        });
    };
    const formatFieldType = (type) => {
        const typeMap = {
            singleLineText: "Text",
            multilineText: "Long Text",
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
            multipleRecordLinks: "Linked Records",
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
    if (!isLoadingBases && (!bases || bases.length === 0)) {
        return (<Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>
          No Airtable bases found. Make sure your Airtable account is connected.
        </AlertDescription>
      </Alert>);
    }
    if (basesError) {
        return (<Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertDescription>
          Failed to load Airtable bases: {basesError.message || "Unknown error"}
        </AlertDescription>
      </Alert>);
    }
    return (<div className="space-y-6">
      {/* Base Selection */}
      <div className="space-y-2">
        <Label htmlFor="airtable-base" className="text-sm font-medium">
          Airtable Base
        </Label>
        {isLoadingBases ? (<div className="h-11 flex items-center justify-center rounded-lg border border-border bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
            <span className="ml-2 text-sm text-muted-foreground">Loading bases...</span>
          </div>) : (<Select value={selectedBaseId} onValueChange={handleBaseChange}>
            <SelectTrigger id="airtable-base" className="h-11">
              <SelectValue placeholder="Select a base"/>
            </SelectTrigger>
            <SelectContent>
              {bases?.map((base) => (<SelectItem key={base.id} value={base.id}>
                  <div className="flex items-center gap-2">
                    <img src="/airtable-icon.svg" alt="" className="w-4 h-4"/>
                    <span>{base.name}</span>
                  </div>
                </SelectItem>))}
            </SelectContent>
          </Select>)}
      </div>

      {/* Table Selection */}
      {selectedBaseId && (<div className="space-y-2">
          <Label htmlFor="airtable-table" className="text-sm font-medium">
            Table
          </Label>
          {isLoadingTables ? (<div className="h-11 flex items-center justify-center rounded-lg border border-border bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
              <span className="ml-2 text-sm text-muted-foreground">Loading tables...</span>
            </div>) : tablesError ? (<Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{tablesError}</AlertDescription>
            </Alert>) : tables && tables.length > 0 ? (<Select value={selectedTableId} onValueChange={handleTableChange}>
              <SelectTrigger id="airtable-table" className="h-11">
                <SelectValue placeholder="Select a table"/>
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (<SelectItem key={table.id} value={`${table.id}|${table.name}`}>
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-muted-foreground"/>
                      <span>{table.name}</span>
                    </div>
                  </SelectItem>))}
              </SelectContent>
            </Select>) : (<Alert>
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>No tables found in this base.</AlertDescription>
            </Alert>)}
        </div>)}

      {/* View Options */}
      {selectedTableId && (<div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">View Options</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono">
              Recommended
            </span>
          </div>

          <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <Label htmlFor="airtable-view-id" className="text-sm font-medium">
              View ID <span className="text-muted-foreground font-normal">(recommended)</span>
            </Label>
            <Input id="airtable-view-id" type="text" placeholder="viw..." value={viewId || ""} onChange={(e) => handleViewIdChange(e.target.value)} className="h-11 bg-card/60 border-border/60 focus-visible:ring-cyan-500/30"/>
            <p className="text-xs text-muted-foreground">
              Add a view ID to sync records in a specific order. Find it in your Airtable URL.
            </p>
          </div>
        </div>)}

      {/* Schema Loading */}
      {isLoadingSchema && (<div className="flex items-center justify-center py-8 rounded-lg border border-border bg-muted/30">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500"/>
          <span className="ml-2 text-sm text-muted-foreground">Loading fields...</span>
        </div>)}

      {schemaError && (<Alert variant="destructive">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>{schemaError}</AlertDescription>
        </Alert>)}

      {/* Schema Preview - Clean Table */}
      {tableSchema && !isLoadingSchema && (<div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Fields Preview</Label>
            <span className="text-xs text-muted-foreground">
              {tableSchema.fields.length} fields
            </span>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Field</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableSchema.fields.map((field) => (<tr key={field.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.name}</span>
                          {field.id === tableSchema.primaryFieldId && (<span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              Primary
                            </span>)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {formatFieldType(field.type)}
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=AirtableSelector.jsx.map