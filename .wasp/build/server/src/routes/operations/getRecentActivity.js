import { createQuery } from '../../middleware/operations.js'
import getRecentActivity from '../../queries/getRecentActivity.js'

export default createQuery(getRecentActivity)
