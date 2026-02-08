/**
 * Connection Diagnostics Component
 * Helps troubleshoot OAuth connection issues
 */
import { useState } from 'react';
import { runConnectionDiagnostics, clearReauthFlags } from 'wasp/client/operations';
export function ConnectionDiagnostics() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [clearMessage, setClearMessage] = useState(null);
    const handleRunDiagnostics = async () => {
        setIsRunning(true);
        setClearMessage(null);
        try {
            const result = await runConnectionDiagnostics({});
            setDiagnostics(result);
        }
        catch (error) {
            console.error('Failed to run diagnostics:', error);
            alert('Failed to run diagnostics. Check console for details.');
        }
        finally {
            setIsRunning(false);
        }
    };
    const handleClearFlags = async () => {
        if (!confirm('This will clear the "needs reauth" flags on both connections. Continue?')) {
            return;
        }
        setIsClearing(true);
        try {
            const result = await clearReauthFlags({});
            setClearMessage(result.message);
            // Re-run diagnostics to show updated state
            await handleRunDiagnostics();
        }
        catch (error) {
            console.error('Failed to clear flags:', error);
            alert('Failed to clear reauth flags. Check console for details.');
        }
        finally {
            setIsClearing(false);
        }
    };
    return (<div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connection Diagnostics</h3>
        <button onClick={handleRunDiagnostics} disabled={isRunning} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
          {isRunning ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>

      {clearMessage && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{clearMessage}</p>
        </div>)}

      {diagnostics && (<div className="space-y-4">
          {/* Airtable Connection */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span>Airtable Connection</span>
              {diagnostics.airtable.connected ? (<span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Connected</span>) : (<span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Not Connected</span>)}
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Needs Reauth:</span>
                <span className={diagnostics.airtable.needsReauth ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {diagnostics.airtable.needsReauth ? 'Yes ❌' : 'No ✓'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Decryption:</span>
                <span className={diagnostics.airtable.canDecryptTokens ? 'text-green-600' : 'text-red-600 font-medium'}>
                  {diagnostics.airtable.canDecryptTokens ? 'Working ✓' : 'Failed ❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Expiry:</span>
                <span className="text-gray-900">
                  {diagnostics.airtable.tokenExpiry
                ? new Date(diagnostics.airtable.tokenExpiry).toLocaleString()
                : 'N/A'}
                </span>
              </div>
              {diagnostics.airtable.lastRefreshError && (<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <span className="text-xs text-red-800 font-medium">Last Error:</span>
                  <p className="text-xs text-red-700 mt-1">{diagnostics.airtable.lastRefreshError}</p>
                </div>)}
            </div>
          </div>

          {/* Google Sheets Connection */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span>Google Sheets Connection</span>
              {diagnostics.google.connected ? (<span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Connected</span>) : (<span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Not Connected</span>)}
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Needs Reauth:</span>
                <span className={diagnostics.google.needsReauth ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {diagnostics.google.needsReauth ? 'Yes ❌' : 'No ✓'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Decryption:</span>
                <span className={diagnostics.google.canDecryptTokens ? 'text-green-600' : 'text-red-600 font-medium'}>
                  {diagnostics.google.canDecryptTokens ? 'Working ✓' : 'Failed ❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Expiry:</span>
                <span className="text-gray-900">
                  {diagnostics.google.tokenExpiry
                ? new Date(diagnostics.google.tokenExpiry).toLocaleString()
                : 'N/A'}
                </span>
              </div>
              {diagnostics.google.lastRefreshError && (<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <span className="text-xs text-red-800 font-medium">Last Error:</span>
                  <p className="text-xs text-red-700 mt-1">{diagnostics.google.lastRefreshError}</p>
                </div>)}
            </div>
          </div>

          {/* Recommendations */}
          {diagnostics.recommendations.length > 0 && (<div className="border border-yellow-200 rounded-md p-4 bg-yellow-50">
              <h4 className="font-medium text-yellow-900 mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm text-yellow-800 list-disc list-inside">
                {diagnostics.recommendations.map((rec, idx) => (<li key={idx}>{rec}</li>))}
              </ul>
            </div>)}

          {/* Clear Flags Button */}
          {(diagnostics.airtable.needsReauth || diagnostics.google.needsReauth) && (<div className="flex justify-end pt-2">
              <button onClick={handleClearFlags} disabled={isClearing} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
                {isClearing ? 'Clearing...' : 'Clear "Needs Reauth" Flags'}
              </button>
            </div>)}
        </div>)}

      {!diagnostics && !isRunning && (<p className="text-sm text-gray-500 text-center py-4">
          Click "Run Diagnostics" to check your connection status
        </p>)}
    </div>);
}
//# sourceMappingURL=ConnectionDiagnostics.jsx.map