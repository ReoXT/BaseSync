import express from 'express';
import { prisma } from 'wasp/server';
import { defineHandler } from 'wasp/server/utils';
import { globalMiddlewareConfigForExpress } from '../../middleware/index.js';
import auth from 'wasp/core/auth';
import { makeAuthUserIfPossible } from 'wasp/auth/user';
import { paymentsWebhook as _wasppaymentsWebhookfn } from '../../../../../../src/payment/webhook';
import { paymentsMiddlewareConfigFn as _wasppaymentsWebhookmiddlewareConfigFn } from '../../../../../../src/payment/webhook';
const idFn = x => x;
const router = express.Router();
const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(_wasppaymentsWebhookmiddlewareConfigFn);
router.post('/payments-webhook', [auth, ...paymentsWebhookMiddleware], defineHandler((req, res) => {
    const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
            User: prisma.user,
        },
    };
    return _wasppaymentsWebhookfn(req, res, context);
}));
export default router;
//# sourceMappingURL=index.js.map