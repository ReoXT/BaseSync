import { createAction } from '../../middleware/operations.js'
import forceRefreshUserToken from '../../actions/forceRefreshUserToken.js'

export default createAction(forceRefreshUserToken)
