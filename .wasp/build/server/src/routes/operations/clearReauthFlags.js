import { createAction } from '../../middleware/operations.js'
import clearReauthFlags from '../../actions/clearReauthFlags.js'

export default createAction(clearReauthFlags)
