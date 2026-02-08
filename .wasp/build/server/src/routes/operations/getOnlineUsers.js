import { createQuery } from '../../middleware/operations.js'
import getOnlineUsers from '../../queries/getOnlineUsers.js'

export default createQuery(getOnlineUsers)
