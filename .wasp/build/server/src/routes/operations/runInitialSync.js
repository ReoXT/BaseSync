import { createAction } from '../../middleware/operations.js'
import runInitialSync from '../../actions/runInitialSync.js'

export default createAction(runInitialSync)
