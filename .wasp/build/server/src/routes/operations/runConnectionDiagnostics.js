import { createAction } from '../../middleware/operations.js'
import runConnectionDiagnostics from '../../actions/runConnectionDiagnostics.js'

export default createAction(runConnectionDiagnostics)
