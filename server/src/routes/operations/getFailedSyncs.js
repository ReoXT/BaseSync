import { createQuery } from '../../middleware/operations.js'
import getFailedSyncs from '../../queries/getFailedSyncs.js'

export default createQuery(getFailedSyncs)
