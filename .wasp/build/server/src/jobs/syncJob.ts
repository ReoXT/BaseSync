import { registerJob } from 'wasp/server/jobs/core/pgBoss'
import { performSync } from '../../../../../src/server/jobs/syncJob'
import { syncJob as _waspJobDefinition } from 'wasp/server/jobs'

registerJob({
  job: _waspJobDefinition,
  jobFn: performSync,
})
