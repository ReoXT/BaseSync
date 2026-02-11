import http from 'http';
import express, { Router } from 'express';
import * as z from 'zod';
import { z as z$1 } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { Lucia } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { verify, hash } from '@node-rs/argon2';
import { registerCustom, deserialize, serialize } from 'superjson';
import * as crypto from 'crypto';
import crypto__default from 'crypto';
import Stripe from 'stripe';
import { createTransport } from 'nodemailer';
import { Resend } from 'resend';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import * as jwt from 'oslo/jwt';
import { TimeSpan } from 'oslo';
import PgBoss from 'pg-boss';
import { listOrders } from '@lemonsqueezy/lemonsqueezy.js';
import { Polar } from '@polar-sh/sdk';
import { OrderStatus } from '@polar-sh/sdk/models/components/orderstatus.js';

const colors = {
  red: "\x1B[31m",
  yellow: "\x1B[33m"
};
const resetColor = "\x1B[0m";
function getColorizedConsoleFormatString(colorKey) {
  const color = colors[colorKey];
  return `${color}%s${resetColor}`;
}

const redColorFormatString = getColorizedConsoleFormatString("red");
function ensureEnvSchema(data, schema) {
  const result = getValidatedEnvOrError(data, schema);
  if (result.success) {
    return result.data;
  } else {
    console.error(`${redColorFormatString}${formatZodEnvErrors(result.error.issues)}`);
    throw new Error("Error parsing environment variables");
  }
}
function getValidatedEnvOrError(env, schema) {
  return schema.safeParse(env);
}
function formatZodEnvErrors(issues) {
  const errorOutput = ["", "\u2550\u2550 Env vars validation failed \u2550\u2550", ""];
  for (const error of issues) {
    errorOutput.push(` - ${error.message}`);
  }
  errorOutput.push("");
  errorOutput.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  return errorOutput.join("\n");
}

const userServerEnvSchema = z.object({});
const waspServerCommonSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required"
  }),
  PG_BOSS_NEW_OPTIONS: z.string().optional(),
  SMTP_HOST: z.string({
    required_error: getRequiredEnvVarErrorMessage("SMTP email sender", "SMTP_HOST")
  }),
  SMTP_PORT: z.coerce.number({
    required_error: getRequiredEnvVarErrorMessage("SMTP email sender", "SMTP_PORT"),
    invalid_type_error: "SMTP_PORT must be a number"
  }),
  SMTP_USERNAME: z.string({
    required_error: getRequiredEnvVarErrorMessage("SMTP email sender", "SMTP_USERNAME")
  }),
  SMTP_PASSWORD: z.string({
    required_error: getRequiredEnvVarErrorMessage("SMTP email sender", "SMTP_PASSWORD")
  }),
  SKIP_EMAIL_VERIFICATION_IN_DEV: z.enum(["true", "false"], {
    message: 'SKIP_EMAIL_VERIFICATION_IN_DEV must be either "true" or "false"'
  }).transform((value) => value === "true").default("false")
});
const serverUrlSchema = z.string({
  required_error: "WASP_SERVER_URL is required"
}).url({
  message: "WASP_SERVER_URL must be a valid URL"
});
const clientUrlSchema = z.string({
  required_error: "WASP_WEB_CLIENT_URL is required"
}).url({
  message: "WASP_WEB_CLIENT_URL must be a valid URL"
});
const jwtTokenSchema = z.string({
  required_error: "JWT_SECRET is required"
});
const serverDevSchema = z.object({
  NODE_ENV: z.literal("development"),
  "WASP_SERVER_URL": serverUrlSchema.default("http://localhost:3001"),
  "WASP_WEB_CLIENT_URL": clientUrlSchema.default("http://localhost:3000/"),
  "JWT_SECRET": jwtTokenSchema.default("DEVJWTSECRET")
});
const serverProdSchema = z.object({
  NODE_ENV: z.literal("production"),
  "WASP_SERVER_URL": serverUrlSchema,
  "WASP_WEB_CLIENT_URL": clientUrlSchema,
  "JWT_SECRET": jwtTokenSchema
});
const serverCommonSchema = userServerEnvSchema.merge(waspServerCommonSchema);
const serverEnvSchema = z.discriminatedUnion("NODE_ENV", [
  serverDevSchema.merge(serverCommonSchema),
  serverProdSchema.merge(serverCommonSchema)
]);
const defaultNodeEnvValue = serverDevSchema.shape.NODE_ENV.value;
const { NODE_ENV: inputNodeEnvValue, ...restEnv } = process.env;
const env = ensureEnvSchema({
  NODE_ENV: inputNodeEnvValue ?? defaultNodeEnvValue,
  ...restEnv
}, serverEnvSchema);
function getRequiredEnvVarErrorMessage(featureName, envVarName) {
  return `${envVarName} is required when using ${featureName}`;
}

function stripTrailingSlash(url) {
  return url?.replace(/\/$/, "");
}
function getOrigin(url) {
  return new URL(url).origin;
}

const frontendUrl = stripTrailingSlash(env["WASP_WEB_CLIENT_URL"]);
stripTrailingSlash(env["WASP_SERVER_URL"]);
const allowedCORSOriginsPerEnv = {
  development: [/.*/],
  production: [getOrigin(frontendUrl)]
};
const allowedCORSOrigins = allowedCORSOriginsPerEnv[env.NODE_ENV];
const config$1 = {
  frontendUrl,
  allowedCORSOrigins,
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  auth: {
    jwtSecret: env["JWT_SECRET"]
  }
};

function createDbClient() {
  return new PrismaClient();
}
const dbClient = createDbClient();

class HttpError extends Error {
  statusCode;
  data;
  constructor(statusCode, message, data, options) {
    super(message, options);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
    this.name = this.constructor.name;
    if (!(Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600)) {
      throw new Error("statusCode has to be integer in range [400, 600).");
    }
    this.statusCode = statusCode;
    if (data) {
      this.data = data;
    }
  }
}

const prismaAdapter = new PrismaAdapter(dbClient.session, dbClient.auth);
const auth$1 = new Lucia(prismaAdapter, {
  // Since we are not using cookies, we don't need to set any cookie options.
  // But in the future, if we decide to use cookies, we can set them here.
  // sessionCookie: {
  //   name: "session",
  //   expires: true,
  //   attributes: {
  //     secure: !config.isDevelopment,
  //     sameSite: "lax",
  //   },
  // },
  getUserAttributes({ userId }) {
    return {
      userId
    };
  }
});

const hashingOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
  version: 1
};
async function hashPassword(password) {
  return hash(normalizePassword(password), hashingOptions);
}
async function verifyPassword(hashedPassword, password) {
  const validPassword = await verify(hashedPassword, normalizePassword(password), hashingOptions);
  if (!validPassword) {
    throw new Error("Invalid password");
  }
}
function normalizePassword(password) {
  return password.normalize("NFKC");
}

const defineHandler = (middleware) => middleware;
const sleep$1 = (ms) => new Promise((r) => setTimeout(r, ms));

const PASSWORD_FIELD = "password";
const EMAIL_FIELD = "email";
const TOKEN_FIELD = "token";
function ensureValidEmail(args) {
  validate(args, [
    { validates: EMAIL_FIELD, message: "email must be present", validator: (email) => !!email },
    { validates: EMAIL_FIELD, message: "email must be a valid email", validator: (email) => isValidEmail(email) }
  ]);
}
function ensurePasswordIsPresent(args) {
  validate(args, [
    { validates: PASSWORD_FIELD, message: "password must be present", validator: (password) => !!password }
  ]);
}
function ensureValidPassword(args) {
  validate(args, [
    { validates: PASSWORD_FIELD, message: "password must be at least 8 characters", validator: (password) => isMinLength(password, 8) },
    { validates: PASSWORD_FIELD, message: "password must contain a number", validator: (password) => containsNumber(password) }
  ]);
}
function ensureTokenIsPresent(args) {
  validate(args, [
    { validates: TOKEN_FIELD, message: "token must be present", validator: (token) => !!token }
  ]);
}
function throwValidationError(message) {
  throw new HttpError(422, "Validation failed", { message });
}
function validate(args, validators) {
  for (const { validates, message, validator } of validators) {
    if (!validator(args[validates])) {
      throwValidationError(message);
    }
  }
}
const validEmailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
function isValidEmail(input) {
  if (typeof input !== "string") {
    return false;
  }
  return input.match(validEmailRegex) !== null;
}
function isMinLength(input, minLength) {
  if (typeof input !== "string") {
    return false;
  }
  return input.length >= minLength;
}
function containsNumber(input) {
  if (typeof input !== "string") {
    return false;
  }
  return /\d/.test(input);
}

({
  entities: {
    User: dbClient.user
  }
});
function createProviderId(providerName, providerUserId) {
  return {
    providerName,
    providerUserId: normalizeProviderUserId(providerName, providerUserId)
  };
}
function normalizeProviderUserId(providerName, providerUserId) {
  switch (providerName) {
    case "email":
    case "username":
      return providerUserId.toLowerCase();
    case "google":
    case "github":
    case "discord":
    case "keycloak":
    case "slack":
      return providerUserId;
    /*
          Why the default case?
          In case users add a new auth provider in the user-land.
          Users can't extend this function because it is private.
          If there is an unknown `providerName` in runtime, we'll
          return the `providerUserId` as is.
    
          We want to still have explicit OAuth providers listed
          so that we get a type error if we forget to add a new provider
          to the switch statement.
        */
    default:
      return providerUserId;
  }
}
async function findAuthIdentity(providerId) {
  return dbClient.authIdentity.findUnique({
    where: {
      providerName_providerUserId: providerId
    }
  });
}
async function updateAuthIdentityProviderData(providerId, existingProviderData, providerDataUpdates) {
  const sanitizedProviderDataUpdates = await ensurePasswordIsHashed(providerDataUpdates);
  const newProviderData = {
    ...existingProviderData,
    ...sanitizedProviderDataUpdates
  };
  const serializedProviderData = await serializeProviderData(newProviderData);
  return dbClient.authIdentity.update({
    where: {
      providerName_providerUserId: providerId
    },
    data: { providerData: serializedProviderData }
  });
}
async function findAuthWithUserBy(where) {
  const result = await dbClient.auth.findFirst({ where, include: { user: true } });
  if (result === null) {
    return null;
  }
  if (result.user === null) {
    return null;
  }
  return { ...result, user: result.user };
}
async function createUser(providerId, serializedProviderData, userFields) {
  return dbClient.user.create({
    data: {
      // Using any here to prevent type errors when userFields are not
      // defined. We want Prisma to throw an error in that case.
      ...userFields ?? {},
      auth: {
        create: {
          identities: {
            create: {
              providerName: providerId.providerName,
              providerUserId: providerId.providerUserId,
              providerData: serializedProviderData
            }
          }
        }
      }
    },
    // We need to include the Auth entity here because we need `authId`
    // to be able to create a session.
    include: {
      auth: true
    }
  });
}
async function deleteUserByAuthId(authId) {
  return dbClient.user.deleteMany({ where: { auth: {
    id: authId
  } } });
}
async function doFakeWork() {
  const timeToWork = Math.floor(Math.random() * 1e3) + 1e3;
  return sleep$1(timeToWork);
}
function rethrowPossibleAuthError(e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new HttpError(422, "Save failed", {
      message: `user with the same identity already exists`
    });
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    console.error(e);
    throw new HttpError(422, "Save failed", {
      message: "there was a database error"
    });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
    console.error(e);
    console.info("\u{1F41D} This error can happen if you did't run the database migrations.");
    throw new HttpError(500, "Save failed", {
      message: `there was a database error`
    });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
    console.error(e);
    console.info(`\u{1F41D} This error can happen if you have some relation on your User entity
   but you didn't specify the "onDelete" behaviour to either "Cascade" or "SetNull".
   Read more at: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions`);
    throw new HttpError(500, "Save failed", {
      message: `there was a database error`
    });
  }
  throw e;
}
async function validateAndGetUserFields(data, userSignupFields) {
  const { password: _password, ...sanitizedData } = data;
  const result = {};
  if (!userSignupFields) {
    return result;
  }
  for (const [field, getFieldValue] of Object.entries(userSignupFields)) {
    try {
      const value = await getFieldValue(sanitizedData);
      result[field] = value;
    } catch (e) {
      throwValidationError(e.message);
    }
  }
  return result;
}
function getProviderData(providerData) {
  return sanitizeProviderData(getProviderDataWithPassword(providerData));
}
function getProviderDataWithPassword(providerData) {
  return JSON.parse(providerData);
}
function sanitizeProviderData(providerData) {
  if (providerDataHasPasswordField(providerData)) {
    const { hashedPassword, ...rest } = providerData;
    return rest;
  } else {
    return providerData;
  }
}
async function sanitizeAndSerializeProviderData(providerData) {
  return serializeProviderData(await ensurePasswordIsHashed(providerData));
}
function serializeProviderData(providerData) {
  return JSON.stringify(providerData);
}
async function ensurePasswordIsHashed(providerData) {
  const data = {
    ...providerData
  };
  if (providerDataHasPasswordField(data)) {
    data.hashedPassword = await hashPassword(data.hashedPassword);
  }
  return data;
}
function providerDataHasPasswordField(providerData) {
  return "hashedPassword" in providerData;
}
function createInvalidCredentialsError(message) {
  return new HttpError(401, "Invalid credentials", { message });
}

function createAuthUserData(user) {
  const { auth, ...rest } = user;
  if (!auth) {
    throw new Error(`\u{1F41D} Error: trying to create a user without auth data.
This should never happen, but it did which means there is a bug in the code.`);
  }
  const identities = {
    email: getProviderInfo(auth, "email")
  };
  return {
    ...rest,
    identities
  };
}
function getProviderInfo(auth, providerName) {
  const identity = getIdentity(auth, providerName);
  if (!identity) {
    return null;
  }
  return {
    ...getProviderData(identity.providerData),
    id: identity.providerUserId
  };
}
function getIdentity(auth, providerName) {
  return auth.identities.find((i) => i.providerName === providerName) ?? null;
}

async function createSession(authId) {
  return auth$1.createSession(authId, {});
}
async function getSessionAndUserFromBearerToken(req) {
  const authorizationHeader = req.headers["authorization"];
  if (typeof authorizationHeader !== "string") {
    return null;
  }
  const sessionId = auth$1.readBearerToken(authorizationHeader);
  if (!sessionId) {
    return null;
  }
  return getSessionAndUserFromSessionId(sessionId);
}
async function getSessionAndUserFromSessionId(sessionId) {
  const { session, user: authEntity } = await auth$1.validateSession(sessionId);
  if (!session || !authEntity) {
    return null;
  }
  return {
    session,
    user: await getAuthUserData(authEntity.userId)
  };
}
async function getAuthUserData(userId) {
  const user = await dbClient.user.findUnique({
    where: { id: userId },
    include: {
      auth: {
        include: {
          identities: true
        }
      }
    }
  });
  if (!user) {
    throw createInvalidCredentialsError();
  }
  return createAuthUserData(user);
}
function invalidateSession(sessionId) {
  return auth$1.invalidateSession(sessionId);
}

const auth = defineHandler(async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.sessionId = null;
    req.user = null;
    return next();
  }
  const sessionAndUser = await getSessionAndUserFromBearerToken(req);
  if (sessionAndUser === null) {
    throw createInvalidCredentialsError();
  }
  req.sessionId = sessionAndUser.session.id;
  req.user = sessionAndUser.user;
  next();
});

const Decimal = Prisma.Decimal;
if (Decimal) {
  registerCustom({
    isApplicable: (v) => Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Decimal(v)
  }, "prisma.decimal");
}

function isNotNull(value) {
  return value !== null;
}

function makeAuthUserIfPossible(user) {
  return user ? makeAuthUser(user) : null;
}
function makeAuthUser(data) {
  return {
    ...data,
    getFirstProviderUserId: () => {
      const identities = Object.values(data.identities).filter(isNotNull);
      return identities.length > 0 ? identities[0].id : null;
    }
  };
}

function createOperation(handlerFn) {
  return defineHandler(async (req, res) => {
    const args = req.body && deserialize(req.body) || {};
    const context = {
      user: makeAuthUserIfPossible(req.user)
    };
    const result = await handlerFn(args, context);
    const serializedResult = serialize(result);
    res.json(serializedResult);
  });
}
function createQuery(handlerFn) {
  return createOperation(handlerFn);
}
function createAction(handlerFn) {
  return createOperation(handlerFn);
}

function requireNodeEnvVar(name) {
  const value = process.env[name];
  if (value === void 0) {
    throw new Error(`Env var ${name} is undefined`);
  } else {
    return value;
  }
}

var SubscriptionStatus = /* @__PURE__ */ ((SubscriptionStatus2) => {
  SubscriptionStatus2["PastDue"] = "past_due";
  SubscriptionStatus2["CancelAtPeriodEnd"] = "cancel_at_period_end";
  SubscriptionStatus2["Active"] = "active";
  SubscriptionStatus2["Deleted"] = "deleted";
  return SubscriptionStatus2;
})(SubscriptionStatus || {});
var PaymentPlanId = /* @__PURE__ */ ((PaymentPlanId2) => {
  PaymentPlanId2["Starter"] = "starter";
  PaymentPlanId2["Pro"] = "pro";
  PaymentPlanId2["Business"] = "business";
  PaymentPlanId2["StarterAnnual"] = "starter-annual";
  PaymentPlanId2["ProAnnual"] = "pro-annual";
  PaymentPlanId2["BusinessAnnual"] = "business-annual";
  return PaymentPlanId2;
})(PaymentPlanId || {});
const paymentPlans = {
  ["starter" /* Starter */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["pro" /* Pro */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["business" /* Business */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["starter-annual" /* StarterAnnual */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_STARTER_ANNUAL_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["pro-annual" /* ProAnnual */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_PRO_ANNUAL_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  },
  ["business-annual" /* BusinessAnnual */]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_BUSINESS_ANNUAL_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" }
  }
};
function getPaymentPlanIdByPaymentProcessorPlanId(paymentProcessorPlanId) {
  for (const [planId, plan] of Object.entries(paymentPlans)) {
    if (plan.getPaymentProcessorPlanId() === paymentProcessorPlanId) {
      return planId;
    }
  }
  throw new Error(
    `Unknown payment processor plan ID: ${paymentProcessorPlanId}`
  );
}

function ensureArgsSchemaOrThrowHttpError(schema, rawArgs) {
  const parseResult = schema.safeParse(rawArgs);
  if (!parseResult.success) {
    console.error(parseResult.error);
    throw new HttpError(400, "Operation arguments validation failed", {
      errors: parseResult.error.errors
    });
  } else {
    return parseResult.data;
  }
}

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean()
});
const updateIsUserAdminById$2 = async (rawArgs, context) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(
    updateUserAdminByIdInputSchema,
    rawArgs
  );
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation"
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation"
    );
  }
  return context.entities.User.update({
    where: { id },
    data: { isAdmin }
  });
};
const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
    subscriptionStatusIn: z.array(z.nativeEnum(SubscriptionStatus).nullable()).optional()
  })
});
const getPaginatedUsers$2 = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation"
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation"
    );
  }
  const {
    skipPages,
    filter: {
      subscriptionStatusIn: subscriptionStatus,
      emailContains,
      isAdmin
    }
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);
  const includeUnsubscribedUsers = !!subscriptionStatus?.some(
    (status) => status === null
  );
  const desiredSubscriptionStatuses = subscriptionStatus?.filter(
    (status) => status !== null
  );
  const pageSize = 10;
  const userPageQuery = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      AND: [
        {
          email: {
            contains: emailContains,
            mode: "insensitive"
          },
          isAdmin
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: desiredSubscriptionStatuses
              }
            },
            {
              subscriptionStatus: includeUnsubscribedUsers ? null : void 0
            }
          ]
        }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true
    },
    orderBy: {
      username: "asc"
    }
  };
  const [pageOfUsers, totalUsers] = await dbClient.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where })
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);
  return {
    users: pageOfUsers,
    totalPages
  };
};

async function updateIsUserAdminById$1(args, context) {
  return updateIsUserAdminById$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var updateIsUserAdminById = createAction(updateIsUserAdminById$1);

const updateUsername$2 = async ({ username }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    throw new HttpError(400, "Username must be 3-30 characters and contain only letters, numbers, dashes, and underscores");
  }
  const existingUser = await context.entities.User.findUnique({
    where: { username }
  });
  if (existingUser && existingUser.id !== context.user.id) {
    throw new HttpError(400, "Username is already taken");
  }
  await context.entities.User.update({
    where: { id: context.user.id },
    data: { username }
  });
};
const requestEmailChange$2 = async ({ newEmail }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new HttpError(400, "Invalid email format");
  }
  const existingUser = await context.entities.User.findUnique({
    where: { email: newEmail }
  });
  if (existingUser && existingUser.id !== context.user.id) {
    throw new HttpError(400, "Email is already in use");
  }
  const token = crypto__default.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1e3);
  await context.entities.User.update({
    where: { id: context.user.id },
    data: {
      pendingEmail: newEmail,
      emailChangeToken: token,
      emailChangeTokenExpiry: expiry
    }
  });
  const verificationLink = `${process.env.WASP_WEB_CLIENT_URL}/account/verify-email-change?token=${token}`;
  try {
    await context.entities.User.update({
      where: { id: context.user.id },
      data: {}
      // Trigger to send email via emailSender
    });
    console.log("\u{1F517} Email verification link:", verificationLink);
    console.log("\u{1F4E7} Send this to:", newEmail);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new HttpError(500, "Failed to send verification email");
  }
};
const confirmEmailChange$2 = async ({ token }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id }
  });
  if (!user || !user.emailChangeToken || !user.emailChangeTokenExpiry || !user.pendingEmail) {
    throw new HttpError(400, "Invalid or expired verification link");
  }
  if (user.emailChangeToken !== token) {
    throw new HttpError(400, "Invalid verification link");
  }
  if (/* @__PURE__ */ new Date() > user.emailChangeTokenExpiry) {
    throw new HttpError(400, "Verification link has expired. Please request a new email change.");
  }
  const existingUser = await context.entities.User.findUnique({
    where: { email: user.pendingEmail }
  });
  if (existingUser && existingUser.id !== user.id) {
    throw new HttpError(400, "This email address is no longer available");
  }
  await context.entities.User.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpiry: null
    }
  });
  return {
    success: true,
    email: user.pendingEmail
  };
};
const updateNotificationPreferences$2 = async ({ emailNotifications, syncFailureAlerts, weeklyDigest }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  await context.entities.User.update({
    where: { id: context.user.id },
    data: {
      emailNotifications,
      syncFailureAlerts,
      weeklyDigest
    }
  });
};

async function updateUsername$1(args, context) {
  return updateUsername$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var updateUsername = createAction(updateUsername$1);

async function requestEmailChange$1(args, context) {
  return requestEmailChange$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var requestEmailChange = createAction(requestEmailChange$1);

async function confirmEmailChange$1(args, context) {
  return confirmEmailChange$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var confirmEmailChange = createAction(confirmEmailChange$1);

async function updateNotificationPreferences$1(args, context) {
  return updateNotificationPreferences$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var updateNotificationPreferences = createAction(updateNotificationPreferences$1);

const changePassword$2 = async ({ currentPassword, newPassword }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (newPassword.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new HttpError(400, "Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new HttpError(400, "Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new HttpError(400, "Password must contain at least one number");
  }
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      auth: {
        include: {
          identities: true
        }
      }
    }
  });
  if (!user || !user.auth) {
    throw new HttpError(404, "User not found");
  }
  const emailIdentity = user.auth.identities.find(
    (identity) => identity.providerName === "email"
  );
  if (!emailIdentity) {
    throw new HttpError(400, "Email authentication not set up for this account");
  }
  if (!emailIdentity.providerUserId || emailIdentity.providerUserId.trim() === "") {
    console.error("\u274C Missing password hash for user:", user.id);
    throw new HttpError(500, "Password data is missing. Please try resetting your password instead.");
  }
  console.log("\u{1F510} Password change attempt for user:", user.id);
  let hashedNewPassword;
  try {
    await verifyPassword(
      emailIdentity.providerUserId,
      currentPassword
    );
    hashedNewPassword = await hashPassword(newPassword);
  } catch (error) {
    console.error("Password operation failed:", error);
    if (error.message?.includes("Invalid password") || error.message?.includes("does not match")) {
      throw new HttpError(400, "Current password is incorrect");
    }
    if (error.code === "InvalidArg" || error.message?.includes("missing field")) {
      throw new HttpError(500, "Password verification error. Please contact support.");
    }
    throw new HttpError(500, "Password management failed");
  }
  await dbClient.authIdentity.updateMany({
    where: {
      providerName: "email",
      authId: user.auth.id
    },
    data: {
      providerUserId: hashedNewPassword
    }
  });
  console.log(`\u2705 Password changed for user ${user.id} (${user.email})`);
};

async function changePassword$1(args, context) {
  return changePassword$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var changePassword = createAction(changePassword$1);

const STRIPE_API_VERSION = "2025-04-30.basil";
const stripeClient = new Stripe(requireNodeEnvVar("STRIPE_API_KEY"), {
  apiVersion: STRIPE_API_VERSION
});

const exportUserData$2 = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      airtableConnections: {
        select: {
          id: true,
          createdAt: true,
          accountId: true,
          needsReauth: true
          // Exclude encrypted tokens
        }
      },
      googleSheetsConnections: {
        select: {
          id: true,
          createdAt: true,
          googleAccountEmail: true,
          needsReauth: true
          // Exclude encrypted tokens
        }
      },
      syncConfigs: {
        select: {
          id: true,
          name: true,
          airtableBaseId: true,
          airtableTableName: true,
          googleSpreadsheetId: true,
          googleSheetName: true,
          syncDirection: true,
          conflictResolution: true,
          isActive: true,
          lastSyncAt: true,
          lastSyncStatus: true,
          createdAt: true,
          updatedAt: true,
          syncLogs: {
            take: 100,
            // Last 100 sync logs
            orderBy: {
              createdAt: "desc"
            },
            select: {
              id: true,
              status: true,
              recordsSynced: true,
              recordsFailed: true,
              startedAt: true,
              completedAt: true,
              triggeredBy: true
            }
          }
        }
      },
      usageStats: true
    }
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  const allSyncLogs = user.syncConfigs.flatMap(
    (config) => config.syncLogs.map((log) => ({
      ...log,
      syncConfigName: config.name,
      syncConfigId: config.id
    }))
  );
  const exportData = {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin
    },
    subscription: {
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      credits: user.credits,
      datePaid: user.datePaid,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt
    },
    notifications: {
      emailNotifications: user.emailNotifications,
      syncFailureAlerts: user.syncFailureAlerts,
      weeklyDigest: user.weeklyDigest
    },
    connections: {
      airtable: user.airtableConnections.map((conn) => ({
        id: conn.id,
        connectedAt: conn.createdAt,
        accountId: conn.accountId,
        needsReauth: conn.needsReauth
      })),
      googleSheets: user.googleSheetsConnections.map((conn) => ({
        id: conn.id,
        connectedAt: conn.createdAt,
        googleAccountEmail: conn.googleAccountEmail,
        needsReauth: conn.needsReauth
      }))
    },
    syncConfigurations: user.syncConfigs.map(({ syncLogs, ...config }) => config),
    syncHistory: allSyncLogs,
    usageStatistics: user.usageStats
  };
  return exportData;
};
const deleteAccount$2 = async ({ confirmationText, password }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (confirmationText !== "DELETE MY ACCOUNT") {
    throw new HttpError(400, "Confirmation text does not match. Please type exactly: DELETE MY ACCOUNT");
  }
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      auth: {
        include: {
          identities: true
        }
      }
    }
  });
  if (!user || !user.auth) {
    throw new HttpError(404, "User not found");
  }
  const emailIdentity = user.auth.identities.find(
    (identity) => identity.providerName === "email"
  );
  if (!emailIdentity) {
    throw new HttpError(400, "Email authentication not set up for this account");
  }
  try {
    await verifyPassword(
      emailIdentity.providerUserId,
      password
    );
  } catch (error) {
    console.error("Password verification failed:", error);
    throw new HttpError(400, "Incorrect password");
  }
  if (user.subscriptionStatus === "active" && user.paymentProcessorUserId) {
    try {
      const subscriptions = await stripeClient.subscriptions.list({
        customer: user.paymentProcessorUserId,
        status: "active"
      });
      for (const subscription of subscriptions.data) {
        await stripeClient.subscriptions.cancel(subscription.id);
        console.log(`\u2705 Cancelled subscription ${subscription.id} for user ${user.id}`);
      }
    } catch (error) {
      console.error("Failed to cancel Stripe subscription:", error);
    }
  }
  console.log(`\u{1F44B} Account deletion requested for ${user.email}`);
  await context.entities.User.delete({
    where: { id: user.id }
  });
  console.log(`\u{1F5D1}\uFE0F User ${user.id} deleted successfully`);
};

async function deleteAccount$1(args, context) {
  return deleteAccount$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      UsageStats: dbClient.usageStats
    }
  });
}

var deleteAccount = createAction(deleteAccount$1);

function assertUnreachable(_) {
  throw Error("This code should be unreachable");
}

async function fetchUserPaymentProcessorUserId(userId, prismaUserDelegate) {
  const user = await prismaUserDelegate.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      paymentProcessorUserId: true
    }
  });
  return user.paymentProcessorUserId;
}
function updateUserPaymentProcessorUserId({ userId, paymentProcessorUserId }, prismaUserDelegate) {
  return prismaUserDelegate.update({
    where: {
      id: userId
    },
    data: {
      paymentProcessorUserId
    }
  });
}
function updateUserSubscription({
  paymentProcessorUserId,
  paymentPlanId,
  subscriptionStatus,
  datePaid
}, userDelegate) {
  return userDelegate.update({
    where: {
      paymentProcessorUserId
    },
    data: {
      subscriptionPlan: paymentPlanId,
      subscriptionStatus,
      datePaid
    }
  });
}

async function ensureStripeCustomer(userEmail) {
  const customers = await stripeClient.customers.list({
    email: userEmail
  });
  if (customers.data.length === 0) {
    return stripeClient.customers.create({
      email: userEmail
    });
  } else {
    return customers.data[0];
  }
}
function createStripeCheckoutSession({
  priceId,
  customerId,
  mode,
  returnUrl
}) {
  const baseReturnUrl = returnUrl || "/pricing";
  return stripeClient.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode,
    success_url: `${config$1.frontendUrl}${baseReturnUrl}${baseReturnUrl.includes("?") ? "&" : "?"}checkout=success`,
    cancel_url: `${config$1.frontendUrl}${baseReturnUrl}${baseReturnUrl.includes("?") ? "&" : "?"}checkout=canceled`,
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    customer_update: {
      address: "auto"
    },
    invoice_creation: getInvoiceCreationConfig(mode),
    // Add 14-day free trial for subscription mode
    ...mode === "subscription" && {
      subscription_data: {
        trial_period_days: 14
      },
      payment_method_collection: "always"
      // Require card upfront (won't be charged during trial)
    }
  });
}
function getInvoiceCreationConfig(mode) {
  return mode === "payment" ? {
    enabled: true
  } : void 0;
}

function formatFromField({ email, name }) {
  if (name) {
    return `${name} <${email}>`;
  }
  return email;
}
function getDefaultFromField() {
  return {
    email: "noreply@basesync.app",
    name: "BaseSync"
  };
}

function initSmtpEmailSender(config) {
  const transporter = createTransport({
    host: config.host,
    port: config.port,
    auth: {
      user: config.username,
      pass: config.password
    }
  });
  const defaultFromField = getDefaultFromField();
  return {
    async send(email) {
      return transporter.sendMail({
        from: formatFromField(email.from || defaultFromField),
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
    }
  };
}

const emailProvider = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  username: env.SMTP_USERNAME,
  password: env.SMTP_PASSWORD
};
const emailSender = initSmtpEmailSender(emailProvider);

class UnhandledWebhookEventError extends Error {
  constructor(eventType) {
    super(`Unhandled event type: ${eventType}`);
    this.name = "UnhandledWebhookEventError";
  }
}

const stripeMiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.delete("express.json");
  middlewareConfig.set(
    "express.raw",
    express.raw({ type: "application/json" })
  );
  return middlewareConfig;
};
const stripeWebhook = async (request, response, context) => {
  const prismaUserDelegate = context.entities.User;
  try {
    const event = constructStripeEvent(request);
    switch (event.type) {
      case "invoice.paid":
        await handleInvoicePaid(event, prismaUserDelegate);
        break;
      case "customer.subscription.updated":
        await handleCustomerSubscriptionUpdated(event, prismaUserDelegate);
        break;
      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(event, prismaUserDelegate);
        break;
      default:
        throw new UnhandledWebhookEventError(event.type);
    }
    return response.status(204).send();
  } catch (error) {
    if (error instanceof UnhandledWebhookEventError) {
      if (process.env.NODE_ENV === "development") {
        console.info("Unhandled Stripe webhook event in development: ", error);
      } else if (process.env.NODE_ENV === "production") {
        console.error("Unhandled Stripe webhook event in production: ", error);
      }
      return response.status(204).send();
    }
    console.error("Stripe webhook error:", error);
    if (error instanceof Error) {
      return response.status(400).json({ error: error.message });
    } else {
      return response.status(500).json({ error: "Error processing Stripe webhook event" });
    }
  }
};
function constructStripeEvent(request) {
  const stripeWebhookSecret = requireNodeEnvVar("STRIPE_WEBHOOK_SECRET");
  const stripeSignature = request.headers["stripe-signature"];
  if (!stripeSignature) {
    throw new Error("Stripe webhook signature not provided");
  }
  return stripeClient.webhooks.constructEvent(
    request.body,
    stripeSignature,
    stripeWebhookSecret
  );
}
async function handleInvoicePaid(event, prismaUserDelegate) {
  const invoice = event.data.object;
  const customerId = getCustomerId(invoice.customer);
  const invoicePaidAtDate = getInvoicePaidAtDate(invoice);
  const paymentPlanId = getPaymentPlanIdByPaymentProcessorPlanId(
    getInvoicePriceId(invoice)
  );
  await updateUserSubscription(
    {
      paymentProcessorUserId: customerId,
      datePaid: invoicePaidAtDate,
      paymentPlanId,
      subscriptionStatus: SubscriptionStatus.Active
    },
    prismaUserDelegate
  );
}
function getInvoicePriceId(invoice) {
  const invoiceLineItems = invoice.lines.data;
  if (invoiceLineItems.length !== 1) {
    throw new Error("There should be exactly one line item in Stripe invoice");
  }
  const priceId = invoiceLineItems[0].pricing?.price_details?.price;
  if (!priceId) {
    throw new Error("Unable to extract price id from items");
  }
  return priceId;
}
async function handleCustomerSubscriptionUpdated(event, prismaUserDelegate) {
  const subscription = event.data.object;
  const subscriptionStatus = getOpenSaasSubscriptionStatus(subscription);
  if (!subscriptionStatus) {
    return;
  }
  const customerId = getCustomerId(subscription.customer);
  const paymentPlanId = getPaymentPlanIdByPaymentProcessorPlanId(
    getSubscriptionPriceId(subscription)
  );
  const user = await updateUserSubscription(
    { paymentProcessorUserId: customerId, paymentPlanId, subscriptionStatus },
    prismaUserDelegate
  );
  if (subscription.cancel_at_period_end && user.email) {
    await emailSender.send({
      to: user.email,
      subject: "We hate to see you go :(",
      text: "We hate to see you go. Here is a sweet offer...",
      html: "We hate to see you go. Here is a sweet offer..."
    });
  }
}
function getOpenSaasSubscriptionStatus(subscription) {
  const stripeToOpenSaasSubscriptionStatus = {
    trialing: SubscriptionStatus.Active,
    active: SubscriptionStatus.Active,
    past_due: SubscriptionStatus.PastDue,
    canceled: SubscriptionStatus.Deleted,
    unpaid: SubscriptionStatus.Deleted,
    incomplete_expired: SubscriptionStatus.Deleted,
    paused: void 0,
    incomplete: void 0
  };
  const subscriptionStatus = stripeToOpenSaasSubscriptionStatus[subscription.status];
  if (subscriptionStatus === SubscriptionStatus.Active && subscription.cancel_at_period_end) {
    return SubscriptionStatus.CancelAtPeriodEnd;
  }
  return subscriptionStatus;
}
function getSubscriptionPriceId(subscription) {
  const subscriptionItems = subscription.items.data;
  if (subscriptionItems.length !== 1) {
    throw new Error(
      "There should be exactly one subscription item in Stripe subscription"
    );
  }
  return subscriptionItems[0].price.id;
}
async function handleCustomerSubscriptionDeleted(event, prismaUserDelegate) {
  const subscription = event.data.object;
  const customerId = getCustomerId(subscription.customer);
  await updateUserSubscription(
    {
      paymentProcessorUserId: customerId,
      subscriptionStatus: SubscriptionStatus.Deleted
    },
    prismaUserDelegate
  );
}
function getCustomerId(customer) {
  if (!customer) {
    throw new Error("Customer is missing");
  } else if (typeof customer === "string") {
    return customer;
  } else {
    return customer.id;
  }
}
function getInvoicePaidAtDate(invoice) {
  if (!invoice.status_transitions.paid_at) {
    throw new Error("Invoice has not been paid yet");
  }
  return new Date(invoice.status_transitions.paid_at * 1e3);
}

const stripePaymentProcessor = {
  id: "stripe",
  createCheckoutSession: async ({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate,
    returnUrl
  }) => {
    const customer = await ensureStripeCustomer(userEmail);
    await updateUserPaymentProcessorUserId(
      { userId, paymentProcessorUserId: customer.id },
      prismaUserDelegate
    );
    const checkoutSession = await createStripeCheckoutSession({
      customerId: customer.id,
      priceId: paymentPlan.getPaymentProcessorPlanId(),
      mode: paymentPlanEffectToStripeCheckoutSessionMode(paymentPlan.effect),
      returnUrl
    });
    if (!checkoutSession.url) {
      throw new Error(
        "Stripe checkout session URL is missing. Checkout session might not be active."
      );
    }
    return {
      session: {
        url: checkoutSession.url,
        id: checkoutSession.id
      }
    };
  },
  fetchCustomerPortalUrl: async ({
    prismaUserDelegate,
    userId,
    returnUrl
  }) => {
    const paymentProcessorUserId = await fetchUserPaymentProcessorUserId(
      userId,
      prismaUserDelegate
    );
    if (!paymentProcessorUserId) {
      return null;
    }
    const baseReturnUrl = returnUrl || "/pricing";
    const billingPortalSession = await stripeClient.billingPortal.sessions.create({
      customer: paymentProcessorUserId,
      return_url: `${config$1.frontendUrl}${baseReturnUrl}`
    });
    return billingPortalSession.url;
  },
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn
};
function paymentPlanEffectToStripeCheckoutSessionMode({
  kind
}) {
  switch (kind) {
    case "subscription":
      return "subscription";
    case "credits":
      return "payment";
    default:
      assertUnreachable();
  }
}

const paymentProcessor = stripePaymentProcessor;

const generateCheckoutSessionSchema = z.object({
  paymentPlanId: z.nativeEnum(PaymentPlanId),
  returnUrl: z.string().optional()
});
const generateCheckoutSession$2 = async (args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation"
    );
  }
  const { paymentPlanId, returnUrl } = ensureArgsSchemaOrThrowHttpError(
    generateCheckoutSessionSchema,
    args
  );
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    throw new HttpError(403, "User needs an email to make a payment.");
  }
  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
    returnUrl
  });
  return {
    sessionUrl: session.url,
    sessionId: session.id
  };
};
const getCustomerPortalUrlSchema = z.object({
  returnUrl: z.string().optional()
}).optional();
const getCustomerPortalUrl$2 = async (args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation"
    );
  }
  const validatedArgs = args ? ensureArgsSchemaOrThrowHttpError(
    getCustomerPortalUrlSchema,
    args
  ) : void 0;
  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
    returnUrl: validatedArgs?.returnUrl
  });
};

async function generateCheckoutSession$1(args, context) {
  return generateCheckoutSession$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var generateCheckoutSession = createAction(generateCheckoutSession$1);

function requireAdmin(context) {
  if (!context.user) {
    throw new HttpError(401, "Authentication required");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Admin access required");
  }
}
const getAdminOverviewStats$2 = async (_args, context) => {
  requireAdmin(context);
  const now = /* @__PURE__ */ new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1e3);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const totalUsers = await context.entities.User.count();
  const paidUsers = await context.entities.User.count({
    where: {
      subscriptionStatus: {
        in: ["active", "past_due"]
      }
    }
  });
  const activeSyncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: fiveMinutesAgo },
      completedAt: null
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    },
    take: 10
  });
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const syncsCompletedToday = await context.entities.SyncLog.count({
    where: {
      completedAt: { gte: todayStart },
      status: "SUCCESS"
    }
  });
  const failedSyncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: oneDayAgo },
      status: "FAILED"
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    }
  });
  const uniqueFailedUsers = new Set(failedSyncs.map((log) => log.syncConfig.userId)).size;
  const errorTypes = {};
  failedSyncs.forEach((log) => {
    if (log.errors) {
      try {
        const errors = JSON.parse(log.errors);
        if (Array.isArray(errors) && errors.length > 0) {
          const errorMsg = errors[0].error || "Unknown error";
          const errorType = errorMsg.split(":")[0] || errorMsg;
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
      } catch (e) {
        errorTypes["Parse error"] = (errorTypes["Parse error"] || 0) + 1;
      }
    }
  });
  const needsReauthAirtable = await context.entities.AirtableConnection.count({
    where: { needsReauth: true }
  });
  const needsReauthGoogle = await context.entities.GoogleSheetsConnection.count({
    where: { needsReauth: true }
  });
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1e3);
  const trialExpiringUsers = await context.entities.User.count({
    where: {
      trialEndsAt: {
        lte: threeDaysFromNow,
        gte: now
      },
      subscriptionStatus: null
    }
  });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidUsersThisMonth = await context.entities.User.count({
    where: {
      datePaid: { gte: monthStart },
      subscriptionStatus: "active"
    }
  });
  const usersByPlan = await context.entities.User.groupBy({
    by: ["subscriptionPlan"],
    where: {
      subscriptionStatus: "active"
    },
    _count: true
  });
  const planPrices = {
    starter: 9,
    pro: 19,
    business: 39
  };
  let mrr = 0;
  usersByPlan.forEach((group) => {
    if (group.subscriptionPlan && planPrices[group.subscriptionPlan]) {
      mrr += planPrices[group.subscriptionPlan] * group._count;
    }
  });
  return {
    users: {
      total: totalUsers,
      paid: paidUsers,
      online: 0
      // TODO: Implement activity tracking
    },
    syncs: {
      active: activeSyncs.map((log) => ({
        id: log.id,
        userEmail: log.syncConfig.user.email,
        syncName: log.syncConfig.name,
        startedAt: log.startedAt
      })),
      completedToday: syncsCompletedToday,
      failedCount: failedSyncs.length,
      uniqueFailedUsers
    },
    alerts: {
      failedSyncs: failedSyncs.length,
      needsReauth: needsReauthAirtable + needsReauthGoogle,
      trialExpiringSoon: trialExpiringUsers,
      errorTypes: Object.entries(errorTypes).map(([type, count]) => ({ type, count }))
    },
    revenue: {
      mrr,
      newSubscriptionsThisMonth: paidUsersThisMonth
    }
  };
};
const getRecentActivity$2 = async (_args, context) => {
  requireAdmin(context);
  const recentSyncLogs = await context.entities.SyncLog.findMany({
    take: 20,
    orderBy: { startedAt: "desc" },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    }
  });
  const recentSignups = await context.entities.User.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      subscriptionStatus: true
    }
  });
  const activities = [];
  recentSyncLogs.forEach((log) => {
    activities.push({
      type: log.status === "FAILED" ? "sync_failed" : "sync_completed",
      timestamp: log.startedAt,
      userEmail: log.syncConfig.user.email || "Unknown",
      userId: log.syncConfig.userId,
      description: `${log.syncConfig.name} - ${log.recordsSynced} records`,
      metadata: {
        syncId: log.syncConfig.id,
        status: log.status
      }
    });
  });
  recentSignups.forEach((user) => {
    activities.push({
      type: "user_signup",
      timestamp: user.createdAt,
      userEmail: user.email || "Unknown",
      userId: user.id,
      description: user.subscriptionStatus ? "Signed up (Paid)" : "Signed up (Trial)",
      metadata: {}
    });
  });
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return activities.slice(0, 20);
};
const searchUsers$2 = async (args, context) => {
  requireAdmin(context);
  const query = args.query;
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return [];
  }
  const users = await context.entities.User.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } }
      ]
    },
    take: 10,
    select: {
      id: true,
      email: true,
      username: true,
      subscriptionStatus: true,
      subscriptionPlan: true
    }
  });
  return users;
};
const getOnlineUsers$2 = async (_args, context) => {
  requireAdmin(context);
  return [];
};
const getUserDetail$2 = async (args, context) => {
  requireAdmin(context);
  const { userId } = args;
  const user = await context.entities.User.findUnique({
    where: { id: userId },
    include: {
      airtableConnections: true,
      googleSheetsConnections: true,
      syncConfigs: {
        include: {
          syncLogs: {
            orderBy: { startedAt: "desc" },
            take: 10
          }
        }
      },
      usageStats: {
        orderBy: { month: "desc" },
        take: 3
      }
    }
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return user;
};
const updateUser$2 = async (args, context) => {
  requireAdmin(context);
  const { userId, updates } = args;
  const allowedFields = [
    "email",
    "username",
    "subscriptionStatus",
    "subscriptionPlan",
    "credits",
    "isAdmin",
    "trialEndsAt",
    "emailNotifications",
    "syncFailureAlerts",
    "weeklyDigest"
  ];
  const safeUpdates = {};
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      safeUpdates[key] = updates[key];
    }
  });
  if (updates.isAdmin === false && userId === context.user?.id) {
    throw new HttpError(400, "Cannot remove your own admin access");
  }
  const updatedUser = await context.entities.User.update({
    where: { id: userId },
    data: safeUpdates
  });
  return updatedUser;
};
const deleteUser$2 = async (args, context) => {
  requireAdmin(context);
  const { userId, confirmEmail } = args;
  if (userId === context.user?.id) {
    throw new HttpError(400, "Cannot delete your own account");
  }
  const user = await context.entities.User.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.email !== confirmEmail) {
    throw new HttpError(400, "Email confirmation does not match");
  }
  await context.entities.User.delete({
    where: { id: userId }
  });
  return { success: true };
};
const getActiveSyncs$2 = async (_args, context) => {
  requireAdmin(context);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1e3);
  const syncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: fiveMinutesAgo },
      completedAt: null
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      }
    },
    orderBy: { startedAt: "desc" }
  });
  return syncs;
};
const getFailedSyncs$2 = async (args, context) => {
  requireAdmin(context);
  const hours = args?.hours || 24;
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1e3);
  const syncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: cutoffTime },
      status: "FAILED"
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      }
    },
    orderBy: { startedAt: "desc" }
  });
  return syncs;
};
const getSyncMonitor$2 = async (_args, context) => {
  requireAdmin(context);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
  const [active, recentCompleted, failed] = await Promise.all([
    context.entities.SyncLog.findMany({
      where: {
        completedAt: null
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: "desc" },
      take: 50
    }),
    context.entities.SyncLog.findMany({
      where: {
        completedAt: { gte: oneHourAgo },
        status: "SUCCESS"
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { completedAt: "desc" },
      take: 50
    }),
    context.entities.SyncLog.findMany({
      where: {
        startedAt: { gte: oneDayAgo },
        status: "FAILED"
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: "desc" },
      take: 100
    })
  ]);
  return {
    active,
    recentCompleted,
    failed
  };
};
const pauseResumeSync$2 = async (args, context) => {
  requireAdmin(context);
  const { syncConfigId, isActive } = args;
  const updated = await context.entities.SyncConfig.update({
    where: { id: syncConfigId },
    data: { isActive }
  });
  return updated;
};
const triggerManualSyncAdmin$2 = async (args, context) => {
  requireAdmin(context);
  const { syncConfigId } = args;
  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId }
  });
  if (!syncConfig) {
    throw new HttpError(404, "Sync configuration not found");
  }
  return { success: true, message: "Sync triggered successfully" };
};
const forceRefreshUserToken$2 = async (args, context) => {
  requireAdmin(context);
  const { userId, service } = args;
  if (service === "airtable") {
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId }
    });
    if (!connection) {
      throw new HttpError(404, "Airtable connection not found");
    }
    await context.entities.AirtableConnection.update({
      where: { userId },
      data: { needsReauth: false, lastRefreshAttempt: /* @__PURE__ */ new Date() }
    });
    return { success: true, message: "Airtable token refresh requested" };
  } else if (service === "google") {
    const connection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId }
    });
    if (!connection) {
      throw new HttpError(404, "Google Sheets connection not found");
    }
    await context.entities.GoogleSheetsConnection.update({
      where: { userId },
      data: { needsReauth: false, lastRefreshAttempt: /* @__PURE__ */ new Date() }
    });
    return { success: true, message: "Google token refresh requested" };
  } else {
    throw new HttpError(400, "Invalid service type");
  }
};

async function updateUser$1(args, context) {
  return updateUser$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var updateUser = createAction(updateUser$1);

async function deleteUser$1(args, context) {
  return deleteUser$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      UsageStats: dbClient.usageStats
    }
  });
}

var deleteUser = createAction(deleteUser$1);

async function pauseResumeSync$1(args, context) {
  return pauseResumeSync$2(args, {
    ...context,
    entities: {
      SyncConfig: dbClient.syncConfig
    }
  });
}

var pauseResumeSync = createAction(pauseResumeSync$1);

async function triggerManualSyncAdmin$1(args, context) {
  return triggerManualSyncAdmin$2(args, {
    ...context,
    entities: {
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      User: dbClient.user
    }
  });
}

var triggerManualSyncAdmin = createAction(triggerManualSyncAdmin$1);

async function forceRefreshUserToken$1(args, context) {
  return forceRefreshUserToken$2(args, {
    ...context,
    entities: {
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var forceRefreshUserToken = createAction(forceRefreshUserToken$1);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
function getEncryptionKey() {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error(
      `ENCRYPTION_KEY environment variable is not set. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  if (encryptionKey.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Current length: ${encryptionKey.length}`
    );
  }
  try {
    return Buffer.from(encryptionKey, "hex");
  } catch (error) {
    throw new Error("ENCRYPTION_KEY must be a valid hex string");
  }
}
function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string");
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decrypt(ciphertext) {
  if (!ciphertext) {
    throw new Error("Cannot decrypt empty string");
  }
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format. Expected format: iv:authTag:encryptedData");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

const AIRTABLE_AUTH_URL = "https://airtable.com/oauth2/v1/authorize";
const AIRTABLE_TOKEN_URL = "https://airtable.com/oauth2/v1/token";
const REQUIRED_SCOPES$1 = [
  "data.records:read",
  "data.records:write",
  "schema.bases:read"
];
function getAirtableConfig() {
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;
  const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Airtable OAuth configuration. Please set AIRTABLE_CLIENT_ID, AIRTABLE_CLIENT_SECRET, and AIRTABLE_REDIRECT_URI in your .env.server file."
    );
  }
  return { clientId, clientSecret, redirectUri };
}
function generatePKCEChallenge() {
  const codeVerifier = crypto__default.randomBytes(32).toString("base64url");
  const hash = crypto__default.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = hash.toString("base64url");
  return {
    codeVerifier,
    codeChallenge
  };
}
function generateAuthorizationUrl$1(state, codeChallenge) {
  const config = getAirtableConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: REQUIRED_SCOPES$1.join(" "),
    ...state && { state },
    ...codeChallenge && {
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    }
  });
  return `${AIRTABLE_AUTH_URL}?${params.toString()}`;
}
async function exchangeCodeForTokens$1(code, codeVerifier) {
  const config = getAirtableConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    ...codeVerifier && { code_verifier: codeVerifier }
  });
  const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(AIRTABLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${authHeader}`
    },
    body: params.toString()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to exchange code for tokens: ${response.status} ${response.statusText}. Error: ${JSON.stringify(errorData)}`
    );
  }
  return await response.json();
}
async function refreshAccessToken$1(refreshToken) {
  const config = getAirtableConfig();
  const decryptedRefreshToken = decrypt(refreshToken);
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decryptedRefreshToken
  });
  const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(AIRTABLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${authHeader}`
    },
    body: params.toString()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to refresh access token: ${response.status} ${response.statusText}. Error: ${JSON.stringify(errorData)}`
    );
  }
  return await response.json();
}
async function storeAirtableConnection(userId, tokenResponse, prisma) {
  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null;
  const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1e3);
  const delegate = "airtableConnection" in prisma ? prisma.airtableConnection : prisma;
  await delegate.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry
    },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getAirtableAccessToken(userId, prisma) {
  const delegate = "airtableConnection" in prisma ? prisma.airtableConnection : prisma;
  const connection = await delegate.findUnique({
    where: { userId }
  });
  if (!connection) {
    throw new Error("Airtable connection not found for user. Please connect your Airtable account.");
  }
  const now = /* @__PURE__ */ new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1e3);
  if (connection.tokenExpiry && connection.tokenExpiry <= expiryBuffer) {
    if (!connection.refreshToken) {
      throw new Error("Airtable refresh token not found. Please reconnect your Airtable account.");
    }
    try {
      const newTokens = await refreshAccessToken$1(connection.refreshToken);
      await storeAirtableConnection(userId, newTokens, delegate);
      return newTokens.access_token;
    } catch (error) {
      throw new Error(
        `Failed to refresh Airtable token: ${error instanceof Error ? error.message : "Unknown error"}. Please reconnect your Airtable account.`
      );
    }
  }
  return decrypt(connection.accessToken);
}
function validateScopes$1(grantedScopes) {
  const granted = new Set(grantedScopes.split(" "));
  return REQUIRED_SCOPES$1.every((scope) => granted.has(scope));
}

const pkceStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1e3;
  for (const [userId, data] of pkceStore.entries()) {
    if (now - data.timestamp > tenMinutes) {
      pkceStore.delete(userId);
    }
  }
}, 5 * 60 * 1e3);
const initiateAirtableAuth$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { codeVerifier, codeChallenge } = generatePKCEChallenge();
  pkceStore.set(context.user.id, {
    codeVerifier,
    timestamp: Date.now()
  });
  const state = context.user.id;
  const authUrl = generateAuthorizationUrl$1(state, codeChallenge);
  console.log("=== AIRTABLE OAUTH DEBUG ===");
  console.log("Generated Auth URL:", authUrl);
  console.log("PKCE Challenge:", codeChallenge);
  console.log("===========================");
  return { authUrl };
};
const completeAirtableAuth$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { code, state } = args;
  if (!code) {
    return {
      success: false,
      error: "Missing authorization code"
    };
  }
  if (state && state !== context.user.id) {
    return {
      success: false,
      error: "Invalid state parameter. Please try again."
    };
  }
  try {
    const pkceData = pkceStore.get(context.user.id);
    if (!pkceData) {
      return {
        success: false,
        error: "OAuth session expired. Please try connecting again."
      };
    }
    pkceStore.delete(context.user.id);
    const tokens = await exchangeCodeForTokens$1(code, pkceData.codeVerifier);
    if (!validateScopes$1(tokens.scope)) {
      return {
        success: false,
        error: "Required permissions were not granted. Please authorize all requested scopes."
      };
    }
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1e3);
    await context.entities.AirtableConnection.upsert({
      where: { userId: context.user.id },
      create: {
        userId: context.user.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to complete Airtable OAuth:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("exchange code for tokens")) {
      return {
        success: false,
        error: "Failed to connect to Airtable. The authorization code may have expired. Please try again."
      };
    }
    if (errorMessage.includes("AIRTABLE_CLIENT_ID")) {
      return {
        success: false,
        error: "Airtable integration is not configured. Please contact support."
      };
    }
    return {
      success: false,
      error: "Failed to connect Airtable account. Please try again."
    };
  }
};
const getAirtableConnectionStatus$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId: context.user.id },
      select: {
        accountId: true
      }
    });
    if (!connection) {
      return { isConnected: false };
    }
    return {
      isConnected: true,
      accountId: connection.accountId || void 0
    };
  } catch (error) {
    console.error("Failed to get Airtable connection status:", error);
    return { isConnected: false };
  }
};
const disconnectAirtable$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId: context.user.id }
    });
    if (!connection) {
      return {
        success: false,
        error: "No Airtable connection found"
      };
    }
    await context.entities.AirtableConnection.delete({
      where: { userId: context.user.id }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect Airtable:", error);
    return {
      success: false,
      error: "Failed to disconnect Airtable account. Please try again."
    };
  }
};

async function initiateAirtableAuth$1(args, context) {
  return initiateAirtableAuth$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var initiateAirtableAuth = createAction(initiateAirtableAuth$1);

async function completeAirtableAuth$1(args, context) {
  return completeAirtableAuth$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var completeAirtableAuth = createAction(completeAirtableAuth$1);

async function disconnectAirtable$1(args, context) {
  return disconnectAirtable$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var disconnectAirtable = createAction(disconnectAirtable$1);

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets"
];
function getGoogleConfig() {
  const clientId = process.env.GOOGLE_SHEETS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SHEETS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth configuration. Please set GOOGLE_SHEETS_CLIENT_ID, GOOGLE_SHEETS_CLIENT_SECRET, and GOOGLE_SHEETS_REDIRECT_URI in your .env.server file."
    );
  }
  return { clientId, clientSecret, redirectUri };
}
function generateAuthorizationUrl(state) {
  const config = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: REQUIRED_SCOPES.join(" "),
    access_type: "offline",
    // Required to get refresh token
    prompt: "consent",
    // Force consent screen to ensure refresh token is returned
    ...state && { state }
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
async function exchangeCodeForTokens(code) {
  const config = getGoogleConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to exchange code for tokens: ${response.status} ${response.statusText}. Error: ${JSON.stringify(errorData)}`
    );
  }
  return await response.json();
}
async function refreshAccessToken(refreshToken) {
  const config = getGoogleConfig();
  const decryptedRefreshToken = decrypt(refreshToken);
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decryptedRefreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to refresh access token: ${response.status} ${response.statusText}. Error: ${JSON.stringify(errorData)}`
    );
  }
  return await response.json();
}
async function storeGoogleSheetsConnection(userId, tokenResponse, prisma, googleAccountEmail) {
  const delegate = "googleSheetsConnection" in prisma ? prisma.googleSheetsConnection : prisma;
  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null;
  const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1e3);
  await delegate.findUnique({
    where: { userId }
  });
  await delegate.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry,
      googleAccountEmail
    },
    update: {
      accessToken: encryptedAccessToken,
      // Only update refresh token if a new one was provided
      // Google doesn't always return a new refresh token
      ...encryptedRefreshToken && { refreshToken: encryptedRefreshToken },
      tokenExpiry,
      ...googleAccountEmail && { googleAccountEmail },
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getGoogleSheetsAccessToken(userId, prisma) {
  const delegate = "googleSheetsConnection" in prisma ? prisma.googleSheetsConnection : prisma;
  const connection = await delegate.findUnique({
    where: { userId }
  });
  if (!connection) {
    throw new Error("Google Sheets connection not found for user. Please connect your Google account.");
  }
  const now = /* @__PURE__ */ new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1e3);
  if (connection.tokenExpiry && connection.tokenExpiry <= expiryBuffer) {
    if (!connection.refreshToken) {
      throw new Error("Google refresh token not found. Please reconnect your Google account.");
    }
    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);
      await storeGoogleSheetsConnection(userId, newTokens, delegate, connection.googleAccountEmail || void 0);
      return newTokens.access_token;
    } catch (error) {
      throw new Error(
        `Failed to refresh Google token: ${error instanceof Error ? error.message : "Unknown error"}. Please reconnect your Google account.`
      );
    }
  }
  return decrypt(connection.accessToken);
}
async function getGoogleUserInfo(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch Google user info: ${response.status} ${response.statusText}. Error: ${JSON.stringify(errorData)}`
    );
  }
  return await response.json();
}
function validateScopes(grantedScopes) {
  const granted = new Set(grantedScopes.split(" "));
  return REQUIRED_SCOPES.every((scope) => granted.has(scope));
}

const initiateGoogleAuth$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const state = context.user.id;
  const authUrl = generateAuthorizationUrl(state);
  return { authUrl };
};
const completeGoogleAuth$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { code, state } = args;
  if (!code) {
    return {
      success: false,
      error: "Missing authorization code"
    };
  }
  if (state && state !== context.user.id) {
    return {
      success: false,
      error: "Invalid state parameter. Please try again."
    };
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!validateScopes(tokens.scope)) {
      return {
        success: false,
        error: "Required permissions were not granted. Please authorize all requested scopes."
      };
    }
    let googleAccountEmail;
    try {
      const userInfo = await getGoogleUserInfo(tokens.access_token);
      googleAccountEmail = userInfo.email;
    } catch (error) {
      console.warn("Failed to fetch Google user info:", error);
    }
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1e3);
    const existingConnection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId: context.user.id }
    });
    await context.entities.GoogleSheetsConnection.upsert({
      where: { userId: context.user.id },
      create: {
        userId: context.user.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        googleAccountEmail
      },
      update: {
        accessToken: encryptedAccessToken,
        // Only update refresh token if a new one was provided
        // Google doesn't always return a new refresh token
        ...encryptedRefreshToken && { refreshToken: encryptedRefreshToken },
        tokenExpiry,
        ...googleAccountEmail && { googleAccountEmail },
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to complete Google OAuth:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("exchange code for tokens")) {
      return {
        success: false,
        error: "Failed to connect to Google. The authorization code may have expired. Please try again."
      };
    }
    if (errorMessage.includes("GOOGLE_SHEETS_CLIENT_ID")) {
      return {
        success: false,
        error: "Google Sheets integration is not configured. Please contact support."
      };
    }
    return {
      success: false,
      error: "Failed to connect Google account. Please try again."
    };
  }
};
const getGoogleConnectionStatus$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const connection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId: context.user.id },
      select: {
        googleAccountEmail: true
      }
    });
    if (!connection) {
      return { isConnected: false };
    }
    return {
      isConnected: true,
      googleAccountEmail: connection.googleAccountEmail || void 0
    };
  } catch (error) {
    console.error("Failed to get Google Sheets connection status:", error);
    return { isConnected: false };
  }
};
const disconnectGoogle$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const connection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId: context.user.id }
    });
    if (!connection) {
      return {
        success: false,
        error: "No Google Sheets connection found"
      };
    }
    await context.entities.GoogleSheetsConnection.delete({
      where: { userId: context.user.id }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect Google Sheets:", error);
    return {
      success: false,
      error: "Failed to disconnect Google account. Please try again."
    };
  }
};

async function initiateGoogleAuth$1(args, context) {
  return initiateGoogleAuth$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var initiateGoogleAuth = createAction(initiateGoogleAuth$1);

async function completeGoogleAuth$1(args, context) {
  return completeGoogleAuth$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var completeGoogleAuth = createAction(completeGoogleAuth$1);

async function disconnectGoogle$1(args, context) {
  return disconnectGoogle$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var disconnectGoogle = createAction(disconnectGoogle$1);

class RateLimiter {
  queue = [];
  processing = false;
  requestsPerSecond;
  minDelayMs;
  lastRequestTime = 0;
  constructor(requestsPerSecond = 5) {
    this.requestsPerSecond = requestsPerSecond;
    this.minDelayMs = 1e3 / requestsPerSecond;
  }
  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayMs) {
        await this.sleep(this.minDelayMs - timeSinceLastRequest);
      }
      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }
    this.processing = false;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
const rateLimiter = new RateLimiter(5);
class AirtableError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.name = "AirtableError";
  }
}
async function handleAirtableResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `Airtable API error: ${response.status} ${response.statusText}`;
    throw new AirtableError(errorMessage, response.status, errorData);
  }
  return await response.json();
}
async function fetchWithRetry$1(fn, maxRetries = 3, baseDelay = 1e3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof AirtableError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }
      if (attempt === maxRetries) {
        break;
      }
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1e3;
      console.warn(
        `Airtable API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const AIRTABLE_META_API_BASE = "https://api.airtable.com/v0/meta";
async function listBases(accessToken) {
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const response = await fetch(`${AIRTABLE_META_API_BASE}/bases`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await handleAirtableResponse(response);
      let allBases = data.bases;
      let offset = data.offset;
      while (offset) {
        const nextResponse = await fetch(
          `${AIRTABLE_META_API_BASE}/bases?offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          }
        );
        const nextData = await handleAirtableResponse(nextResponse);
        allBases = allBases.concat(nextData.bases);
        offset = nextData.offset;
      }
      return allBases;
    });
  });
}
async function getBaseSchema(accessToken, baseId) {
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const response = await fetch(
        `${AIRTABLE_META_API_BASE}/bases/${baseId}/tables`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      return handleAirtableResponse(response);
    });
  });
}
async function listRecords(accessToken, baseId, tableId, options = {}) {
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const params = new URLSearchParams();
      if (options.fields) {
        options.fields.forEach((field) => params.append("fields[]", field));
      }
      if (options.filterByFormula) {
        params.append("filterByFormula", options.filterByFormula);
      }
      if (options.maxRecords) {
        params.append("maxRecords", options.maxRecords.toString());
      }
      if (options.pageSize) {
        params.append("pageSize", Math.min(options.pageSize, 100).toString());
      }
      if (options.sort) {
        options.sort.forEach((sort, index) => {
          params.append(`sort[${index}][field]`, sort.field);
          params.append(`sort[${index}][direction]`, sort.direction);
        });
      }
      if (options.view) {
        params.append("view", options.view);
      }
      if (options.cellFormat) {
        params.append("cellFormat", options.cellFormat);
      }
      if (options.timeZone) {
        params.append("timeZone", options.timeZone);
      }
      if (options.userLocale) {
        params.append("userLocale", options.userLocale);
      }
      if (options.offset) {
        params.append("offset", options.offset);
      }
      const url = `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await handleAirtableResponse(response);
      let allRecords = data.records;
      let offset = data.offset;
      while (offset && (!options.maxRecords || allRecords.length < options.maxRecords)) {
        const nextOptions = { ...options, offset };
        const nextRecords = await listRecords(accessToken, baseId, tableId, nextOptions);
        allRecords = allRecords.concat(nextRecords);
        if (options.maxRecords && allRecords.length >= options.maxRecords) {
          allRecords = allRecords.slice(0, options.maxRecords);
          break;
        }
        offset = void 0;
      }
      return allRecords;
    });
  });
}
async function createRecords(accessToken, baseId, tableId, records) {
  if (records.length === 0) {
    return [];
  }
  if (records.length > 10) {
    throw new AirtableError(
      "Cannot create more than 10 records at once. Please batch your requests."
    );
  }
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ records })
      });
      const data = await handleAirtableResponse(response);
      return data.records;
    });
  });
}
async function updateRecords(accessToken, baseId, tableId, records) {
  if (records.length === 0) {
    return [];
  }
  if (records.length > 10) {
    throw new AirtableError(
      "Cannot update more than 10 records at once. Please batch your requests."
    );
  }
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ records })
      });
      const data = await handleAirtableResponse(response);
      return data.records;
    });
  });
}
async function deleteRecords(accessToken, baseId, tableId, recordIds) {
  if (recordIds.length === 0) {
    return [];
  }
  if (recordIds.length > 10) {
    throw new AirtableError(
      "Cannot delete more than 10 records at once. Please batch your requests."
    );
  }
  return rateLimiter.execute(async () => {
    return fetchWithRetry$1(async () => {
      const params = new URLSearchParams();
      recordIds.forEach((id) => params.append("records[]", id));
      const response = await fetch(
        `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await handleAirtableResponse(response);
      return data.records.map((record) => record.id);
    });
  });
}
function batchOperations(items, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

class GoogleSheetsError extends Error {
  constructor(message, statusCode, response, isQuotaError = false, isAuthError = false) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.isQuotaError = isQuotaError;
    this.isAuthError = isAuthError;
    this.name = "GoogleSheetsError";
  }
}
async function handleGoogleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = errorData?.error;
    const errorMessage = error?.message || `Google API error: ${response.status} ${response.statusText}`;
    const errorCode = error?.code || response.status;
    const isQuotaError = errorCode === 429 || error?.status === "RESOURCE_EXHAUSTED" || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("rate limit");
    const isAuthError = errorCode === 401 || errorCode === 403 || error?.status === "UNAUTHENTICATED" || error?.status === "PERMISSION_DENIED";
    throw new GoogleSheetsError(errorMessage, errorCode, errorData, isQuotaError, isAuthError);
  }
  return await response.json();
}
async function fetchWithRetry(fn, maxRetries = 3, baseDelay = 1e3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof GoogleSheetsError && error.isAuthError) {
        throw error;
      }
      if (error instanceof GoogleSheetsError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && !error.isQuotaError) {
        throw error;
      }
      if (attempt === maxRetries) {
        break;
      }
      const delayMultiplier = error instanceof GoogleSheetsError && error.isQuotaError ? 3 : 1;
      const delay = baseDelay * Math.pow(2, attempt) * delayMultiplier + Math.random() * 1e3;
      console.warn(
        `Google Sheets API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
const SHEETS_API_BASE = "https://sheets.googleapis.com/v4";
async function getSpreadsheet(accessToken, spreadsheetId) {
  return fetchWithRetry(async () => {
    const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    return handleGoogleResponse(response);
  });
}
async function validateAndGetSpreadsheet(accessToken, spreadsheetId) {
  return fetchWithRetry(async () => {
    try {
      const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = errorData?.error;
        const statusCode = error?.code || response.status;
        if (statusCode === 404) {
          throw new GoogleSheetsError(
            "Spreadsheet not found. Please check the URL and make sure the spreadsheet exists and is shared with your Google account.",
            404,
            errorData,
            false,
            false
          );
        }
        if (statusCode === 403) {
          const errorMessage = error?.message || "";
          if (errorMessage.toLowerCase().includes("permission") || errorMessage.toLowerCase().includes("access") || error?.status === "PERMISSION_DENIED") {
            throw new GoogleSheetsError(
              "You don't have access to this spreadsheet. Make sure it's shared with your Google account, or that the link sharing settings allow access.",
              403,
              errorData,
              false,
              true
            );
          }
          if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("rate limit") || error?.status === "RESOURCE_EXHAUSTED") {
            throw new GoogleSheetsError(
              "Google API quota exceeded. Please try again in a few moments.",
              403,
              errorData,
              true,
              false
            );
          }
          throw new GoogleSheetsError(
            "Access forbidden. Please check your permissions for this spreadsheet.",
            403,
            errorData,
            false,
            true
          );
        }
        if (statusCode === 401) {
          throw new GoogleSheetsError(
            "Authentication failed. Please reconnect your Google account.",
            401,
            errorData,
            false,
            true
          );
        }
        if (statusCode === 400) {
          throw new GoogleSheetsError(
            "Invalid spreadsheet ID format. Please check the URL and try again.",
            400,
            errorData,
            false,
            false
          );
        }
        throw new GoogleSheetsError(
          error?.message || `Google Sheets API error: ${response.status} ${response.statusText}`,
          statusCode,
          errorData,
          false,
          false
        );
      }
      const metadata = await response.json();
      return {
        id: metadata.spreadsheetId,
        title: metadata.properties.title,
        sheets: metadata.sheets.map((sheet) => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title
        }))
      };
    } catch (error) {
      if (error instanceof GoogleSheetsError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GoogleSheetsError(
          `Failed to validate spreadsheet: ${error.message}`,
          void 0,
          void 0,
          false,
          false
        );
      }
      throw new GoogleSheetsError(
        "Failed to validate spreadsheet. Please try again.",
        void 0,
        void 0,
        false,
        false
      );
    }
  });
}
async function getSheetData(accessToken, spreadsheetId, sheetId, range) {
  return fetchWithRetry(async () => {
    let sheetName;
    if (typeof sheetId === "number") {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }
    const rangeString = range ? `${sheetName}!${range}` : sheetName;
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeString)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    return handleGoogleResponse(response);
  });
}
async function updateSheetData(accessToken, spreadsheetId, sheetId, range, values) {
  return fetchWithRetry(async () => {
    let sheetName;
    if (typeof sheetId === "number") {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }
    const rangeString = `${sheetName}!${range}`;
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        rangeString
      )}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: rangeString,
          majorDimension: "ROWS",
          values
        })
      }
    );
    return handleGoogleResponse(response);
  });
}
async function appendRows(accessToken, spreadsheetId, sheetId, values) {
  return fetchWithRetry(async () => {
    let sheetName;
    if (typeof sheetId === "number") {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetName
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: sheetName,
          majorDimension: "ROWS",
          values
        })
      }
    );
    const data = await handleGoogleResponse(response);
    return data.updates;
  });
}
function columnNumberToLetter(column) {
  let result = "";
  while (column > 0) {
    const remainder = (column - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    column = Math.floor((column - 1) / 26);
  }
  return result;
}
async function ensureColumnsExist(accessToken, spreadsheetId, sheetId, requiredColumnCount) {
  return fetchWithRetry(async () => {
    let numericSheetId;
    let currentColumnCount;
    const metadata = await getSpreadsheet(accessToken, spreadsheetId);
    if (typeof sheetId === "number") {
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
      }
      numericSheetId = sheetId;
      currentColumnCount = sheet.properties.gridProperties?.columnCount || 0;
    } else {
      const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
      }
      numericSheetId = sheet.properties.sheetId;
      currentColumnCount = sheet.properties.gridProperties?.columnCount || 0;
    }
    if (currentColumnCount >= requiredColumnCount) {
      return;
    }
    const columnsToAdd = requiredColumnCount - currentColumnCount;
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              appendDimension: {
                sheetId: numericSheetId,
                dimension: "COLUMNS",
                length: columnsToAdd
              }
            }
          ]
        })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new GoogleSheetsError(`Failed to add columns: ${error}`);
    }
  });
}
async function hideColumn(accessToken, spreadsheetId, sheetId, columnIndex) {
  return fetchWithRetry(async () => {
    let numericSheetId;
    if (typeof sheetId === "number") {
      numericSheetId = sheetId;
    } else {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
      }
      numericSheetId = sheet.properties.sheetId;
    }
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              updateDimensionProperties: {
                range: {
                  sheetId: numericSheetId,
                  dimension: "COLUMNS",
                  startIndex: columnIndex,
                  endIndex: columnIndex + 1
                },
                properties: {
                  hiddenByUser: true
                },
                fields: "hiddenByUser"
              }
            }
          ]
        })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new GoogleSheetsError(`Failed to hide column: ${error}`);
    }
  });
}
async function batchSetDropdownValidations(accessToken, spreadsheetId, sheetId, validations) {
  if (validations.length === 0) return;
  return fetchWithRetry(async () => {
    let numericSheetId;
    let rowCount = 1e3;
    const metadata = await getSpreadsheet(accessToken, spreadsheetId);
    if (typeof sheetId === "number") {
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
      }
      numericSheetId = sheetId;
      rowCount = sheet.properties.gridProperties?.rowCount || 1e3;
    } else {
      const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
      }
      numericSheetId = sheet.properties.sheetId;
      rowCount = sheet.properties.gridProperties?.rowCount || 1e3;
    }
    const requests = validations.map((validation) => {
      const {
        columnIndex,
        choices,
        startRow = 2,
        endRow = rowCount,
        showDropdown = true,
        strict = true
      } = validation;
      const columnLetter = columnNumberToLetter(columnIndex + 1);
      console.log(
        `[GoogleSheets] Setting validation for column ${columnLetter} (index ${columnIndex}): ${choices.length} choices, ${strict ? "strict" : "lenient"}`
      );
      return {
        setDataValidation: {
          range: {
            sheetId: numericSheetId,
            startRowIndex: startRow - 1,
            endRowIndex: endRow,
            startColumnIndex: columnIndex,
            endColumnIndex: columnIndex + 1
          },
          rule: {
            condition: {
              type: "ONE_OF_LIST",
              values: choices.map((choice) => ({ userEnteredValue: choice }))
            },
            showCustomUi: showDropdown,
            strict
          }
        }
      };
    });
    console.log(`[GoogleSheets] Sending ${requests.length} validation request(s) to Sheets API...`);
    console.log(`[GoogleSheets] Sheet ID: ${numericSheetId}, Row count: ${rowCount}`);
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GoogleSheets] API Error Response:`, errorText);
      throw new GoogleSheetsError(`Failed to batch set dropdown validations: ${errorText}`);
    }
    const result = await response.json();
    console.log(`[GoogleSheets] \u2713 Validation API call successful:`, result);
  });
}

async function airtableToSheets(value, fieldType, context) {
  const result = { value: null, errors: [], warnings: [] };
  try {
    if (value === null || value === void 0) {
      result.value = "";
      return result;
    }
    switch (fieldType) {
      // Text fields → string
      case "singleLineText":
      case "multilineText":
      case "richText":
      case "email":
      case "emailAddress":
      // Alternative email field type
      case "url":
      case "phoneNumber":
      case "phone":
        result.value = String(value);
        break;
      // Number fields → number
      case "number":
      case "currency":
      case "percent":
      case "duration":
      case "rating":
      case "autoNumber":
        result.value = typeof value === "number" ? value : Number(value) || 0;
        break;
      // Checkbox → "TRUE"/"FALSE"
      case "checkbox":
        result.value = value ? "TRUE" : "FALSE";
        break;
      // Date fields → ISO string or formatted date
      case "date":
      case "dateTime":
      case "createdTime":
      case "lastModifiedTime":
        if (value instanceof Date) {
          result.value = value.toISOString();
        } else if (typeof value === "string") {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            result.value = date.toISOString();
          } else {
            result.errors?.push(`Invalid date format: ${value}`);
            result.value = String(value);
          }
        } else {
          result.errors?.push(`Unexpected date value type: ${typeof value}`);
          result.value = String(value);
        }
        break;
      // Single select → string
      case "singleSelect":
        result.value = String(value);
        break;
      // Multiple selects → comma-separated string
      case "multipleSelects":
        if (Array.isArray(value)) {
          result.value = value.join(", ");
        } else {
          result.errors?.push(`Expected array for multipleSelects, got ${typeof value}`);
          result.value = String(value);
        }
        break;
      // Linked records → comma-separated names (NOT IDs)
      case "multipleRecordLinks":
        if (Array.isArray(value)) {
          if (context?.accessToken && context?.baseId && context?.airtableField?.options?.linkedTableId) {
            try {
              const names = await fetchLinkedRecordNames(
                value,
                context.accessToken,
                context.baseId,
                context.airtableField.options.linkedTableId
              );
              result.value = names.join(", ");
            } catch (error) {
              result.warnings?.push(
                `Failed to fetch linked record names: ${error instanceof Error ? error.message : String(error)}`
              );
              result.value = value.map((record) => record.id).join(", ");
            }
          } else {
            result.value = value.map((record) => record.id).join(", ");
            result.warnings?.push(
              "Linked records exported as IDs (no context provided for name lookup)"
            );
          }
        } else {
          result.errors?.push(`Expected array for multipleRecordLinks, got ${typeof value}`);
          result.value = String(value);
        }
        break;
      // Attachments → comma-separated URLs
      case "multipleAttachments":
        if (Array.isArray(value)) {
          const attachments = value;
          result.value = attachments.map((att) => att.url).join(", ");
        } else {
          result.errors?.push(`Expected array for multipleAttachments, got ${typeof value}`);
          result.value = String(value);
        }
        break;
      // Collaborators → comma-separated names or emails
      case "singleCollaborator":
        if (value && typeof value === "object" && "email" in value) {
          const collab = value;
          result.value = collab.name || collab.email;
        } else {
          result.value = String(value);
        }
        break;
      case "multipleCollaborators":
        if (Array.isArray(value)) {
          const collabs = value;
          result.value = collabs.map((c) => c.name || c.email).join(", ");
        } else {
          result.errors?.push(`Expected array for multipleCollaborators, got ${typeof value}`);
          result.value = String(value);
        }
        break;
      // Computed fields → appropriate type
      case "formula":
      case "rollup":
      case "count":
      case "multipleLookupValues":
        if (Array.isArray(value)) {
          result.value = value.join(", ");
        } else if (typeof value === "boolean") {
          result.value = value ? "TRUE" : "FALSE";
        } else if (value instanceof Date) {
          result.value = value.toISOString();
        } else {
          result.value = value;
        }
        break;
      // Barcode → string representation
      case "barcode":
        if (value && typeof value === "object" && "text" in value) {
          result.value = value.text;
        } else {
          result.value = String(value);
        }
        break;
      // Button and createdBy → string
      case "button":
      case "createdBy":
      case "lastModifiedBy":
        result.value = String(value);
        break;
      default:
        result.warnings?.push(`Unknown field type: ${fieldType}, converting to string`);
        result.value = String(value);
    }
  } catch (error) {
    result.errors?.push(
      `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    );
    result.value = String(value);
  }
  return result;
}
async function fetchLinkedRecordNames(linkedRecords, accessToken, baseId, linkedTableId) {
  if (linkedRecords.length === 0) return [];
  const recordIds = linkedRecords.map((r) => r.id);
  const formula = `OR(${recordIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const records = await listRecords(accessToken, baseId, linkedTableId, {
    filterByFormula: formula,
    maxRecords: recordIds.length
  });
  return linkedRecords.map((linkedRecord) => {
    const record = records.find((r) => r.id === linkedRecord.id);
    if (!record) return linkedRecord.id;
    const firstFieldValue = Object.values(record.fields)[0];
    return firstFieldValue ? String(firstFieldValue) : linkedRecord.id;
  });
}
async function sheetsToAirtable(value, targetFieldType, context) {
  const result = { value: null, errors: [], warnings: [] };
  try {
    if (value === null || value === void 0 || value === "") {
      result.value = null;
      return result;
    }
    const stringValue = String(value).trim();
    switch (targetFieldType) {
      // Text fields
      case "singleLineText":
      case "multilineText":
      case "richText":
      case "email":
      case "emailAddress":
      // Alternative email field type
      case "url":
      case "phoneNumber":
      case "phone":
        result.value = stringValue;
        break;
      // Number fields
      case "number":
      case "currency":
      case "percent":
      case "duration":
      case "rating":
        const num = Number(stringValue);
        if (isNaN(num)) {
          result.errors?.push(`Cannot convert "${stringValue}" to number`);
          result.value = null;
        } else {
          result.value = num;
        }
        break;
      // Checkbox
      case "checkbox":
        const upperValue = stringValue.toUpperCase();
        if (upperValue === "TRUE" || upperValue === "1" || upperValue === "YES") {
          result.value = true;
        } else if (upperValue === "FALSE" || upperValue === "0" || upperValue === "NO") {
          result.value = false;
        } else {
          result.errors?.push(`Cannot convert "${stringValue}" to checkbox (use TRUE/FALSE)`);
          result.value = null;
        }
        break;
      // Date fields
      case "date":
      case "dateTime":
        const date = parseDate(stringValue);
        if (date) {
          result.value = date.toISOString();
        } else {
          result.errors?.push(`Cannot parse "${stringValue}" as date`);
          result.value = null;
        }
        break;
      // Single select
      case "singleSelect":
        if (context?.airtableField?.options?.choices) {
          const choices = context.airtableField.options.choices;
          const matchingChoice = choices.find(
            (c) => c.name.toLowerCase() === stringValue.toLowerCase()
          );
          if (matchingChoice) {
            result.value = matchingChoice.name;
          } else {
            const fieldName = context.airtableField?.name || "this field";
            result.errors?.push(
              `Value "${stringValue}" is not a valid choice for ${fieldName}. Available options: ${choices.map((c) => c.name).join(", ")}. Check your field mappings - this column may be mapped to the wrong Airtable field.`
            );
            result.value = null;
          }
        } else {
          result.value = stringValue;
        }
        break;
      // Multiple selects
      case "multipleSelects":
        const values = stringValue.split(",").map((v) => v.trim()).filter((v) => v);
        if (context?.airtableField?.options?.choices) {
          const choices = context.airtableField.options.choices;
          const validValues = [];
          const invalidValues = [];
          values.forEach((val) => {
            const matchingChoice = choices.find(
              (c) => c.name.toLowerCase() === val.toLowerCase()
            );
            if (matchingChoice) {
              validValues.push(matchingChoice.name);
            } else {
              invalidValues.push(val);
            }
          });
          if (invalidValues.length > 0) {
            result.warnings?.push(
              `Some values are not valid choices: ${invalidValues.join(", ")}. Available: ${choices.map((c) => c.name).join(", ")}`
            );
          }
          result.value = validValues.length > 0 ? validValues : null;
        } else {
          result.value = values.length > 0 ? values : null;
        }
        break;
      // Linked records
      case "multipleRecordLinks":
        if (context?.accessToken && context?.baseId && context?.airtableField?.options?.linkedTableId) {
          try {
            const names = stringValue.split(",").map((v) => v.trim()).filter((v) => v);
            const recordIds = await fetchRecordIdsByNames(
              names,
              context.accessToken,
              context.baseId,
              context.airtableField.options.linkedTableId
            );
            result.value = recordIds.map((id) => ({ id }));
            if (recordIds.length < names.length) {
              result.warnings?.push(
                `Some linked records could not be found: ${names.length - recordIds.length} missing`
              );
            }
          } catch (error) {
            result.errors?.push(
              `Failed to lookup linked records: ${error instanceof Error ? error.message : String(error)}`
            );
            result.value = null;
          }
        } else {
          result.errors?.push(
            "Cannot convert to linked records without context (accessToken, baseId, linkedTableId required)"
          );
          result.value = null;
        }
        break;
      // Read-only fields
      case "autoNumber":
      case "createdTime":
      case "lastModifiedTime":
      case "createdBy":
      case "lastModifiedBy":
      case "formula":
      case "rollup":
      case "count":
      case "multipleLookupValues":
      case "button":
        result.warnings?.push(`Field type "${targetFieldType}" is read-only, skipping value`);
        result.value = null;
        break;
      // Unsupported write fields (treat as warnings, not errors)
      case "multipleAttachments":
        result.warnings?.push("Attachment upload from Sheets is not supported - field will be skipped");
        result.value = null;
        break;
      case "singleCollaborator":
      case "multipleCollaborators":
        result.warnings?.push("Collaborator assignment from Sheets is not supported - field will be skipped");
        result.value = null;
        break;
      case "barcode":
        result.warnings?.push("Barcode field type is not supported - field will be skipped");
        result.value = null;
        break;
      default:
        result.warnings?.push(`Unknown field type: ${targetFieldType}, treating as text`);
        result.value = stringValue;
    }
  } catch (error) {
    result.errors?.push(
      `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    );
    result.value = null;
  }
  return result;
}
function parseDate(value) {
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  const formats = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  ];
  for (const format of formats) {
    const match = value.match(format);
    if (match) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return null;
}
async function fetchRecordIdsByNames(names, accessToken, baseId, tableId) {
  if (names.length === 0) return [];
  const records = await listRecords(accessToken, baseId, tableId);
  const recordIds = [];
  names.forEach((name) => {
    const record = records.find((r) => {
      const firstFieldValue = Object.values(r.fields)[0];
      return String(firstFieldValue).toLowerCase() === name.toLowerCase();
    });
    if (record) {
      recordIds.push(record.id);
    }
  });
  return recordIds;
}
async function airtableRecordToSheetsRow(record, fields, context) {
  const row = [];
  const errors = [];
  const warnings = [];
  for (const field of fields) {
    const value = record.fields[field.name];
    const conversionContext = { ...context, airtableField: field };
    const result = await airtableToSheets(value, field.type, conversionContext);
    row.push(result.value);
    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(", ")}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(", ")}`);
    }
  }
  return { row, errors, warnings };
}
async function sheetsRowToAirtableFields(row, fields, context) {
  const recordFields = {};
  const errors = [];
  const warnings = [];
  for (let i = 0; i < fields.length && i < row.length; i++) {
    const field = fields[i];
    const value = row[i];
    const conversionContext = { ...context, airtableField: field };
    const result = await sheetsToAirtable(value, field.type, conversionContext);
    if (result.value !== null && result.value !== void 0) {
      recordFields[field.name] = result.value;
    }
    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(", ")}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(", ")}`);
    }
  }
  return { fields: recordFields, errors, warnings };
}
async function sheetsRowToAirtableFieldsWithMapping(row, fields, fieldMappings, idColumnIndex, context) {
  const recordFields = {};
  const errors = [];
  const warnings = [];
  for (const field of fields) {
    const columnIndex = fieldMappings[field.id];
    if (columnIndex === void 0) {
      continue;
    }
    const value = row[columnIndex];
    const conversionContext = { ...context, airtableField: field };
    const result = await sheetsToAirtable(value, field.type, conversionContext);
    if (result.value !== null && result.value !== void 0) {
      recordFields[field.name] = result.value;
    }
    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(", ")}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(", ")}`);
    }
  }
  return { fields: recordFields, errors, warnings };
}
function isReadOnlyField(fieldType) {
  const readOnlyTypes = [
    "autoNumber",
    "createdTime",
    "lastModifiedTime",
    "createdBy",
    "lastModifiedBy",
    "formula",
    "rollup",
    "count",
    "multipleLookupValues",
    "button"
  ];
  return readOnlyTypes.includes(fieldType);
}

class LinkedRecordCacheManager {
  cache = /* @__PURE__ */ new Map();
  defaultTTL = 5 * 60 * 1e3;
  // 5 minutes
  /**
   * Generates a cache key for a specific table
   */
  getCacheKey(baseId, tableId) {
    return `${baseId}:${tableId}`;
  }
  /**
   * Gets cache for a table, returns undefined if expired
   */
  getCache(baseId, tableId, ttl) {
    const key = this.getCacheKey(baseId, tableId);
    const cached = this.cache.get(key);
    if (!cached) return void 0;
    const maxAge = ttl ?? this.defaultTTL;
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return void 0;
    }
    return cached;
  }
  /**
   * Sets cache for a table
   */
  setCache(baseId, tableId, cache) {
    const key = this.getCacheKey(baseId, tableId);
    this.cache.set(key, cache);
  }
  /**
   * Updates existing cache with new records
   */
  updateCache(baseId, tableId, records) {
    const key = this.getCacheKey(baseId, tableId);
    const existing = this.cache.get(key);
    if (existing) {
      records.forEach((record) => {
        existing.idToName.set(record.id, record.name);
        existing.nameToId.set(record.name.toLowerCase(), record.id);
      });
      existing.timestamp = Date.now();
    } else {
      const newCache = {
        idToName: new Map(records.map((r) => [r.id, r.name])),
        nameToId: new Map(records.map((r) => [r.name.toLowerCase(), r.id])),
        timestamp: Date.now()
      };
      this.cache.set(key, newCache);
    }
  }
  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Clears cache for a specific table
   */
  clearTable(baseId, tableId) {
    const key = this.getCacheKey(baseId, tableId);
    this.cache.delete(key);
  }
  /**
   * Clears expired cache entries
   */
  clearExpired(ttl) {
    const maxAge = ttl ?? this.defaultTTL;
    const now = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (now - cache.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Gets cache statistics
   */
  getStats() {
    const tables = Array.from(this.cache.entries()).map(([key, cache]) => ({
      key,
      recordCount: cache.idToName.size,
      age: Date.now() - cache.timestamp
    }));
    return {
      totalEntries: this.cache.size,
      tables
    };
  }
}
const cacheManager = new LinkedRecordCacheManager();
async function resolveLinkedRecordNames(accessToken, baseId, tableId, recordIds, options = {}) {
  const { cacheTTL, strictMode = true } = options;
  const result = {
    resolved: [],
    missing: [],
    created: [],
    warnings: []
  };
  if (recordIds.length === 0) {
    return result;
  }
  let cache = cacheManager.getCache(baseId, tableId, cacheTTL);
  if (cache) {
    const uncachedIds = [];
    for (const recordId of recordIds) {
      const name = cache.idToName.get(recordId);
      if (name) {
        result.resolved.push(name);
      } else {
        uncachedIds.push(recordId);
      }
    }
    if (uncachedIds.length === 0) {
      return result;
    }
    recordIds.splice(0, recordIds.length, ...uncachedIds);
  }
  try {
    const formula = `OR(${recordIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const records = await listRecords(accessToken, baseId, tableId, {
      filterByFormula: formula,
      maxRecords: recordIds.length
    });
    const schema = await getBaseSchema(accessToken, baseId);
    const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found in base schema`);
    }
    const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
    if (!primaryField) {
      result.warnings.push("Could not identify primary field, using first field value");
    }
    const cacheUpdates = [];
    for (const recordId of recordIds) {
      const record = records.find((r) => r.id === recordId);
      if (record) {
        const primaryValue = primaryField ? record.fields[primaryField.name] : Object.values(record.fields)[0];
        const name = primaryValue ? String(primaryValue) : recordId;
        result.resolved.push(name);
        cacheUpdates.push({ id: recordId, name });
      } else {
        result.missing.push(recordId);
        if (strictMode) {
          result.warnings.push(`Record ID ${recordId} not found in table ${tableId}`);
        }
      }
    }
    if (cacheUpdates.length > 0) {
      cacheManager.updateCache(baseId, tableId, cacheUpdates);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.warnings.push(`Failed to fetch linked records: ${errorMessage}`);
    if (!strictMode) {
      result.resolved.push(...recordIds);
    } else {
      result.missing.push(...recordIds);
    }
  }
  return result;
}
async function resolveNamesToRecordIds(accessToken, baseId, tableId, names, options = {}) {
  const { cacheTTL, createMissing = false, strictMode = true } = options;
  const result = {
    resolved: [],
    missing: [],
    created: [],
    warnings: []
  };
  if (names.length === 0) {
    return result;
  }
  const normalizedNames = [...new Set(names.map((n) => n.trim()))].filter((n) => n);
  if (normalizedNames.length === 0) {
    return result;
  }
  let cache = cacheManager.getCache(baseId, tableId, cacheTTL);
  if (cache) {
    const uncachedNames = [];
    for (const name of normalizedNames) {
      const recordId = cache.nameToId.get(name.toLowerCase());
      if (recordId) {
        result.resolved.push(recordId);
      } else {
        uncachedNames.push(name);
      }
    }
    if (uncachedNames.length === 0) {
      return result;
    }
    normalizedNames.splice(0, normalizedNames.length, ...uncachedNames);
  }
  try {
    const schema = await getBaseSchema(accessToken, baseId);
    const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found in base schema`);
    }
    const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
    if (!primaryField) {
      throw new Error("Could not identify primary field for linked table");
    }
    const records = await listRecords(accessToken, baseId, tableId);
    const nameLookup = /* @__PURE__ */ new Map();
    const cacheUpdates = [];
    for (const record of records) {
      const primaryValue = record.fields[primaryField.name];
      if (primaryValue) {
        const name = String(primaryValue);
        nameLookup.set(name.toLowerCase(), record.id);
        cacheUpdates.push({ id: record.id, name });
      }
    }
    if (cacheUpdates.length > 0) {
      cacheManager.updateCache(baseId, tableId, cacheUpdates);
    }
    const missingNames = [];
    for (const name of normalizedNames) {
      const recordId = nameLookup.get(name.toLowerCase());
      if (recordId) {
        result.resolved.push(recordId);
      } else {
        missingNames.push(name);
      }
    }
    if (missingNames.length > 0) {
      if (createMissing) {
        try {
          const newRecords = await createNewLinkedRecords(
            accessToken,
            baseId,
            tableId,
            primaryField.name,
            missingNames
          );
          result.resolved.push(...newRecords.map((r) => r.id));
          result.created.push(...newRecords.map((r) => r.id));
          result.warnings.push(
            `Created ${newRecords.length} new records: ${missingNames.join(", ")}`
          );
          const newCacheUpdates = newRecords.map((r, i) => ({
            id: r.id,
            name: missingNames[i]
          }));
          cacheManager.updateCache(baseId, tableId, newCacheUpdates);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.warnings.push(`Failed to create new records: ${errorMessage}`);
          result.missing.push(...missingNames);
        }
      } else {
        result.missing.push(...missingNames);
        if (strictMode) {
          result.warnings.push(
            `The following names were not found in linked table: ${missingNames.join(", ")}`
          );
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.warnings.push(`Failed to resolve names to record IDs: ${errorMessage}`);
    result.missing.push(...normalizedNames);
  }
  return result;
}
async function createNewLinkedRecords(accessToken, baseId, tableId, primaryFieldName, names) {
  const batchSize = 10;
  const allCreatedRecords = [];
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    const recordData = batch.map((name) => ({
      fields: { [primaryFieldName]: name }
    }));
    const createdRecords = await createRecords(accessToken, baseId, tableId, recordData);
    allCreatedRecords.push(...createdRecords);
  }
  return allCreatedRecords;
}
async function resolveAllLinkedRecords(accessToken, baseId, tableId, records, options = {}) {
  const warnings = [];
  if (records.length === 0) {
    return { records, warnings };
  }
  const schema = await getBaseSchema(accessToken, baseId);
  const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
  if (!table) {
    warnings.push(`Table ${tableId} not found in schema`);
    return { records, warnings };
  }
  const linkedFields = table.fields.filter((f) => f.type === "multipleRecordLinks");
  if (linkedFields.length === 0) {
    return { records, warnings };
  }
  const linkedTableMap = /* @__PURE__ */ new Map();
  for (const field of linkedFields) {
    const linkedTableId = field.options?.linkedTableId;
    if (!linkedTableId) continue;
    const fieldData = { fieldName: field.name, recordIds: /* @__PURE__ */ new Set() };
    for (const record of records) {
      const value = record.fields[field.name];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && typeof item === "object" && "id" in item) {
            fieldData.recordIds.add(item.id);
          }
        });
      }
    }
    if (fieldData.recordIds.size > 0) {
      const existing = linkedTableMap.get(linkedTableId) || [];
      existing.push(fieldData);
      linkedTableMap.set(linkedTableId, existing);
    }
  }
  const resolutionMap = /* @__PURE__ */ new Map();
  for (const [linkedTableId, fields] of linkedTableMap.entries()) {
    const allRecordIds = /* @__PURE__ */ new Set();
    fields.forEach((f) => f.recordIds.forEach((id) => allRecordIds.add(id)));
    const result = await resolveLinkedRecordNames(
      accessToken,
      baseId,
      linkedTableId,
      Array.from(allRecordIds),
      options
    );
    const lookup = /* @__PURE__ */ new Map();
    const recordIdsArray = Array.from(allRecordIds);
    result.resolved.forEach((name, index) => {
      if (recordIdsArray[index]) {
        lookup.set(recordIdsArray[index], name);
      }
    });
    resolutionMap.set(linkedTableId, lookup);
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
  }
  const enrichedRecords = records.map((record) => {
    const _resolvedLinks = {};
    for (const field of linkedFields) {
      const linkedTableId = field.options?.linkedTableId;
      if (!linkedTableId) continue;
      const lookup = resolutionMap.get(linkedTableId);
      if (!lookup) continue;
      const value = record.fields[field.name];
      if (Array.isArray(value)) {
        const names = value.map((item) => {
          if (item && typeof item === "object" && "id" in item) {
            const id = item.id;
            return lookup.get(id) || id;
          }
          return null;
        }).filter((name) => name !== null);
        _resolvedLinks[field.name] = names;
      }
    }
    return {
      ...record,
      _resolvedLinks: Object.keys(_resolvedLinks).length > 0 ? _resolvedLinks : void 0
    };
  });
  return { records: enrichedRecords, warnings };
}
async function preloadTableCache(accessToken, baseId, tableId) {
  const startTime = Date.now();
  const schema = await getBaseSchema(accessToken, baseId);
  const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
  if (!table) {
    throw new Error(`Table ${tableId} not found in base schema`);
  }
  const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
  if (!primaryField) {
    throw new Error("Could not identify primary field for table");
  }
  const records = await listRecords(accessToken, baseId, tableId);
  const cacheUpdates = [];
  for (const record of records) {
    const primaryValue = record.fields[primaryField.name];
    if (primaryValue) {
      cacheUpdates.push({ id: record.id, name: String(primaryValue) });
    }
  }
  cacheManager.updateCache(baseId, tableId, cacheUpdates);
  const duration = Date.now() - startTime;
  return { recordCount: cacheUpdates.length, duration };
}

function isDropdownField(fieldType) {
  return fieldType === "singleSelect" || fieldType === "multipleSelects";
}
function extractDropdownChoices(field) {
  if (!isDropdownField(field.type)) {
    return null;
  }
  if (!field.options?.choices || !Array.isArray(field.options.choices)) {
    console.warn(
      `Dropdown field "${field.name}" (${field.type}) has no choices defined - skipping validation`
    );
    return null;
  }
  return field.options.choices.map((choice) => choice.name);
}
function extractDropdownChoiceDetails(field) {
  if (!isDropdownField(field.type)) {
    return null;
  }
  if (!field.options?.choices || !Array.isArray(field.options.choices)) {
    return null;
  }
  return field.options.choices.map((choice) => ({
    id: choice.id,
    name: choice.name,
    color: choice.color
  }));
}
function detectDropdownFields(fields, fieldMappings) {
  const dropdownFields = [];
  fields.forEach((field, index) => {
    if (!isDropdownField(field.type)) {
      return;
    }
    const choices = extractDropdownChoices(field);
    const choiceDetails = extractDropdownChoiceDetails(field);
    if (!choices || choices.length === 0) {
      console.warn(
        `[DropdownDetector] Skipping field "${field.name}" - no choices defined`
      );
      return;
    }
    let columnIndex;
    if (fieldMappings && field.id in fieldMappings) {
      columnIndex = fieldMappings[field.id];
      console.log(
        `[DropdownDetector] Field "${field.name}" mapped to column ${columnIndex} via fieldMappings`
      );
    } else {
      columnIndex = index;
      console.log(
        `[DropdownDetector] Field "${field.name}" using array index ${columnIndex} (no field mapping)`
      );
    }
    dropdownFields.push({
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      columnIndex,
      choices,
      choiceDetails: choiceDetails || []
    });
  });
  return dropdownFields;
}
function convertToSheetsValidation(dropdownField) {
  return {
    columnIndex: dropdownField.columnIndex,
    choices: dropdownField.choices,
    showDropdown: true,
    // For multi-select, we'll be less strict since users need to enter comma-separated values
    // Single select can be strict since it's just one value
    strict: dropdownField.fieldType === "singleSelect"
  };
}
function logDropdownFields(dropdownFields) {
  if (dropdownFields.length === 0) {
    console.log("[DropdownDetector] No dropdown fields detected");
    return;
  }
  console.log(`[DropdownDetector] Detected ${dropdownFields.length} dropdown field(s):`);
  dropdownFields.forEach((field) => {
    console.log(
      `  - "${field.fieldName}" (${field.fieldType}) at column ${field.columnIndex}: ${field.choices.length} choices [${field.choices.join(", ")}]`
    );
  });
}

async function syncAirtableToSheets(options) {
  const startTime = Date.now();
  const result = {
    added: 0,
    updated: 0,
    deleted: 0,
    total: 0,
    errors: [],
    warnings: [],
    duration: 0,
    startedAt: /* @__PURE__ */ new Date(),
    completedAt: /* @__PURE__ */ new Date()
  };
  const {
    airtableAccessToken,
    sheetsAccessToken,
    baseId,
    tableId,
    viewId,
    // Optional view ID for exact row order
    spreadsheetId,
    sheetId,
    fieldMappings,
    includeHeader = true,
    resolveLinkedRecords: shouldResolveLinkedRecords = true,
    idColumnIndex = 0,
    maxRetries = 3,
    batchSize = 100
  } = options;
  const FIXED_ID_COLUMN_INDEX = 26;
  const actualIdColumnIndex = idColumnIndex === 0 ? FIXED_ID_COLUMN_INDEX : idColumnIndex;
  try {
    console.log(`[AirtableToSheets] Fetching table schema...`);
    let tableFields = [];
    let primaryFieldName;
    try {
      const schema = await retryWithBackoff$2(
        () => getBaseSchema(airtableAccessToken, baseId),
        maxRetries,
        "fetch table schema"
      );
      const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
      if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
      }
      tableFields = table.fields;
      const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
      if (primaryField) {
        primaryFieldName = primaryField.name;
        console.log(`[AirtableToSheets] Primary field for ordering: "${primaryFieldName}"`);
      }
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        const mappedFieldIds = Object.keys(fieldMappings);
        tableFields = tableFields.filter((f) => mappedFieldIds.includes(f.id));
        tableFields.sort((a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0));
      }
      console.log(`[AirtableToSheets] Found ${tableFields.length} fields to sync`);
    } catch (error) {
      result.errors.push({
        type: "FETCH",
        message: `Failed to fetch table schema: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error
      });
      return finalizeSyncResult$2(result, startTime);
    }
    console.log(`[AirtableToSheets] Fetching records from Airtable table ${tableId}...`);
    let airtableRecords = [];
    try {
      const fetchOptions = {};
      if (viewId) {
        fetchOptions.view = viewId;
        console.log(`[AirtableToSheets] Using Airtable view "${viewId}" for exact row order`);
      } else if (primaryFieldName) {
        fetchOptions.sort = [{ field: primaryFieldName, direction: "asc" }];
        console.log(`[AirtableToSheets] Sorting by primary field "${primaryFieldName}" for consistent order`);
      } else {
        console.warn(`[AirtableToSheets] No view or primary field - order may be unpredictable`);
      }
      airtableRecords = await retryWithBackoff$2(
        () => listRecords(airtableAccessToken, baseId, tableId, fetchOptions),
        maxRetries,
        "fetch Airtable records"
      );
      console.log(`[AirtableToSheets] Fetched ${airtableRecords.length} records from Airtable`);
    } catch (error) {
      result.errors.push({
        type: "FETCH",
        message: `Failed to fetch Airtable records: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error
      });
      return finalizeSyncResult$2(result, startTime);
    }
    result.total = airtableRecords.length;
    if (shouldResolveLinkedRecords && airtableRecords.length > 0) {
      console.log(`[AirtableToSheets] Resolving linked records...`);
      try {
        const resolved = await resolveAllLinkedRecords(
          airtableAccessToken,
          baseId,
          tableId,
          airtableRecords,
          { strictMode: false }
        );
        airtableRecords = resolved.records;
        if (resolved.warnings.length > 0) {
          result.warnings.push(...resolved.warnings);
        }
        console.log(`[AirtableToSheets] Linked records resolved`);
      } catch (error) {
        result.warnings.push(
          `Failed to resolve linked records: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    console.log(`[AirtableToSheets] Transforming records to Sheets rows...`);
    const transformedRows = [];
    const transformedRowsWithoutIds = [];
    const recordIdMapping = /* @__PURE__ */ new Map();
    for (let i = 0; i < airtableRecords.length; i++) {
      const record = airtableRecords[i];
      try {
        const { row, errors, warnings } = await airtableRecordToSheetsRow(
          record,
          tableFields,
          {
            accessToken: airtableAccessToken,
            baseId,
            tableId
          }
        );
        const rowWithId = [...row];
        while (rowWithId.length <= actualIdColumnIndex) {
          rowWithId.push("");
        }
        rowWithId[actualIdColumnIndex] = record.id;
        transformedRows.push(rowWithId);
        transformedRowsWithoutIds.push(row);
        recordIdMapping.set(i, record.id);
        if (errors.length > 0) {
          result.errors.push({
            recordId: record.id,
            type: "TRANSFORM",
            message: `Transformation errors: ${errors.join("; ")}`
          });
        }
        if (warnings.length > 0) {
          result.warnings.push(`Record ${record.id}: ${warnings.join("; ")}`);
        }
      } catch (error) {
        result.errors.push({
          recordId: record.id,
          type: "TRANSFORM",
          message: `Failed to transform record: ${error instanceof Error ? error.message : String(error)}`,
          originalError: error
        });
      }
    }
    console.log(`[AirtableToSheets] Transformed ${transformedRows.length} rows`);
    console.log(`[AirtableToSheets] Fetching existing Sheets data...`);
    let existingData = null;
    let headerRowOffset = includeHeader ? 1 : 0;
    try {
      existingData = await retryWithBackoff$2(
        () => getSheetData(sheetsAccessToken, spreadsheetId, sheetId),
        maxRetries,
        "fetch Sheets data"
      );
      console.log(
        `[AirtableToSheets] Found ${existingData.values?.length || 0} existing rows in Sheets`
      );
    } catch (error) {
      console.log(`[AirtableToSheets] Sheet appears to be empty or new`);
      existingData = { range: "", majorDimension: "ROWS", values: [] };
    }
    console.log(`[AirtableToSheets] Preparing ${transformedRowsWithoutIds.length} rows to write...`);
    const startRow = includeHeader ? 2 : 1;
    const existingRecordIds = /* @__PURE__ */ new Set();
    if (existingData.values && existingData.values.length > headerRowOffset) {
      const dataRows = existingData.values.slice(headerRowOffset);
      for (const row of dataRows) {
        const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : void 0;
        if (recordId) {
          existingRecordIds.add(recordId);
        }
      }
    }
    const allRowsInOrder = [];
    for (let i = 0; i < airtableRecords.length; i++) {
      const record = airtableRecords[i];
      const rowData = transformedRowsWithoutIds[i];
      const isNew = !existingRecordIds.has(record.id);
      allRowsInOrder.push({ data: rowData, recordId: record.id, isNew });
    }
    const newCount = allRowsInOrder.filter((r) => r.isNew).length;
    const updateCount = allRowsInOrder.filter((r) => !r.isNew).length;
    console.log(`[AirtableToSheets] Will write ${allRowsInOrder.length} rows in Airtable order (${newCount} new, ${updateCount} existing)`);
    if (includeHeader && (!existingData.values || existingData.values.length === 0)) {
      console.log(`[AirtableToSheets] Adding header row...`);
      const headerRow = tableFields.map((f) => f.name);
      try {
        await retryWithBackoff$2(
          () => updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, "A1", [headerRow]),
          maxRetries,
          "add header row"
        );
        if (actualIdColumnIndex === FIXED_ID_COLUMN_INDEX) {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
          const headerRange = `${columnLetter}1`;
          await updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, headerRange, [["Record ID"]]);
          console.log(`[AirtableToSheets] Added "Record ID" header to ${headerRange}`);
        }
        headerRowOffset = 1;
      } catch (error) {
        result.errors.push({
          type: "WRITE",
          message: `Failed to add header row: ${error instanceof Error ? error.message : String(error)}`,
          originalError: error
        });
      }
    }
    if (allRowsInOrder.length > 0) {
      console.log(`[AirtableToSheets] Writing ${allRowsInOrder.length} rows in Airtable order...`);
      const writeBatches = chunkArray$1(allRowsInOrder, batchSize);
      let writtenSoFar = 0;
      for (let i = 0; i < writeBatches.length; i++) {
        const batch = writeBatches[i];
        const batchData = batch.map((r) => r.data);
        const batchStartRow = startRow + writtenSoFar;
        try {
          const range = `A${batchStartRow}`;
          await retryWithBackoff$2(
            () => updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, range, batchData),
            maxRetries,
            `write rows batch ${i + 1}/${writeBatches.length}`
          );
          for (let j = 0; j < batch.length; j++) {
            const rowInfo = batch[j];
            if (rowInfo.isNew) {
              result.added++;
            } else {
              result.updated++;
            }
            recordIdMapping.set(writtenSoFar + j, rowInfo.recordId);
          }
          writtenSoFar += batch.length;
          console.log(
            `[AirtableToSheets] Wrote batch ${i + 1}/${writeBatches.length} (${batch.length} rows)`
          );
        } catch (error) {
          result.errors.push({
            type: "WRITE",
            message: `Failed to write rows batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            originalError: error
          });
        }
      }
      console.log(`[AirtableToSheets] \u2713 Wrote ${result.added} new + ${result.updated} updated rows in Airtable order`);
    }
    console.log(`[AirtableToSheets] Detecting dropdown fields for data validation...`);
    console.log(`[AirtableToSheets] Total fields to check: ${tableFields.length}`);
    console.log(`[AirtableToSheets] Field types: ${tableFields.map((f) => `${f.name}:${f.type}`).join(", ")}`);
    const dropdownFields = detectDropdownFields(tableFields, fieldMappings);
    if (dropdownFields.length > 0) {
      logDropdownFields(dropdownFields);
      try {
        const validations = dropdownFields.map(convertToSheetsValidation);
        console.log(`[AirtableToSheets] Validation configurations:`, JSON.stringify(validations, null, 2));
        console.log(`[AirtableToSheets] Applying data validation to ${validations.length} dropdown column(s)...`);
        await batchSetDropdownValidations(
          sheetsAccessToken,
          spreadsheetId,
          sheetId,
          validations
        );
        console.log(`[AirtableToSheets] \u2713 Data validation applied successfully`);
      } catch (error) {
        const errorMessage = `Failed to set up dropdown validation: ${error instanceof Error ? error.message : String(error)}`;
        result.warnings.push(errorMessage);
        console.error("[AirtableToSheets] Failed to set up dropdown validation:", error);
        console.error("[AirtableToSheets] Error details:", error instanceof Error ? error.stack : error);
      }
    } else {
      console.log(`[AirtableToSheets] No dropdown fields detected - skipping data validation`);
      console.log(`[AirtableToSheets] This might mean: 1) No singleSelect/multipleSelects fields, 2) No choices defined, or 3) All dropdown fields were filtered out`);
    }
    if (actualIdColumnIndex === FIXED_ID_COLUMN_INDEX && (result.added > 0 || result.updated > 0)) {
      const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
      try {
        const requiredColumnCount = actualIdColumnIndex + 1;
        console.log(
          `[AirtableToSheets] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
        );
        await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);
        console.log(`[AirtableToSheets] Writing ${recordIdMapping.size} record IDs to column ${columnLetter}...`);
        for (const [rowIndex, recordId] of recordIdMapping) {
          const rowNumber = rowIndex + headerRowOffset + 1;
          const range = `${columnLetter}${rowNumber}`;
          try {
            await updateSheetData(
              sheetsAccessToken,
              spreadsheetId,
              sheetId,
              range,
              [[recordId]]
            );
          } catch (error) {
            result.warnings.push(
              `Failed to write record ID to ${range}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
        console.log(`[AirtableToSheets] \u2713 Wrote ${recordIdMapping.size} record IDs to column ${columnLetter}`);
        console.log(`[AirtableToSheets] Hiding ID column ${columnLetter}...`);
        await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
        console.log(
          `[AirtableToSheets] \u2713 Hidden column ${columnLetter} (users won't see record IDs)`
        );
      } catch (error) {
        result.warnings.push(
          `Could not write/hide ID column: ${error instanceof Error ? error.message : String(error)}`
        );
        console.warn("[AirtableToSheets] Failed to write/hide ID column:", error);
      }
    }
    console.log(
      `[AirtableToSheets] Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`
    );
    return finalizeSyncResult$2(result, startTime);
  } catch (error) {
    result.errors.push({
      type: "UNKNOWN",
      message: `Unexpected error during sync: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error
    });
    return finalizeSyncResult$2(result, startTime);
  }
}
async function retryWithBackoff$2(fn, maxRetries, operation) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries) {
        break;
      }
      const isRateLimit = lastError.message.toLowerCase().includes("rate limit") || lastError.message.toLowerCase().includes("quota") || lastError.message.includes("429");
      if (!isRateLimit && attempt > 0) {
        break;
      }
      const delay = Math.min(1e3 * Math.pow(2, attempt), 3e4) + Math.random() * 1e3;
      console.warn(
        `[AirtableToSheets] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function chunkArray$1(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function finalizeSyncResult$2(result, startTime) {
  result.duration = Date.now() - startTime;
  result.completedAt = /* @__PURE__ */ new Date();
  return result;
}

async function syncSheetsToAirtable(options) {
  const startTime = Date.now();
  const result = {
    added: 0,
    updated: 0,
    deleted: 0,
    total: 0,
    errors: [],
    warnings: [],
    duration: 0,
    startedAt: /* @__PURE__ */ new Date(),
    completedAt: /* @__PURE__ */ new Date()
  };
  const {
    sheetsAccessToken,
    airtableAccessToken,
    spreadsheetId,
    sheetId,
    baseId,
    tableId,
    fieldMappings,
    idColumnIndex = 0,
    skipHeaderRow = true,
    deleteExtraRecords = false,
    resolveLinkedRecords: shouldResolveLinkedRecords = true,
    createMissingLinkedRecords = false,
    maxRetries = 3,
    batchSize = 10,
    validationMode = "lenient"
  } = options;
  const effectiveBatchSize = Math.min(Math.max(1, batchSize), 10);
  try {
    console.log(`[SheetsToAirtable] Fetching data from Google Sheets...`);
    let sheetsData = [];
    let sheetData;
    let actualIdColumnIndex = idColumnIndex;
    try {
      if (idColumnIndex === 0) {
        const FIXED_ID_COLUMN_INDEX = 26;
        actualIdColumnIndex = FIXED_ID_COLUMN_INDEX;
        const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
        console.log(
          `[SheetsToAirtable] Using fixed column ${columnLetter} (index ${actualIdColumnIndex}) for record IDs (will be hidden)`
        );
      }
      const fetchRange = `A:${columnNumberToLetter(actualIdColumnIndex + 1)}`;
      console.log(`[SheetsToAirtable] Fetching range: ${fetchRange} (includes ID column)`);
      sheetData = await retryWithBackoff$1(
        () => getSheetData(sheetsAccessToken, spreadsheetId, sheetId, fetchRange),
        maxRetries,
        "fetch Sheets data"
      );
      sheetsData = sheetData.values || [];
      if (skipHeaderRow && sheetsData.length > 0) {
        sheetsData = sheetsData.slice(1);
      }
      console.log(`[SheetsToAirtable] Fetched ${sheetsData.length} rows from Sheets`);
    } catch (error) {
      result.errors.push({
        type: "FETCH",
        message: `Failed to fetch Sheets data: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error
      });
      return finalizeSyncResult$1(result, startTime);
    }
    if (sheetsData.length === 0) {
      console.log(`[SheetsToAirtable] Sheet is empty, no data to sync`);
      result.warnings.push("Sheet is empty, no data to sync");
      return finalizeSyncResult$1(result, startTime);
    }
    result.total = sheetsData.length;
    console.log(`[SheetsToAirtable] Fetching Airtable table schema...`);
    let tableFields = [];
    let primaryFieldId = "";
    let primaryFieldName;
    try {
      const schema = await retryWithBackoff$1(
        () => getBaseSchema(airtableAccessToken, baseId),
        maxRetries,
        "fetch table schema"
      );
      const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
      if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
      }
      tableFields = table.fields;
      primaryFieldId = table.primaryFieldId;
      const primaryField = tableFields.find((f) => f.id === primaryFieldId);
      if (primaryField) {
        primaryFieldName = primaryField.name;
        console.log(`[SheetsToAirtable] Primary field for matching: "${primaryFieldName}"`);
      }
      const writableFields = tableFields.filter((f) => !isReadOnlyField(f.type));
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        const mappedFieldIds = Object.keys(fieldMappings);
        tableFields = writableFields.filter((f) => mappedFieldIds.includes(f.id));
        tableFields.sort((a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0));
      } else {
        tableFields = writableFields;
      }
      console.log(`[SheetsToAirtable] Found ${tableFields.length} writable fields`);
    } catch (error) {
      result.errors.push({
        type: "FETCH",
        message: `Failed to fetch table schema: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error
      });
      return finalizeSyncResult$1(result, startTime);
    }
    if (shouldResolveLinkedRecords) {
      console.log(`[SheetsToAirtable] Preloading linked record caches...`);
      const linkedFields = tableFields.filter((f) => f.type === "multipleRecordLinks");
      for (const field of linkedFields) {
        const linkedTableId = field.options?.linkedTableId;
        if (!linkedTableId) continue;
        try {
          const { recordCount, duration } = await preloadTableCache(
            airtableAccessToken,
            baseId,
            linkedTableId
          );
          console.log(
            `[SheetsToAirtable] Preloaded ${recordCount} records from linked table ${linkedTableId} in ${duration}ms`
          );
        } catch (error) {
          result.warnings.push(
            `Failed to preload cache for linked table ${linkedTableId}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
    console.log(`[SheetsToAirtable] Transforming Sheets rows to Airtable records...`);
    const transformedRows = [];
    for (let i = 0; i < sheetsData.length; i++) {
      const row = sheetsData[i];
      const rowNumber = i + (skipHeaderRow ? 2 : 1);
      const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : void 0;
      console.log(`[SheetsToAirtable] Row ${i}: Column ${actualIdColumnIndex} value = "${row[actualIdColumnIndex]}" | Parsed ID = "${recordId}" | Row length = ${row.length}`);
      if (isRowEmpty$1(row)) {
        result.warnings.push(`Row ${rowNumber} is empty, skipping`);
        continue;
      }
      try {
        const transformed = fieldMappings && Object.keys(fieldMappings).length > 0 ? await sheetsRowToAirtableFieldsWithMapping(row, tableFields, fieldMappings, actualIdColumnIndex, {
          accessToken: airtableAccessToken,
          baseId,
          tableId
        }) : await sheetsRowToAirtableFields(
          (() => {
            const dataRow = [...row];
            dataRow.splice(actualIdColumnIndex, 1);
            return dataRow;
          })(),
          tableFields,
          {
            accessToken: airtableAccessToken,
            baseId,
            tableId
          }
        );
        if (shouldResolveLinkedRecords) {
          for (const field of tableFields) {
            if (field.type !== "multipleRecordLinks") continue;
            const linkedTableId = field.options?.linkedTableId;
            if (!linkedTableId || !transformed.fields[field.name]) continue;
            const namesValue = transformed.fields[field.name];
            if (typeof namesValue !== "string") continue;
            const names = namesValue.split(",").map((n) => n.trim()).filter((n) => n);
            if (names.length === 0) continue;
            try {
              const resolveResult = await resolveNamesToRecordIds(
                airtableAccessToken,
                baseId,
                linkedTableId,
                names,
                {
                  createMissing: createMissingLinkedRecords,
                  strictMode: validationMode === "strict"
                }
              );
              transformed.fields[field.name] = resolveResult.resolved.map((id) => ({ id }));
              if (resolveResult.warnings.length > 0) {
                transformed.warnings.push(...resolveResult.warnings);
              }
              if (resolveResult.missing.length > 0) {
                const msg = `Row ${rowNumber}, field ${field.name}: Could not resolve names: ${resolveResult.missing.join(", ")}`;
                if (validationMode === "strict") {
                  transformed.errors.push(msg);
                } else {
                  transformed.warnings.push(msg);
                }
              }
            } catch (error) {
              const msg = `Row ${rowNumber}, field ${field.name}: Failed to resolve linked records: ${error instanceof Error ? error.message : String(error)}`;
              if (validationMode === "strict") {
                transformed.errors.push(msg);
              } else {
                transformed.warnings.push(msg);
              }
            }
          }
        }
        const isValid = validationMode === "lenient" || transformed.errors.length === 0;
        transformedRows.push({
          rowIndex: i,
          recordId,
          fields: transformed.fields,
          errors: transformed.errors,
          warnings: transformed.warnings,
          isValid
        });
        if (transformed.errors.length > 0) {
          result.errors.push({
            rowNumber,
            recordId,
            type: "TRANSFORM",
            message: `Transformation errors: ${transformed.errors.join("; ")}`
          });
        }
        if (transformed.warnings.length > 0) {
          result.warnings.push(`Row ${rowNumber}: ${transformed.warnings.join("; ")}`);
        }
      } catch (error) {
        const msg = `Failed to transform row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`;
        if (validationMode === "strict") {
          result.errors.push({
            rowNumber,
            recordId,
            type: "TRANSFORM",
            message: msg,
            originalError: error
          });
        } else {
          result.warnings.push(msg);
          transformedRows.push({
            rowIndex: i,
            recordId,
            fields: {},
            errors: [msg],
            warnings: [],
            isValid: false
          });
        }
      }
    }
    const validRows = transformedRows.filter((r) => r.isValid);
    console.log(
      `[SheetsToAirtable] Transformed ${validRows.length}/${transformedRows.length} valid rows`
    );
    if (validRows.length === 0 && transformedRows.length > 0) {
      result.errors.push({
        type: "VALIDATION",
        message: "No valid rows to sync after transformation"
      });
      return finalizeSyncResult$1(result, startTime);
    }
    console.log(`[SheetsToAirtable] Fetching existing Airtable records...`);
    let existingRecords = [];
    try {
      existingRecords = await retryWithBackoff$1(
        () => listRecords(airtableAccessToken, baseId, tableId),
        maxRetries,
        "fetch Airtable records"
      );
      console.log(`[SheetsToAirtable] Found ${existingRecords.length} existing records in Airtable`);
    } catch (error) {
      result.errors.push({
        type: "FETCH",
        message: `Failed to fetch existing Airtable records: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error
      });
      return finalizeSyncResult$1(result, startTime);
    }
    console.log(`[SheetsToAirtable] Calculating changes...`);
    const diff = calculateRecordDiff(validRows, existingRecords, deleteExtraRecords, primaryFieldName);
    console.log(
      `[SheetsToAirtable] Changes: ${diff.toCreate.length} to create, ${diff.toUpdate.length} to update, ${diff.toDelete.length} to delete`
    );
    const newRecordIdUpdates = [];
    if (diff.toCreate.length > 0) {
      console.log(`[SheetsToAirtable] Creating ${diff.toCreate.length} new records...`);
      const createBatches = batchOperations(diff.toCreate, effectiveBatchSize);
      let createdSoFar = 0;
      for (let i = 0; i < createBatches.length; i++) {
        const batch = createBatches[i];
        try {
          const created = await retryWithBackoff$1(
            () => createRecords(airtableAccessToken, baseId, tableId, batch),
            maxRetries,
            `create records batch ${i + 1}/${createBatches.length}`
          );
          for (let j = 0; j < created.length; j++) {
            const createdRecord = created[j];
            const originalRowIndex = validRows.filter((r) => !r.recordId)[createdSoFar + j]?.rowIndex;
            if (originalRowIndex !== void 0 && createdRecord.id) {
              const sheetRowNumber = originalRowIndex + (skipHeaderRow ? 2 : 1);
              newRecordIdUpdates.push({ row: sheetRowNumber, recordId: createdRecord.id });
            }
          }
          createdSoFar += created.length;
          result.added += created.length;
          console.log(
            `[SheetsToAirtable] Created batch ${i + 1}/${createBatches.length} (${created.length} records)`
          );
        } catch (error) {
          result.errors.push({
            type: "WRITE",
            message: `Failed to create records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            originalError: error
          });
          if (validationMode === "strict") {
            return finalizeSyncResult$1(result, startTime);
          }
        }
      }
    }
    if (diff.toUpdate.length > 0) {
      console.log(`[SheetsToAirtable] Updating ${diff.toUpdate.length} records...`);
      const updateBatches = batchOperations(diff.toUpdate, effectiveBatchSize);
      for (let i = 0; i < updateBatches.length; i++) {
        const batch = updateBatches[i];
        try {
          const updated = await retryWithBackoff$1(
            () => updateRecords(airtableAccessToken, baseId, tableId, batch),
            maxRetries,
            `update records batch ${i + 1}/${updateBatches.length}`
          );
          result.updated += updated.length;
          console.log(
            `[SheetsToAirtable] Updated batch ${i + 1}/${updateBatches.length} (${updated.length} records)`
          );
        } catch (error) {
          result.errors.push({
            type: "WRITE",
            message: `Failed to update records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            originalError: error
          });
          if (validationMode === "strict") {
            return finalizeSyncResult$1(result, startTime);
          }
        }
      }
    }
    if (diff.toDelete.length > 0 && deleteExtraRecords) {
      console.log(`[SheetsToAirtable] Deleting ${diff.toDelete.length} extra records...`);
      const deleteBatches = batchOperations(diff.toDelete, effectiveBatchSize);
      for (let i = 0; i < deleteBatches.length; i++) {
        const batch = deleteBatches[i];
        try {
          const deleted = await retryWithBackoff$1(
            () => deleteRecords(airtableAccessToken, baseId, tableId, batch),
            maxRetries,
            `delete records batch ${i + 1}/${deleteBatches.length}`
          );
          result.deleted += deleted.length;
          console.log(
            `[SheetsToAirtable] Deleted batch ${i + 1}/${deleteBatches.length} (${deleted.length} records)`
          );
        } catch (error) {
          result.errors.push({
            type: "WRITE",
            message: `Failed to delete records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            originalError: error
          });
          if (validationMode === "strict") {
            return finalizeSyncResult$1(result, startTime);
          }
        }
      }
    }
    if (newRecordIdUpdates.length > 0) {
      console.log(
        `[SheetsToAirtable] Writing ${newRecordIdUpdates.length} new record IDs back to Sheets...`
      );
      try {
        const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
        const requiredColumnCount = actualIdColumnIndex + 1;
        console.log(
          `[SheetsToAirtable] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
        );
        await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);
        newRecordIdUpdates.sort((a, b) => a.row - b.row);
        const updatePromises = [];
        for (const update of newRecordIdUpdates) {
          const range = `${columnLetter}${update.row}`;
          updatePromises.push(
            updateSheetData(
              sheetsAccessToken,
              spreadsheetId,
              sheetId,
              range,
              [[update.recordId]]
            ).catch((error) => {
              result.warnings.push(
                `Failed to write record ID ${update.recordId} to row ${update.row}: ${error instanceof Error ? error.message : String(error)}`
              );
              console.warn(
                `[SheetsToAirtable] Failed to write ID for row ${update.row}:`,
                error
              );
            })
          );
          if (updatePromises.length >= 10) {
            await Promise.all(updatePromises);
            updatePromises.length = 0;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
        console.log(
          `[SheetsToAirtable] \u2713 Successfully wrote ${newRecordIdUpdates.length} record IDs to column ${columnLetter}`
        );
        try {
          await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
          console.log(
            `[SheetsToAirtable] \u2713 Hidden column ${columnLetter} (users won't see record IDs)`
          );
        } catch (error) {
          result.warnings.push(
            `Could not auto-hide ID column: ${error instanceof Error ? error.message : String(error)}`
          );
          console.warn("[SheetsToAirtable] Failed to hide ID column:", error);
        }
      } catch (error) {
        const warningMsg = `Failed to write some record IDs back to Sheets: ${error instanceof Error ? error.message : String(error)}. You may experience duplicate records on next sync.`;
        result.warnings.push(warningMsg);
        console.error("[SheetsToAirtable] Error writing IDs back to Sheets:", error);
      }
    }
    console.log(
      `[SheetsToAirtable] Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`
    );
    return finalizeSyncResult$1(result, startTime);
  } catch (error) {
    result.errors.push({
      type: "UNKNOWN",
      message: `Unexpected error during sync: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error
    });
    return finalizeSyncResult$1(result, startTime);
  }
}
function calculateRecordDiff(transformedRows, existingRecords, deleteExtra, primaryFieldName) {
  const diff = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
    rowToRecordMap: /* @__PURE__ */ new Map()
  };
  const existingRecordsMap = new Map(
    existingRecords.map((r) => [r.id, r])
  );
  const existingRecordsByPrimaryField = /* @__PURE__ */ new Map();
  if (primaryFieldName) {
    for (const record of existingRecords) {
      const primaryValue = record.fields[primaryFieldName];
      if (primaryValue) {
        const normalizedValue = String(primaryValue).trim().toLowerCase();
        if (normalizedValue) {
          existingRecordsByPrimaryField.set(normalizedValue, record);
        }
      }
    }
  }
  const processedRecordIds = /* @__PURE__ */ new Set();
  for (const row of transformedRows) {
    if (!row.isValid) continue;
    let matchedRecord;
    if (row.recordId && existingRecordsMap.has(row.recordId)) {
      matchedRecord = existingRecordsMap.get(row.recordId);
    } else if (!row.recordId && primaryFieldName && row.fields[primaryFieldName]) {
      const primaryValue = String(row.fields[primaryFieldName]).trim().toLowerCase();
      if (primaryValue) {
        matchedRecord = existingRecordsByPrimaryField.get(primaryValue);
        if (matchedRecord) {
          console.log(
            `[SheetsToAirtable] Matched row ${row.rowIndex} to existing record ${matchedRecord.id} by primary field "${primaryFieldName}"`
          );
        }
      }
    }
    if (matchedRecord) {
      processedRecordIds.add(matchedRecord.id);
      if (hasRecordChanged(row.fields, matchedRecord.fields)) {
        diff.toUpdate.push({
          id: matchedRecord.id,
          fields: row.fields
        });
      }
      diff.rowToRecordMap.set(row.rowIndex, matchedRecord.id);
    } else {
      const cleanedFields = Object.fromEntries(
        Object.entries(row.fields).filter(([_, value]) => value !== null && value !== void 0)
      );
      diff.toCreate.push({
        fields: cleanedFields
      });
    }
  }
  if (deleteExtra) {
    for (const record of existingRecords) {
      if (!processedRecordIds.has(record.id)) {
        diff.toDelete.push(record.id);
      }
    }
  }
  return diff;
}
function hasRecordChanged(newFields, existingFields) {
  const allFieldNames = /* @__PURE__ */ new Set([
    ...Object.keys(newFields),
    ...Object.keys(existingFields)
  ]);
  for (const fieldName of allFieldNames) {
    const newValue = normalizeFieldValue$1(newFields[fieldName]);
    const existingValue = normalizeFieldValue$1(existingFields[fieldName]);
    if (!areValuesEqual(newValue, existingValue)) {
      return true;
    }
  }
  return false;
}
function normalizeFieldValue$1(value) {
  if (value === null || value === void 0 || value === "") {
    return null;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return Math.round(value * 1e6) / 1e6;
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object" && "id" in value[0]) {
      return value.map((v) => v.id).sort();
    }
    return value.map(normalizeFieldValue$1).sort();
  }
  if (typeof value === "object") {
    if ("id" in value) {
      return value.id;
    }
  }
  return value;
}
function areValuesEqual(val1, val2) {
  if (val1 === val2) return true;
  if (val1 === null || val2 === null) return val1 === val2;
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    return val1.every((v, i) => v === val2[i]);
  }
  return false;
}
function isRowEmpty$1(row) {
  return row.every((cell) => cell === null || cell === void 0 || String(cell).trim() === "");
}
async function retryWithBackoff$1(fn, maxRetries, operation) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries) {
        break;
      }
      const isRateLimit = lastError.message.toLowerCase().includes("rate limit") || lastError.message.toLowerCase().includes("quota") || lastError.message.includes("429");
      const isValidationError = lastError.message.toLowerCase().includes("invalid") || lastError.message.toLowerCase().includes("validation") || lastError.message.includes("422");
      if (isValidationError) {
        throw lastError;
      }
      if (!isRateLimit && attempt > 0) {
        break;
      }
      const delay = Math.min(1e3 * Math.pow(2, attempt), 3e4) + Math.random() * 1e3;
      console.warn(
        `[SheetsToAirtable] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function finalizeSyncResult$1(result, startTime) {
  result.duration = Date.now() - startTime;
  result.completedAt = /* @__PURE__ */ new Date();
  return result;
}

class SyncStateManager {
  states = /* @__PURE__ */ new Map();
  /**
   * Gets the sync state for a config
   */
  getState(syncConfigId) {
    return this.states.get(syncConfigId);
  }
  /**
   * Sets the sync state for a config
   */
  setState(syncConfigId, state) {
    this.states.set(syncConfigId, state);
  }
  /**
   * Updates the state for a single record
   */
  updateRecordState(syncConfigId, recordState) {
    let state = this.states.get(syncConfigId);
    if (!state) {
      state = {
        syncConfigId,
        records: /* @__PURE__ */ new Map(),
        lastSyncTime: Date.now()
      };
      this.states.set(syncConfigId, state);
    }
    state.records.set(recordState.recordId, recordState);
  }
  /**
   * Removes a record from state
   */
  removeRecordState(syncConfigId, recordId) {
    const state = this.states.get(syncConfigId);
    if (state) {
      state.records.delete(recordId);
    }
  }
  /**
   * Clears state for a sync config
   */
  clearState(syncConfigId) {
    this.states.delete(syncConfigId);
  }
  /**
   * Clears all states
   */
  clearAll() {
    this.states.clear();
  }
  /**
   * Gets statistics about stored states
   */
  getStats() {
    const configs = Array.from(this.states.entries()).map(([id, state]) => ({
      id,
      recordCount: state.records.size,
      lastSync: state.lastSyncTime
    }));
    const totalRecords = configs.reduce((sum, c) => sum + c.recordCount, 0);
    return {
      totalConfigs: this.states.size,
      totalRecords,
      configs
    };
  }
}
const stateManager = new SyncStateManager();
function generateRecordHash(fields) {
  const sortedFields = Object.keys(fields).sort().reduce((acc, key) => {
    acc[key] = normalizeFieldValue(fields[key]);
    return acc;
  }, {});
  const content = JSON.stringify(sortedFields);
  return crypto__default.createHash("sha256").update(content).digest("hex");
}
function generateRowHash(row) {
  const normalized = row.map(normalizeFieldValue);
  const content = JSON.stringify(normalized);
  return crypto__default.createHash("sha256").update(content).digest("hex");
}
function normalizeFieldValue(value) {
  if (value === null || value === void 0 || value === "") {
    return null;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return Math.round(value * 1e6) / 1e6;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeFieldValue).sort();
  }
  if (typeof value === "object") {
    if ("id" in value) {
      return value.id;
    }
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = normalizeFieldValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}
function captureAirtableState(records) {
  const now = Date.now();
  return records.map((record) => {
    const fieldsToHash = record.fields;
    return {
      recordId: record.id,
      contentHash: generateRecordHash(fieldsToHash),
      airtableModifiedTime: record.createdTime,
      capturedAt: now
    };
  });
}
function captureSheetsState(rows, idColumnIndex) {
  const now = Date.now();
  const states = /* @__PURE__ */ new Map();
  rows.forEach((row, rowIndex) => {
    const hasRecordId = idColumnIndex !== void 0 && row[idColumnIndex] && String(row[idColumnIndex]).trim() !== "";
    const recordId = hasRecordId ? String(row[idColumnIndex]).trim() : `row_${rowIndex}`;
    if (isRowEmpty(row)) {
      return;
    }
    const rowDataOnly = idColumnIndex !== void 0 ? row.filter((_, idx) => idx !== idColumnIndex) : row;
    states.set(recordId, {
      recordId,
      contentHash: generateRowHash(rowDataOnly),
      sheetsModifiedTime: (/* @__PURE__ */ new Date()).toISOString(),
      // Sheets doesn't provide cell-level timestamps
      capturedAt: now
    });
  });
  return states;
}
function isRowEmpty(row) {
  return row.every((cell) => cell === null || cell === void 0 || String(cell).trim() === "");
}
function detectConflicts(airtableRecords, sheetsRows, syncConfigId, idColumnIndex) {
  const result = {
    conflicts: [],
    airtableOnlyChanges: [],
    sheetsOnlyChanges: [],
    noChanges: [],
    newInAirtable: [],
    newInSheets: []
  };
  const lastState = stateManager.getState(syncConfigId);
  const currentAirtableStates = new Map(
    captureAirtableState(airtableRecords).map((s) => [s.recordId, s])
  );
  const currentSheetsStates = captureSheetsState(sheetsRows, idColumnIndex);
  console.log(`[ConflictDetector] ========== DEBUG INFO ==========`);
  console.log(`[ConflictDetector] Tracking ALL Airtable fields (not filtered by mappings)`);
  console.log(`[ConflictDetector] ID column index: ${idColumnIndex}`);
  console.log(`[ConflictDetector] Airtable records: ${airtableRecords.length}`);
  console.log(`[ConflictDetector] Sheets rows: ${sheetsRows.length}`);
  console.log(`[ConflictDetector] Has previous state: ${!!lastState}`);
  if (lastState) {
    console.log(`[ConflictDetector] Previous state records: ${lastState.records.size}`);
  }
  if (airtableRecords.length > 0) {
    const firstRecord = airtableRecords[0];
    const airtableState = currentAirtableStates.get(firstRecord.id);
    const sheetsState = currentSheetsStates.get(firstRecord.id);
    const lastKnown = lastState?.records.get(firstRecord.id);
    console.log(`[ConflictDetector] --- First Record Debug (${firstRecord.id}) ---`);
    console.log(`[ConflictDetector] Airtable fields:`, JSON.stringify(firstRecord.fields, null, 2));
    const sheetsRow = sheetsRows.find((row) => row[idColumnIndex || 0] === firstRecord.id);
    console.log(`[ConflictDetector] Sheets row:`, JSON.stringify(sheetsRow, null, 2));
    console.log(`[ConflictDetector] Airtable hash: ${airtableState?.contentHash?.substring(0, 16)}...`);
    console.log(`[ConflictDetector] Sheets hash:   ${sheetsState?.contentHash?.substring(0, 16) || "NOT FOUND"}...`);
    console.log(`[ConflictDetector] Last hash:     ${lastKnown?.contentHash?.substring(0, 16) || "NO PREVIOUS STATE"}...`);
    if (lastKnown) {
      console.log(`[ConflictDetector] Airtable changed: ${airtableState?.contentHash !== lastKnown.contentHash}`);
      console.log(`[ConflictDetector] Sheets changed:   ${sheetsState?.contentHash !== lastKnown.contentHash}`);
    }
  }
  console.log(`[ConflictDetector] ================================`);
  if (!lastState) {
    result.newInAirtable = Array.from(currentAirtableStates.keys());
    result.newInSheets = Array.from(currentSheetsStates.keys()).filter((id) => id.startsWith("row_")).map((id) => parseInt(id.replace("row_", ""), 10)).filter((n) => !isNaN(n));
    console.log(`[ConflictDetector] First sync detected: ${result.newInAirtable.length} new in Airtable, ${result.newInSheets.length} new in Sheets`);
    return result;
  }
  const lastKnownRecords = lastState.records;
  const processedRecords = /* @__PURE__ */ new Set();
  for (const [recordId, airtableState] of currentAirtableStates.entries()) {
    processedRecords.add(recordId);
    const sheetsState = currentSheetsStates.get(recordId);
    const lastKnown = lastKnownRecords.get(recordId);
    if (!lastKnown) {
      result.newInAirtable.push(recordId);
      continue;
    }
    if (!sheetsState) {
      const airtableChanged2 = airtableState.contentHash !== lastKnown.contentHash;
      if (airtableChanged2) {
        const record = airtableRecords.find((r) => r.id === recordId);
        result.conflicts.push({
          recordId,
          airtableState: {
            record,
            contentHash: airtableState.contentHash,
            modifiedTime: airtableState.airtableModifiedTime
          },
          sheetsState: {
            row: [],
            contentHash: "",
            modifiedTime: void 0
          },
          lastKnownState: lastKnown,
          conflictType: "DELETED_IN_SHEETS"
        });
      } else {
        result.sheetsOnlyChanges.push(recordId);
      }
      continue;
    }
    const airtableChanged = airtableState.contentHash !== lastKnown.contentHash;
    const sheetsChanged = sheetsState.contentHash !== lastKnown.contentHash;
    if (airtableChanged && sheetsChanged) {
      const record = airtableRecords.find((r) => r.id === recordId);
      const rowIndex = Array.from(currentSheetsStates.entries()).findIndex(
        ([id]) => id === recordId
      );
      result.conflicts.push({
        recordId,
        airtableState: {
          record,
          contentHash: airtableState.contentHash,
          modifiedTime: airtableState.airtableModifiedTime
        },
        sheetsState: {
          row: sheetsRows[rowIndex],
          contentHash: sheetsState.contentHash,
          modifiedTime: sheetsState.sheetsModifiedTime
        },
        lastKnownState: lastKnown,
        conflictType: "BOTH_MODIFIED"
      });
    } else if (airtableChanged) {
      result.airtableOnlyChanges.push(recordId);
    } else if (sheetsChanged) {
      result.sheetsOnlyChanges.push(recordId);
    } else {
      result.noChanges.push(recordId);
    }
  }
  for (const [recordId, sheetsState] of currentSheetsStates.entries()) {
    if (processedRecords.has(recordId)) continue;
    const lastKnown = lastKnownRecords.get(recordId);
    if (!lastKnown) {
      let rowIndex = -1;
      if (recordId.startsWith("row_")) {
        rowIndex = parseInt(recordId.replace("row_", ""), 10);
      } else {
        rowIndex = sheetsRows.findIndex(
          (row) => idColumnIndex !== void 0 && row[idColumnIndex] && String(row[idColumnIndex]).trim() === recordId
        );
      }
      if (rowIndex >= 0 && !isNaN(rowIndex)) {
        result.newInSheets.push(rowIndex);
      }
      continue;
    }
    const sheetsChanged = sheetsState.contentHash !== lastKnown.contentHash;
    if (sheetsChanged) {
      let rowIndex = -1;
      if (recordId.startsWith("row_")) {
        rowIndex = parseInt(recordId.replace("row_", ""), 10);
      } else {
        rowIndex = sheetsRows.findIndex(
          (row) => idColumnIndex !== void 0 && row[idColumnIndex] && String(row[idColumnIndex]).trim() === recordId
        );
      }
      result.conflicts.push({
        recordId,
        airtableState: {
          record: { id: recordId, createdTime: "", fields: {} },
          contentHash: "",
          modifiedTime: void 0
        },
        sheetsState: {
          row: rowIndex >= 0 ? sheetsRows[rowIndex] : [],
          contentHash: sheetsState.contentHash,
          modifiedTime: sheetsState.sheetsModifiedTime
        },
        lastKnownState: lastKnown,
        conflictType: "DELETED_IN_AIRTABLE"
      });
    } else {
      result.airtableOnlyChanges.push(recordId);
    }
  }
  return result;
}
function resolveConflicts(conflicts, strategy) {
  return conflicts.map((conflict) => resolveConflict(conflict, strategy));
}
function resolveConflict(conflict, strategy) {
  if (conflict.conflictType === "DELETED_IN_AIRTABLE") {
    if (strategy === "AIRTABLE_WINS") {
      return {
        recordId: conflict.recordId,
        action: "DELETE",
        winner: "AIRTABLE",
        reason: "Record deleted in Airtable, applying deletion to Sheets (AIRTABLE_WINS)"
      };
    } else if (strategy === "SHEETS_WINS") {
      return {
        recordId: conflict.recordId,
        action: "USE_SHEETS",
        winner: "SHEETS",
        reason: "Record modified in Sheets but deleted in Airtable, recreating in Airtable (SHEETS_WINS)"
      };
    } else {
      return {
        recordId: conflict.recordId,
        action: "DELETE",
        winner: "AIRTABLE",
        reason: "Record deleted in Airtable (deletion considered most recent)"
      };
    }
  }
  if (conflict.conflictType === "DELETED_IN_SHEETS") {
    if (strategy === "AIRTABLE_WINS") {
      return {
        recordId: conflict.recordId,
        action: "USE_AIRTABLE",
        winner: "AIRTABLE",
        reason: "Record modified in Airtable but deleted in Sheets, restoring to Sheets (AIRTABLE_WINS)"
      };
    } else if (strategy === "SHEETS_WINS") {
      return {
        recordId: conflict.recordId,
        action: "DELETE",
        winner: "SHEETS",
        reason: "Record deleted in Sheets, applying deletion to Airtable (SHEETS_WINS)"
      };
    } else {
      return {
        recordId: conflict.recordId,
        action: "DELETE",
        winner: "SHEETS",
        reason: "Record deleted in Sheets (deletion considered most recent)"
      };
    }
  }
  if (strategy === "AIRTABLE_WINS") {
    return {
      recordId: conflict.recordId,
      action: "USE_AIRTABLE",
      winner: "AIRTABLE",
      reason: "Both sides modified, Airtable takes precedence (AIRTABLE_WINS)"
    };
  }
  if (strategy === "SHEETS_WINS") {
    return {
      recordId: conflict.recordId,
      action: "USE_SHEETS",
      winner: "SHEETS",
      reason: "Both sides modified, Sheets takes precedence (SHEETS_WINS)"
    };
  }
  return {
    recordId: conflict.recordId,
    action: "USE_AIRTABLE",
    winner: "AIRTABLE",
    reason: "Both sides modified since last sync, no reliable modification timestamps available, defaulting to Airtable as source of truth"
  };
}
function updateSyncState(syncConfigId, airtableRecords, sheetsRows, idColumnIndex) {
  const airtableStates = captureAirtableState(airtableRecords);
  const sheetsStates = captureSheetsState(sheetsRows, idColumnIndex);
  const allRecords = /* @__PURE__ */ new Map();
  airtableStates.forEach((state) => {
    allRecords.set(state.recordId, state);
  });
  sheetsStates.forEach((state, recordId) => {
    const existing = allRecords.get(recordId);
    if (existing) {
      allRecords.set(recordId, {
        ...existing,
        sheetsModifiedTime: state.sheetsModifiedTime
      });
    } else {
      allRecords.set(recordId, state);
    }
  });
  stateManager.setState(syncConfigId, {
    syncConfigId,
    records: allRecords,
    lastSyncTime: Date.now()
  });
}
function summarizeConflicts(result) {
  const totalConflicts = result.conflicts.length;
  const totalChanges = result.airtableOnlyChanges.length + result.sheetsOnlyChanges.length + result.newInAirtable.length + result.newInSheets.length;
  const parts = [];
  if (result.conflicts.length > 0) {
    parts.push(`${result.conflicts.length} conflicts`);
  }
  if (result.airtableOnlyChanges.length > 0) {
    parts.push(`${result.airtableOnlyChanges.length} Airtable changes`);
  }
  if (result.sheetsOnlyChanges.length > 0) {
    parts.push(`${result.sheetsOnlyChanges.length} Sheets changes`);
  }
  if (result.newInAirtable.length > 0) {
    parts.push(`${result.newInAirtable.length} new in Airtable`);
  }
  if (result.newInSheets.length > 0) {
    parts.push(`${result.newInSheets.length} new in Sheets`);
  }
  if (result.noChanges.length > 0) {
    parts.push(`${result.noChanges.length} unchanged`);
  }
  return {
    totalConflicts,
    totalChanges,
    summary: parts.join(", ")
  };
}

async function syncBidirectional(options) {
  const startTime = Date.now();
  const result = {
    status: "SUCCESS",
    summary: {
      airtableToSheets: { added: 0, updated: 0, deleted: 0 },
      sheetsToAirtable: { added: 0, updated: 0, deleted: 0 },
      conflicts: { total: 0, airtableWins: 0, sheetsWins: 0, deleted: 0, skipped: 0 }
    },
    phases: {
      fetch: createPhaseResult("fetch"),
      conflictDetection: createPhaseResult("conflictDetection"),
      conflictResolution: createPhaseResult("conflictResolution"),
      airtableToSheets: createPhaseResult("airtableToSheets"),
      sheetsToAirtable: createPhaseResult("sheetsToAirtable"),
      stateUpdate: createPhaseResult("stateUpdate")
    },
    errors: [],
    warnings: [],
    duration: 0,
    startedAt: /* @__PURE__ */ new Date(),
    completedAt: /* @__PURE__ */ new Date(),
    lastSyncAt: /* @__PURE__ */ new Date()
  };
  const {
    syncConfigId,
    airtableAccessToken,
    sheetsAccessToken,
    baseId,
    tableId,
    viewId,
    // CRITICAL: Extract viewId for Airtable record ordering
    spreadsheetId,
    sheetId,
    conflictResolution,
    fieldMappings,
    idColumnIndex = 0,
    syncTimestampColumnIndex,
    includeHeader = true,
    resolveLinkedRecords: shouldResolveLinkedRecords = true,
    createMissingLinkedRecords = false,
    maxRetries = 3,
    batchSize = 10,
    dryRun = false
  } = options;
  const checkpoint = {
    airtableRecords: [],
    sheetsRows: [],
    tableFields: []
  };
  let actualIdColumnIndex = idColumnIndex;
  console.log(`
${"=".repeat(80)}`);
  console.log(`[BidirectionalSync] Starting bidirectional sync for config: ${syncConfigId}`);
  console.log(`[BidirectionalSync] Conflict resolution strategy: ${conflictResolution}`);
  console.log(`[BidirectionalSync] Dry run: ${dryRun}`);
  console.log(`${"=".repeat(80)}
`);
  try {
    const fetchPhase = await executePhase("fetch", async () => {
      console.log(`[Phase 1: Fetch] Fetching current state from Airtable and Sheets...`);
      console.log(`[Phase 1: Fetch] Fetching table schema...`);
      const schema = await retryWithBackoff(
        () => getBaseSchema(airtableAccessToken, baseId),
        maxRetries,
        "fetch table schema"
      );
      const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
      if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
      }
      checkpoint.tableFields = table.fields;
      const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
      if (primaryField) {
        checkpoint.primaryFieldName = primaryField.name;
        console.log(`[Phase 1: Fetch] Primary field for matching: "${checkpoint.primaryFieldName}"`);
      }
      console.log(`[Phase 1: Fetch] Fetching Airtable records...`);
      const listRecordsOptions = {};
      if (viewId) {
        listRecordsOptions.view = viewId;
        console.log(`[Phase 1: Fetch] Using view "${viewId}" for exact row ordering`);
      } else if (checkpoint.primaryFieldName) {
        listRecordsOptions.sort = [{ field: checkpoint.primaryFieldName, direction: "asc" }];
        console.log(`[Phase 1: Fetch] Sorting by primary field "${checkpoint.primaryFieldName}" for consistent order`);
      } else {
        console.warn(`[Phase 1: Fetch] No view or primary field - order may be unpredictable`);
      }
      checkpoint.airtableRecords = await retryWithBackoff(
        () => listRecords(airtableAccessToken, baseId, tableId, listRecordsOptions),
        maxRetries,
        "fetch Airtable records"
      );
      console.log(`[Phase 1: Fetch] \u2713 Fetched ${checkpoint.airtableRecords.length} Airtable records`);
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        const mappedFieldIds = Object.keys(fieldMappings);
        checkpoint.tableFields = checkpoint.tableFields.filter(
          (f) => mappedFieldIds.includes(f.id)
        );
        checkpoint.tableFields.sort(
          (a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0)
        );
      }
      console.log(`[Phase 1: Fetch] \u2713 Found ${checkpoint.tableFields.length} fields`);
      if (shouldResolveLinkedRecords && checkpoint.airtableRecords.length > 0) {
        console.log(`[Phase 1: Fetch] Resolving linked records...`);
        const resolved = await resolveAllLinkedRecords(
          airtableAccessToken,
          baseId,
          tableId,
          checkpoint.airtableRecords,
          { strictMode: false }
        );
        checkpoint.airtableRecords = resolved.records;
        if (resolved.warnings.length > 0) {
          return { warnings: resolved.warnings };
        }
        console.log(`[Phase 1: Fetch] \u2713 Linked records resolved`);
      }
      console.log(`[Phase 1: Fetch] Fetching Sheets data...`);
      const sheetData = await retryWithBackoff(
        () => getSheetData(sheetsAccessToken, spreadsheetId, sheetId),
        maxRetries,
        "fetch Sheets data"
      );
      checkpoint.sheetsRows = sheetData.values || [];
      if (idColumnIndex === 0) {
        const FIXED_ID_COLUMN_INDEX = 26;
        actualIdColumnIndex = FIXED_ID_COLUMN_INDEX;
        const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
        console.log(
          `[Phase 1: Fetch] Using fixed column ${columnLetter} (index ${actualIdColumnIndex}) for record IDs (will be hidden)`
        );
      }
      if (includeHeader && checkpoint.sheetsRows.length > 0) {
        checkpoint.sheetsRows = checkpoint.sheetsRows.slice(1);
      }
      console.log(`[Phase 1: Fetch] \u2713 Fetched ${checkpoint.sheetsRows.length} Sheets rows`);
      return {
        metadata: {
          airtableRecords: checkpoint.airtableRecords.length,
          sheetsRows: checkpoint.sheetsRows.length,
          fields: checkpoint.tableFields.length
        }
      };
    });
    result.phases.fetch = fetchPhase;
    if (fetchPhase.status === "FAILED") {
      result.status = "FAILED";
      return finalizeSyncResult(result, startTime);
    }
    const conflictDetectionPhase = await executePhase("conflictDetection", async () => {
      console.log(`
[Phase 2: Conflict Detection] Detecting changes and conflicts...`);
      checkpoint.conflictResults = detectConflicts(
        checkpoint.airtableRecords,
        checkpoint.sheetsRows,
        syncConfigId,
        actualIdColumnIndex
      );
      const summary = summarizeConflicts(checkpoint.conflictResults);
      console.log(`[Phase 2: Conflict Detection] ${summary.summary}`);
      if (checkpoint.conflictResults.conflicts.length > 0) {
        console.log(
          `[Phase 2: Conflict Detection] \u26A0\uFE0F  ${checkpoint.conflictResults.conflicts.length} conflicts detected`
        );
      }
      return {
        metadata: {
          conflicts: checkpoint.conflictResults.conflicts.length,
          airtableOnlyChanges: checkpoint.conflictResults.airtableOnlyChanges.length,
          sheetsOnlyChanges: checkpoint.conflictResults.sheetsOnlyChanges.length,
          newInAirtable: checkpoint.conflictResults.newInAirtable.length,
          newInSheets: checkpoint.conflictResults.newInSheets.length,
          noChanges: checkpoint.conflictResults.noChanges.length
        }
      };
    });
    result.phases.conflictDetection = conflictDetectionPhase;
    if (checkpoint.conflictResults && checkpoint.conflictResults.conflicts.length > 0) {
      const conflictResolutionPhase = await executePhase("conflictResolution", async () => {
        console.log(
          `
[Phase 3: Conflict Resolution] Resolving ${checkpoint.conflictResults.conflicts.length} conflicts...`
        );
        console.log(`[Phase 3: Conflict Resolution] Strategy: ${conflictResolution}`);
        checkpoint.conflictResolutions = resolveConflicts(
          checkpoint.conflictResults.conflicts,
          conflictResolution
        );
        const resolutionCounts = {
          USE_AIRTABLE: 0,
          USE_SHEETS: 0,
          DELETE: 0,
          SKIP: 0
        };
        checkpoint.conflictResolutions.forEach((resolution) => {
          resolutionCounts[resolution.action]++;
          console.log(
            `[Phase 3: Conflict Resolution]   ${resolution.recordId}: ${resolution.action} (${resolution.reason})`
          );
        });
        result.summary.conflicts.total = checkpoint.conflictResolutions.length;
        result.summary.conflicts.airtableWins = resolutionCounts.USE_AIRTABLE;
        result.summary.conflicts.sheetsWins = resolutionCounts.USE_SHEETS;
        result.summary.conflicts.deleted = resolutionCounts.DELETE;
        result.summary.conflicts.skipped = resolutionCounts.SKIP;
        return { metadata: resolutionCounts };
      });
      result.phases.conflictResolution = conflictResolutionPhase;
    } else {
      result.phases.conflictResolution.status = "SKIPPED";
      console.log(`
[Phase 3: Conflict Resolution] No conflicts to resolve`);
    }
    const airtableToSheetsPhase = await executePhase("airtableToSheets", async () => {
      console.log(`
[Phase 4: Airtable \u2192 Sheets] Syncing Airtable changes to Sheets...`);
      if (!checkpoint.conflictResults) {
        throw new Error("Conflict results not available");
      }
      const recordsToSync = /* @__PURE__ */ new Set([
        ...checkpoint.conflictResults.airtableOnlyChanges,
        ...checkpoint.conflictResults.newInAirtable
      ]);
      if (checkpoint.conflictResolutions) {
        checkpoint.conflictResolutions.forEach((resolution) => {
          if (resolution.action === "USE_AIRTABLE") {
            recordsToSync.add(resolution.recordId);
          }
        });
      }
      if (recordsToSync.size === 0) {
        console.log(`[Phase 4: Airtable \u2192 Sheets] No changes to sync`);
        return { metadata: { synced: 0 } };
      }
      console.log(`[Phase 4: Airtable \u2192 Sheets] Syncing ${recordsToSync.size} records...`);
      if (dryRun) {
        console.log(`[Phase 4: Airtable \u2192 Sheets] DRY RUN - Would sync ${recordsToSync.size} records`);
        return { metadata: { synced: recordsToSync.size, dryRun: true } };
      }
      const recordsToUpdate = checkpoint.airtableRecords.filter((r) => recordsToSync.has(r.id));
      let added = 0;
      let updated = 0;
      const phaseErrors = [];
      const rowsNeedingRecordIds = [];
      for (const record of recordsToUpdate) {
        try {
          const { row } = await airtableRecordToSheetsRow(record, checkpoint.tableFields, {
            accessToken: airtableAccessToken,
            baseId,
            tableId
          });
          const existingRowIndex = checkpoint.sheetsRows.findIndex(
            (r) => r[actualIdColumnIndex] === record.id
          );
          if (existingRowIndex >= 0) {
            const rowNumber = existingRowIndex + (includeHeader ? 2 : 1);
            await retryWithBackoff(
              () => updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, `A${rowNumber}`, [
                row
              ]),
              maxRetries,
              `update row ${rowNumber}`,
              { recordId: record.id, phase: "airtableToSheets" }
            );
            updated++;
            rowsNeedingRecordIds.push({ rowNumber, recordId: record.id });
          } else {
            await retryWithBackoff(
              () => appendRows(sheetsAccessToken, spreadsheetId, sheetId, [row]),
              maxRetries,
              `append row for ${record.id}`,
              { recordId: record.id, phase: "airtableToSheets" }
            );
            added++;
            const newRowNumber = checkpoint.sheetsRows.length + added + (includeHeader ? 1 : 0);
            rowsNeedingRecordIds.push({ rowNumber: newRowNumber, recordId: record.id });
          }
        } catch (error) {
          const syncError = classifyError(error, "airtableToSheets", record.id);
          phaseErrors.push(syncError);
          console.error(
            `[Phase 4: Airtable \u2192 Sheets] \u2717 Failed to sync record ${record.id}: ${syncError.message}`
          );
          if (syncError.type === "OAUTH") {
            throw error;
          }
        }
      }
      result.summary.airtableToSheets.added = added;
      result.summary.airtableToSheets.updated = updated;
      const totalAttempted = recordsToSync.size;
      const totalSuccessful = added + updated;
      const totalFailed = phaseErrors.length;
      if (totalFailed > 0) {
        console.log(
          `[Phase 4: Airtable \u2192 Sheets] \u26A0\uFE0F  Synced ${totalSuccessful}/${totalAttempted} records (${totalFailed} failed)`
        );
      } else {
        console.log(
          `[Phase 4: Airtable \u2192 Sheets] \u2713 Synced ${totalSuccessful} records (${added} added, ${updated} updated)`
        );
      }
      if ((added > 0 || updated > 0) && !dryRun) {
        try {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
          const requiredColumnCount = actualIdColumnIndex + 1;
          console.log(
            `[Phase 4: Airtable \u2192 Sheets] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
          );
          await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);
          console.log(
            `[Phase 4: Airtable \u2192 Sheets] Writing ${rowsNeedingRecordIds.length} record IDs to column ${columnLetter}...`
          );
          for (const { rowNumber, recordId } of rowsNeedingRecordIds) {
            const range = `${columnLetter}${rowNumber}`;
            try {
              await updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, range, [[recordId]]);
            } catch (error) {
              console.warn(
                `[Phase 4: Airtable \u2192 Sheets] Failed to write record ID to ${range}:`,
                error
              );
            }
          }
          console.log(`[Phase 4: Airtable \u2192 Sheets] \u2713 Wrote record IDs to column ${columnLetter}`);
          console.log(`[Phase 4: Airtable \u2192 Sheets] Hiding ID column ${columnLetter}...`);
          await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
          console.log(
            `[Phase 4: Airtable \u2192 Sheets] \u2713 Hidden column ${columnLetter} (users won't see record IDs)`
          );
        } catch (error) {
          console.warn("[Phase 4: Airtable \u2192 Sheets] Failed to write/hide ID column:", error);
        }
      }
      return {
        metadata: { added, updated, failed: totalFailed },
        errors: phaseErrors
      };
    });
    result.phases.airtableToSheets = airtableToSheetsPhase;
    const sheetsToAirtablePhase = await executePhase("sheetsToAirtable", async () => {
      console.log(`
[Phase 5: Sheets \u2192 Airtable] Syncing Sheets changes to Airtable...`);
      if (!checkpoint.conflictResults) {
        throw new Error("Conflict results not available");
      }
      const rowsToSync = /* @__PURE__ */ new Set();
      for (const id of checkpoint.conflictResults.sheetsOnlyChanges) {
        const rowIndex = checkpoint.sheetsRows.findIndex((r) => r[actualIdColumnIndex] === id);
        if (rowIndex >= 0) {
          rowsToSync.add(rowIndex);
        }
      }
      for (const item of checkpoint.conflictResults.newInSheets) {
        if (typeof item === "number" && item >= 0 && item < checkpoint.sheetsRows.length) {
          rowsToSync.add(item);
        }
      }
      if (checkpoint.conflictResolutions) {
        checkpoint.conflictResolutions.forEach((resolution) => {
          if (resolution.action === "USE_SHEETS") {
            const rowIndex = checkpoint.sheetsRows.findIndex(
              (r) => r[actualIdColumnIndex] === resolution.recordId
            );
            if (rowIndex >= 0) {
              rowsToSync.add(rowIndex);
            }
          }
        });
      }
      const validRows = Array.from(rowsToSync).filter((i) => i >= 0 && i < checkpoint.sheetsRows.length);
      if (validRows.length === 0) {
        console.log(`[Phase 5: Sheets \u2192 Airtable] No changes to sync`);
        return { metadata: { synced: 0 } };
      }
      console.log(`[Phase 5: Sheets \u2192 Airtable] Syncing ${validRows.length} rows...`);
      if (dryRun) {
        console.log(`[Phase 5: Sheets \u2192 Airtable] DRY RUN - Would sync ${validRows.length} rows`);
        return { metadata: { synced: validRows.length, dryRun: true } };
      }
      if (shouldResolveLinkedRecords) {
        const linkedFields = checkpoint.tableFields.filter((f) => f.type === "multipleRecordLinks");
        for (const field of linkedFields) {
          const linkedTableId = field.options?.linkedTableId;
          if (linkedTableId) {
            await preloadTableCache(airtableAccessToken, baseId, linkedTableId);
          }
        }
      }
      let added = 0;
      let updated = 0;
      const phaseErrors = [];
      const newRecordIdUpdates = [];
      const batchedRows = chunkArray(validRows, Math.min(batchSize, 10));
      for (const batchIndices of batchedRows) {
        const recordsToCreate = [];
        const recordsToUpdate = [];
        const rowMetadata = /* @__PURE__ */ new Map();
        for (const rowIndex of batchIndices) {
          try {
            const row = checkpoint.sheetsRows[rowIndex];
            const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : void 0;
            const dataRow = [...row];
            dataRow.splice(actualIdColumnIndex, 1);
            const { fields } = await sheetsRowToAirtableFields(dataRow, checkpoint.tableFields, {
              accessToken: airtableAccessToken,
              baseId,
              tableId
            });
            let matchedRecord;
            if (recordId) {
              matchedRecord = checkpoint.airtableRecords.find((r) => r.id === recordId);
            }
            if (!matchedRecord && !recordId && checkpoint.primaryFieldName && fields[checkpoint.primaryFieldName]) {
              const primaryValue = String(fields[checkpoint.primaryFieldName]).trim().toLowerCase();
              if (primaryValue) {
                matchedRecord = checkpoint.airtableRecords.find((r) => {
                  const recordPrimaryValue = r.fields[checkpoint.primaryFieldName];
                  return recordPrimaryValue && String(recordPrimaryValue).trim().toLowerCase() === primaryValue;
                });
                if (matchedRecord) {
                  console.log(
                    `[Phase 5: Sheets \u2192 Airtable] Matched row ${rowIndex} to existing record ${matchedRecord.id} by primary field "${checkpoint.primaryFieldName}"`
                  );
                }
              }
            }
            if (matchedRecord) {
              const updateIndex = recordsToUpdate.length;
              recordsToUpdate.push({ id: matchedRecord.id, fields });
              rowMetadata.set(updateIndex, { recordId: matchedRecord.id, rowIndex });
            } else {
              const createIndex = recordsToCreate.length;
              recordsToCreate.push({ fields });
              rowMetadata.set(createIndex, { rowIndex });
            }
          } catch (error) {
            const syncError = classifyError(error, "sheetsToAirtable", void 0, rowIndex);
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets \u2192 Airtable] \u2717 Failed to transform row ${rowIndex}: ${syncError.message}`
            );
          }
        }
        if (recordsToCreate.length > 0) {
          try {
            const created = await retryWithBackoff(
              () => createRecords(airtableAccessToken, baseId, tableId, recordsToCreate),
              maxRetries,
              "create records batch",
              { phase: "sheetsToAirtable" }
            );
            added += created.length;
            for (let i = 0; i < created.length; i++) {
              const createdRecord = created[i];
              const metadata = Array.from(rowMetadata.values())[i];
              if (metadata && !metadata.recordId && createdRecord.id) {
                const sheetRowNumber = metadata.rowIndex + (includeHeader ? 2 : 1);
                newRecordIdUpdates.push({ row: sheetRowNumber, recordId: createdRecord.id });
              }
            }
          } catch (error) {
            const syncError = classifyError(error, "sheetsToAirtable");
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets \u2192 Airtable] \u2717 Failed to create ${recordsToCreate.length} records: ${syncError.message}`
            );
            if (syncError.type === "OAUTH") {
              throw error;
            }
          }
        }
        if (recordsToUpdate.length > 0) {
          try {
            const updated_batch = await retryWithBackoff(
              () => updateRecords(airtableAccessToken, baseId, tableId, recordsToUpdate),
              maxRetries,
              "update records batch",
              { phase: "sheetsToAirtable" }
            );
            updated += updated_batch.length;
          } catch (error) {
            const syncError = classifyError(error, "sheetsToAirtable");
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets \u2192 Airtable] \u2717 Failed to update ${recordsToUpdate.length} records: ${syncError.message}`
            );
            if (syncError.type === "OAUTH") {
              throw error;
            }
          }
        }
      }
      result.summary.sheetsToAirtable.added = added;
      result.summary.sheetsToAirtable.updated = updated;
      const totalAttempted = validRows.length;
      const totalSuccessful = added + updated;
      const totalFailed = phaseErrors.length;
      if (totalFailed > 0) {
        console.log(
          `[Phase 5: Sheets \u2192 Airtable] \u26A0\uFE0F  Synced ${totalSuccessful}/${totalAttempted} records (${totalFailed} failed)`
        );
      } else {
        console.log(
          `[Phase 5: Sheets \u2192 Airtable] \u2713 Synced ${totalSuccessful} records (${added} added, ${updated} updated)`
        );
      }
      if (newRecordIdUpdates.length > 0 && !dryRun) {
        console.log(
          `[Phase 5: Sheets \u2192 Airtable] Writing ${newRecordIdUpdates.length} new record IDs back to Sheets...`
        );
        try {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
          const requiredColumnCount = actualIdColumnIndex + 1;
          console.log(
            `[Phase 5: Sheets \u2192 Airtable] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
          );
          await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);
          newRecordIdUpdates.sort((a, b) => a.row - b.row);
          const updatePromises = [];
          for (const update of newRecordIdUpdates) {
            const range = `${columnLetter}${update.row}`;
            updatePromises.push(
              updateSheetData(
                sheetsAccessToken,
                spreadsheetId,
                sheetId,
                range,
                [[update.recordId]]
              ).catch((error) => {
                console.warn(
                  `[Phase 5: Sheets \u2192 Airtable] Failed to write ID for row ${update.row}:`,
                  error
                );
              })
            );
            if (updatePromises.length >= 10) {
              await Promise.all(updatePromises);
              updatePromises.length = 0;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
          }
          console.log(
            `[Phase 5: Sheets \u2192 Airtable] \u2713 Successfully wrote ${newRecordIdUpdates.length} record IDs to column ${columnLetter}`
          );
          try {
            await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
            console.log(
              `[Phase 5: Sheets \u2192 Airtable] \u2713 Hidden column ${columnLetter} (users won't see record IDs)`
            );
          } catch (error) {
            console.warn("[Phase 5: Sheets \u2192 Airtable] Failed to hide ID column:", error);
          }
        } catch (error) {
          console.error("[Phase 5: Sheets \u2192 Airtable] Error writing IDs back to Sheets:", error);
        }
      }
      return {
        metadata: { added, updated, failed: totalFailed },
        errors: phaseErrors
      };
    });
    result.phases.sheetsToAirtable = sheetsToAirtablePhase;
    const stateUpdatePhase = await executePhase("stateUpdate", async () => {
      console.log(`
[Phase 6: State Update] Updating sync state...`);
      if (dryRun) {
        console.log(`[Phase 6: State Update] DRY RUN - Would update sync state`);
        return { metadata: { dryRun: true } };
      }
      const stateListOptions = {};
      if (viewId) {
        stateListOptions.view = viewId;
      } else if (checkpoint.primaryFieldName) {
        stateListOptions.sort = [{ field: checkpoint.primaryFieldName, direction: "asc" }];
      }
      const updatedRecords = await listRecords(airtableAccessToken, baseId, tableId, stateListOptions);
      const updatedSheetData = await getSheetData(sheetsAccessToken, spreadsheetId, sheetId);
      const updatedRows = (updatedSheetData.values || []).slice(includeHeader ? 1 : 0);
      updateSyncState(syncConfigId, updatedRecords, updatedRows, actualIdColumnIndex);
      result.lastSyncAt = /* @__PURE__ */ new Date();
      console.log(`[Phase 6: State Update] \u2713 Sync state updated`);
      return { metadata: { timestamp: result.lastSyncAt.toISOString() } };
    });
    result.phases.stateUpdate = stateUpdatePhase;
    const hasErrors = Object.values(result.phases).some((p) => p.errors.length > 0);
    const hasCriticalFailure = Object.values(result.phases).some((p) => p.status === "FAILED");
    if (hasCriticalFailure) {
      result.status = "FAILED";
    } else if (hasErrors) {
      result.status = "PARTIAL";
    } else {
      result.status = "SUCCESS";
    }
    Object.values(result.phases).forEach((phase) => {
      result.errors.push(...phase.errors);
      result.warnings.push(...phase.warnings);
    });
    console.log(`
${"=".repeat(80)}`);
    console.log(`[BidirectionalSync] Sync complete - Status: ${result.status}`);
    console.log(
      `[BidirectionalSync] Airtable \u2192 Sheets: ${result.summary.airtableToSheets.added} added, ${result.summary.airtableToSheets.updated} updated`
    );
    console.log(
      `[BidirectionalSync] Sheets \u2192 Airtable: ${result.summary.sheetsToAirtable.added} added, ${result.summary.sheetsToAirtable.updated} updated`
    );
    console.log(
      `[BidirectionalSync] Conflicts: ${result.summary.conflicts.total} resolved`
    );
    console.log(`[BidirectionalSync] Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    console.log(`${"=".repeat(80)}
`);
    const finalResult = finalizeSyncResult(result, startTime);
    await saveSyncResults(syncConfigId, finalResult);
    return finalResult;
  } catch (error) {
    console.error(`
[BidirectionalSync] Fatal error:`, error);
    console.error(`[BidirectionalSync] Error type:`, error?.constructor?.name);
    console.error(`[BidirectionalSync] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[BidirectionalSync] Error stack:`, error instanceof Error ? error.stack : "No stack trace");
    if (error && typeof error === "object") {
      console.error(`[BidirectionalSync] Error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
    result.status = "FAILED";
    const syncError = classifyError(error, "sync");
    result.errors.push(syncError);
    const finalResult = finalizeSyncResult(result, startTime);
    await saveSyncResults(syncConfigId, finalResult);
    return finalResult;
  }
}
function createPhaseResult(phase) {
  return {
    phase,
    status: "SUCCESS",
    duration: 0,
    errors: [],
    warnings: []
  };
}
async function executePhase(phaseName, fn) {
  const startTime = Date.now();
  const result = createPhaseResult(phaseName);
  try {
    const phaseResult = await fn();
    if (phaseResult.errors && phaseResult.errors.length > 0) {
      result.errors.push(...phaseResult.errors);
      result.status = "FAILED";
    }
    if (phaseResult.warnings && phaseResult.warnings.length > 0) {
      result.warnings.push(...phaseResult.warnings);
    }
    if (phaseResult.metadata) {
      result.metadata = phaseResult.metadata;
    }
  } catch (error) {
    result.status = "FAILED";
    result.errors.push({
      phase: phaseName,
      type: "UNKNOWN",
      message: `Phase failed: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error
    });
  }
  result.duration = Date.now() - startTime;
  return result;
}
function classifyError(error, phase, recordId, rowNumber) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  const oauthPatterns = [
    "invalid_grant",
    "refresh token",
    "revoked",
    "unauthorized",
    "invalid_client",
    "please reconnect",
    "needs reauthorization",
    "401",
    "authentication failed",
    "token expired"
  ];
  if (oauthPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: "OAuth token invalid or expired. Please reconnect your account.",
      type: "OAUTH",
      originalError: error,
      recoverable: false
    };
  }
  const rateLimitPatterns = ["rate limit", "quota", "429", "too many requests"];
  if (rateLimitPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: "API rate limit exceeded. Will retry with backoff.",
      type: "RATE_LIMIT",
      originalError: error,
      recoverable: true
    };
  }
  const networkPatterns = [
    "network",
    "econnrefused",
    "enotfound",
    "etimedout",
    "fetch failed",
    "socket",
    "connection",
    "dns"
  ];
  if (networkPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: "Network error. Will retry.",
      type: "NETWORK",
      originalError: error,
      recoverable: true
    };
  }
  const validationPatterns = [
    "invalid",
    "validation",
    "required field",
    "type mismatch",
    "schema",
    "format"
  ];
  if (validationPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: errorMessage,
      type: "VALIDATION",
      originalError: error,
      recoverable: false
    };
  }
  return {
    phase,
    recordId,
    rowNumber,
    message: errorMessage,
    type: "UNKNOWN",
    originalError: error,
    recoverable: true
  };
}
async function retryWithBackoff(fn, maxRetries, operation, context) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const syncError = classifyError(
        error,
        context?.phase || "retry",
        context?.recordId,
        context?.rowNumber
      );
      if (syncError.type === "OAUTH") {
        console.error(`[RetryBackoff] ${operation} failed with OAuth error - stopping retry`);
        throw lastError;
      }
      if (syncError.type === "VALIDATION") {
        console.error(`[RetryBackoff] ${operation} failed with validation error - stopping retry`);
        throw lastError;
      }
      if (attempt === maxRetries) break;
      const shouldRetry = syncError.type === "RATE_LIMIT" || syncError.type === "NETWORK";
      if (!shouldRetry && attempt > 0) {
        console.warn(`[RetryBackoff] ${operation} failed with non-retryable error type: ${syncError.type}`);
        break;
      }
      const baseDelay = syncError.type === "RATE_LIMIT" ? 2e3 : 1e3;
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 3e4) + Math.random() * 1e3;
      console.warn(
        `[RetryBackoff] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}) - ${syncError.type}, retrying in ${Math.round(delay)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function finalizeSyncResult(result, startTime) {
  result.duration = Date.now() - startTime;
  result.completedAt = /* @__PURE__ */ new Date();
  return result;
}
async function handleOAuthErrors(syncConfigId, errors) {
  const oauthErrors = errors.filter((e) => e.type === "OAUTH");
  if (oauthErrors.length === 0) return;
  try {
    const syncConfig = await dbClient.syncConfig.findUnique({
      where: { id: syncConfigId },
      select: { userId: true }
    });
    if (!syncConfig) {
      console.error(`[HandleOAuthErrors] SyncConfig ${syncConfigId} not found`);
      return;
    }
    const userId = syncConfig.userId;
    const now = /* @__PURE__ */ new Date();
    const errorMessage = "OAuth token invalid or expired during sync. Please reconnect.";
    const airtableConn = await dbClient.airtableConnection.findUnique({
      where: { userId }
    });
    if (airtableConn) {
      await dbClient.airtableConnection.update({
        where: { userId },
        data: {
          needsReauth: true,
          lastRefreshError: errorMessage,
          lastRefreshAttempt: now
        }
      });
      console.warn(`[HandleOAuthErrors] Marked Airtable connection for user ${userId} as needing reauth`);
    }
    const googleConn = await dbClient.googleSheetsConnection.findUnique({
      where: { userId }
    });
    if (googleConn) {
      await dbClient.googleSheetsConnection.update({
        where: { userId },
        data: {
          needsReauth: true,
          lastRefreshError: errorMessage,
          lastRefreshAttempt: now
        }
      });
      console.warn(`[HandleOAuthErrors] Marked Google connection for user ${userId} as needing reauth`);
    }
  } catch (error) {
    console.error(`[HandleOAuthErrors] Failed to mark connections as needing reauth:`, error);
  }
}
async function saveSyncResults(syncConfigId, result) {
  try {
    const now = /* @__PURE__ */ new Date();
    if (result.errors.some((e) => e.type === "OAUTH")) {
      await handleOAuthErrors(syncConfigId, result.errors);
    }
    let lastErrorMessage = null;
    let lastErrorAt = null;
    if (result.errors.length > 0) {
      lastErrorAt = now;
      const errorsByType = result.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {});
      const errorSummary = Object.entries(errorsByType).map(([type, count]) => {
        switch (type) {
          case "OAUTH":
            return "Authentication failed - please reconnect your account";
          case "RATE_LIMIT":
            return `Rate limit exceeded (${count} ${count === 1 ? "error" : "errors"})`;
          case "NETWORK":
            return `Network errors (${count} ${count === 1 ? "error" : "errors"})`;
          case "VALIDATION":
            return `Data validation errors (${count} ${count === 1 ? "error" : "errors"})`;
          default:
            return `${count} ${count === 1 ? "error" : "errors"}`;
        }
      }).join("; ");
      lastErrorMessage = errorSummary;
      const oauthError = result.errors.find((e) => e.type === "OAUTH");
      if (oauthError) {
        lastErrorMessage = "Authentication failed - please reconnect your account in Settings";
      }
    }
    await dbClient.syncConfig.update({
      where: { id: syncConfigId },
      data: {
        lastSyncAt: now,
        lastSyncStatus: result.status.toLowerCase(),
        lastErrorAt,
        lastErrorMessage
      }
    });
    console.log(`[SaveSyncResults] Updated SyncConfig ${syncConfigId} with status: ${result.status}`);
  } catch (error) {
    console.error(
      `[SaveSyncResults] Failed to save sync results for config ${syncConfigId}:`,
      error
    );
  }
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1e3;
const MAX_REFRESH_RETRIES = 3;
const REFRESH_RETRY_DELAY_MS = 1e3;
const REAUTH_ERROR_PATTERNS = [
  "invalid_grant",
  "refresh token",
  "revoked",
  "expired",
  "unauthorized",
  "invalid_client",
  "Please reconnect"
];
function isReauthError(error) {
  const lowerError = error.toLowerCase();
  return REAUTH_ERROR_PATTERNS.some((pattern) => lowerError.includes(pattern.toLowerCase()));
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isTokenExpiringSoon(expiryDate) {
  if (!expiryDate) {
    return true;
  }
  const now = Date.now();
  const expiryBuffer = now + TOKEN_EXPIRY_BUFFER_MS;
  return expiryDate.getTime() <= expiryBuffer;
}
async function markConnectionNeedsReauth(userId, type, errorMessage) {
  const timestamp = /* @__PURE__ */ new Date();
  try {
    if (type === "airtable") {
      await dbClient.airtableConnection.update({
        where: { userId },
        data: {
          lastRefreshError: errorMessage,
          lastRefreshAttempt: timestamp,
          needsReauth: true
        }
      });
    } else {
      await dbClient.googleSheetsConnection.update({
        where: { userId },
        data: {
          lastRefreshError: errorMessage,
          lastRefreshAttempt: timestamp,
          needsReauth: true
        }
      });
    }
    console.warn(`[TokenManager] Marked ${type} connection for user ${userId} as needing reauth: ${errorMessage}`);
  } catch (dbError) {
    console.error(`[TokenManager] Failed to mark ${type} connection as needing reauth:`, dbError);
  }
}
async function clearReauthFlag(userId, type) {
  try {
    if (type === "airtable") {
      await dbClient.airtableConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null
        }
      });
    } else {
      await dbClient.googleSheetsConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null
        }
      });
    }
    console.log(`[TokenManager] Cleared reauth flag for ${type} connection for user ${userId}`);
  } catch (dbError) {
    console.error(`[TokenManager] Failed to clear reauth flag:`, dbError);
  }
}
async function refreshAirtableTokenWithRetry(userId, refreshToken, retries = MAX_REFRESH_RETRIES) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[TokenManager] Attempting to refresh Airtable token for user ${userId} (attempt ${attempt}/${retries})`);
      const tokenResponse = await refreshAccessToken$1(refreshToken);
      await storeAirtableConnection(userId, tokenResponse, dbClient);
      await clearReauthFlag(userId, "airtable");
      console.log(`[TokenManager] \u2713 Successfully refreshed Airtable token for user ${userId}`);
      return {
        success: true,
        accessToken: tokenResponse.access_token,
        needsReauth: false
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage2 = lastError.message;
      console.error(`[TokenManager] \u2717 Failed to refresh Airtable token (attempt ${attempt}/${retries}):`, errorMessage2);
      if (isReauthError(errorMessage2)) {
        await markConnectionNeedsReauth(userId, "airtable", errorMessage2);
        return {
          success: false,
          error: errorMessage2,
          needsReauth: true
        };
      }
      if (attempt < retries) {
        await sleep(REFRESH_RETRY_DELAY_MS * attempt);
      }
    }
  }
  const errorMessage = lastError?.message || "Unknown error";
  await markConnectionNeedsReauth(userId, "airtable", `Failed after ${retries} attempts: ${errorMessage}`);
  return {
    success: false,
    error: errorMessage,
    needsReauth: true
  };
}
async function refreshGoogleTokenWithRetry(userId, refreshToken, retries = MAX_REFRESH_RETRIES) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[TokenManager] Attempting to refresh Google token for user ${userId} (attempt ${attempt}/${retries})`);
      const tokenResponse = await refreshAccessToken(refreshToken);
      await storeGoogleSheetsConnection(userId, tokenResponse, dbClient);
      await clearReauthFlag(userId, "google");
      console.log(`[TokenManager] \u2713 Successfully refreshed Google token for user ${userId}`);
      return {
        success: true,
        accessToken: tokenResponse.access_token,
        needsReauth: false
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage2 = lastError.message;
      console.error(`[TokenManager] \u2717 Failed to refresh Google token (attempt ${attempt}/${retries}):`, errorMessage2);
      if (isReauthError(errorMessage2)) {
        await markConnectionNeedsReauth(userId, "google", errorMessage2);
        return {
          success: false,
          error: errorMessage2,
          needsReauth: true
        };
      }
      if (attempt < retries) {
        await sleep(REFRESH_RETRY_DELAY_MS * attempt);
      }
    }
  }
  const errorMessage = lastError?.message || "Unknown error";
  await markConnectionNeedsReauth(userId, "google", `Failed after ${retries} attempts: ${errorMessage}`);
  return {
    success: false,
    error: errorMessage,
    needsReauth: true
  };
}
async function getValidAirtableToken(userId) {
  console.log(`[TokenManager] Getting valid Airtable token for user ${userId}`);
  const connection = await dbClient.airtableConnection.findUnique({
    where: { userId }
  });
  if (!connection) {
    throw new Error("Airtable connection not found. Please connect your Airtable account.");
  }
  if (connection.needsReauth) {
    throw new Error(
      `Airtable connection needs reauthorization. ${connection.lastRefreshError || "Please reconnect your Airtable account."}`
    );
  }
  if (isTokenExpiringSoon(connection.tokenExpiry)) {
    console.log(`[TokenManager] Airtable token expired or expiring soon, refreshing...`);
    if (!connection.refreshToken) {
      await markConnectionNeedsReauth(userId, "airtable", "No refresh token available");
      throw new Error("Airtable refresh token not found. Please reconnect your Airtable account.");
    }
    const refreshResult = await refreshAirtableTokenWithRetry(userId, connection.refreshToken);
    if (!refreshResult.success) {
      throw new Error(
        `Failed to refresh Airtable token: ${refreshResult.error}. Please reconnect your Airtable account.`
      );
    }
    return refreshResult.accessToken;
  }
  console.log(`[TokenManager] Airtable token still valid, returning cached token`);
  return decrypt(connection.accessToken);
}
async function getValidGoogleToken(userId) {
  console.log(`[TokenManager] Getting valid Google token for user ${userId}`);
  const connection = await dbClient.googleSheetsConnection.findUnique({
    where: { userId }
  });
  if (!connection) {
    throw new Error("Google Sheets connection not found. Please connect your Google account.");
  }
  if (connection.needsReauth) {
    throw new Error(
      `Google Sheets connection needs reauthorization. ${connection.lastRefreshError || "Please reconnect your Google account."}`
    );
  }
  if (isTokenExpiringSoon(connection.tokenExpiry)) {
    console.log(`[TokenManager] Google token expired or expiring soon, refreshing...`);
    if (!connection.refreshToken) {
      await markConnectionNeedsReauth(userId, "google", "No refresh token available");
      throw new Error("Google refresh token not found. Please reconnect your Google account.");
    }
    const refreshResult = await refreshGoogleTokenWithRetry(userId, connection.refreshToken);
    if (!refreshResult.success) {
      throw new Error(
        `Failed to refresh Google token: ${refreshResult.error}. Please reconnect your Google account.`
      );
    }
    return refreshResult.accessToken;
  }
  console.log(`[TokenManager] Google token still valid, returning cached token`);
  return decrypt(connection.accessToken);
}

const TRIAL_DURATION_DAYS = 14;
function calculateTrialEndDate(trialStartDate) {
  const endDate = new Date(trialStartDate);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
}
const PLAN_LIMITS = {
  [PaymentPlanId.Starter]: {
    maxSyncConfigs: 1,
    maxRecordsPerSync: 1e3,
    syncIntervalMinutes: 15,
    name: "Starter"
  },
  [PaymentPlanId.Pro]: {
    maxSyncConfigs: 3,
    maxRecordsPerSync: 5e3,
    syncIntervalMinutes: 5,
    name: "Pro"
  },
  [PaymentPlanId.Business]: {
    maxSyncConfigs: 10,
    maxRecordsPerSync: Number.MAX_SAFE_INTEGER,
    // Unlimited
    syncIntervalMinutes: 5,
    name: "Business"
  },
  // Annual plans have the same limits as monthly plans
  [PaymentPlanId.StarterAnnual]: {
    maxSyncConfigs: 1,
    maxRecordsPerSync: 1e3,
    syncIntervalMinutes: 15,
    name: "Starter"
  },
  [PaymentPlanId.ProAnnual]: {
    maxSyncConfigs: 3,
    maxRecordsPerSync: 5e3,
    syncIntervalMinutes: 5,
    name: "Pro"
  },
  [PaymentPlanId.BusinessAnnual]: {
    maxSyncConfigs: 10,
    maxRecordsPerSync: Number.MAX_SAFE_INTEGER,
    // Unlimited
    syncIntervalMinutes: 5,
    name: "Business"
  }
};
PLAN_LIMITS[PaymentPlanId.Pro];
function getTrialStatus(user) {
  if (user.subscriptionPlan && user.subscriptionStatus) {
    return { isOnTrial: false, trialExpired: false };
  }
  const trialStartDate = user.trialStartedAt || user.createdAt;
  const trialEndsAt = user.trialEndsAt || calculateTrialEndDate(trialStartDate);
  const now = /* @__PURE__ */ new Date();
  if (now < trialEndsAt) {
    const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
    return { isOnTrial: true, daysRemaining, trialEndsAt };
  }
  return { isOnTrial: false, trialExpired: true };
}
function getUserSubscriptionState(user) {
  if (user.subscriptionPlan && user.subscriptionStatus) {
    const plan = getUserPlan(user);
    const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "cancel_at_period_end";
    if (isActive) {
      return { type: "subscribed", plan, status: user.subscriptionStatus };
    } else {
      return { type: "subscription_inactive", plan, status: user.subscriptionStatus };
    }
  }
  const trialStatus = getTrialStatus(user);
  if (trialStatus.isOnTrial) {
    return {
      type: "trial_active",
      daysRemaining: trialStatus.daysRemaining,
      trialEndsAt: trialStatus.trialEndsAt
    };
  }
  return { type: "trial_expired" };
}
function getUserPlan(user) {
  if (!user.subscriptionPlan) {
    return PaymentPlanId.Pro;
  }
  const planMap = {
    "starter": PaymentPlanId.Starter,
    "pro": PaymentPlanId.Pro,
    "business": PaymentPlanId.Business,
    "starter-annual": PaymentPlanId.StarterAnnual,
    "pro-annual": PaymentPlanId.ProAnnual,
    "business-annual": PaymentPlanId.BusinessAnnual
  };
  return planMap[user.subscriptionPlan.toLowerCase()] || PaymentPlanId.Starter;
}
function isSubscriptionActive(user) {
  const state = getUserSubscriptionState(user);
  switch (state.type) {
    case "trial_active":
      return true;
    case "subscribed":
      return true;
    case "trial_expired":
      return false;
    // Trial expired, syncs should pause
    case "subscription_inactive":
      return false;
    default:
      return false;
  }
}
function getRequiredPlan(requiredLimit, limitType) {
  {
    if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Starter].maxSyncConfigs) {
      return PaymentPlanId.Starter;
    } else if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Pro].maxSyncConfigs) {
      return PaymentPlanId.Pro;
    } else {
      return PaymentPlanId.Business;
    }
  }
}
function getUserPlanLimits(user) {
  if (!isSubscriptionActive(user)) {
    return PLAN_LIMITS[PaymentPlanId.Starter];
  }
  const plan = getUserPlan(user);
  return PLAN_LIMITS[plan];
}
function checkSyncConfigLimit(user, currentSyncCount) {
  const limits = getUserPlanLimits(user);
  if (currentSyncCount >= limits.maxSyncConfigs) {
    getUserPlan(user);
    const requiredPlan = getRequiredPlan(currentSyncCount + 1);
    return {
      exceeded: true,
      limit: limits.maxSyncConfigs,
      current: currentSyncCount,
      requiredPlan,
      message: `You've reached your limit of ${limits.maxSyncConfigs} sync configuration${limits.maxSyncConfigs === 1 ? "" : "s"} on the ${limits.name} plan. Upgrade to ${PLAN_LIMITS[requiredPlan].name} to create more syncs.`
    };
  }
  return { exceeded: false };
}
function isApproachingRecordLimit(user, recordCount) {
  const limits = getUserPlanLimits(user);
  if (limits.maxRecordsPerSync === Number.MAX_SAFE_INTEGER) {
    return false;
  }
  return recordCount >= limits.maxRecordsPerSync * 0.8;
}
function shouldPauseSyncs(user) {
  const state = getUserSubscriptionState(user);
  return state.type === "trial_expired" || state.type === "subscription_inactive";
}
function getSyncPauseReason(user) {
  const state = getUserSubscriptionState(user);
  switch (state.type) {
    case "trial_expired":
      return "Your 14-day free trial has ended. Upgrade to a paid plan to resume syncing.";
    case "subscription_inactive":
      if (state.status === "past_due") {
        return "Your subscription payment is past due. Please update your payment method to resume syncing.";
      }
      return "Your subscription has been cancelled. Resubscribe to resume syncing.";
    default:
      return null;
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);
class ResendEmailSender {
  async send(email) {
    const fromEmail = email.from?.email || "noreply@basesync.app";
    const fromName = email.from?.name || "BaseSync";
    const from = `${fromName} <${fromEmail}>`;
    try {
      console.log(`[Resend HTTP API] Sending email to ${email.to}: ${email.subject}`);
      const { data, error } = await resend.emails.send({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
      if (error) {
        console.error("[Resend HTTP API] Error:", error);
        throw new Error(`Resend API error: ${error.message}`);
      }
      console.log(`[Resend HTTP API] \u2713 Email sent successfully:`, data?.id);
    } catch (error) {
      console.error("[Resend HTTP API] Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
const resendEmailSender = new ResendEmailSender();

function getApproachingLimitEmailContent({
  userName,
  limitType,
  currentUsage,
  limit,
  planName,
  upgradePlanName,
  upgradeUrl
}) {
  const percentage = Math.round(currentUsage / limit * 100);
  const limitTypeText = "records per sync" ;
  return {
    subject: "You're approaching your BaseSync limit",
    text: `Hi ${userName},

You've used ${percentage}% of your ${planName} plan limit.

Current usage: ${currentUsage.toLocaleString()} ${limitTypeText}
Plan limit: ${limit.toLocaleString()} ${limitTypeText}

To avoid any interruption to your syncs, consider upgrading to ${upgradePlanName}.

Upgrade now: ${upgradeUrl}

Thanks,
The BaseSync Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #f59e0b; margin-top: 0;">Heads up! You're approaching your limit</h2>

    <p>Hi ${userName},</p>

    <p>You've used <strong>${percentage}%</strong> of your ${planName} plan limit.</p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Current usage:</strong> ${currentUsage.toLocaleString()} ${limitTypeText}</p>
      <p style="margin: 10px 0 0 0;"><strong>Plan limit:</strong> ${limit.toLocaleString()} ${limitTypeText}</p>
    </div>

    <p>To avoid any interruption to your syncs, consider upgrading to <strong>${upgradePlanName}</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${upgradeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upgrade Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Your data is safe and your current syncs will continue working until you reach 100% of your limit.</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`
  };
}
function getLimitReachedEmailContent({
  userName,
  limitType,
  currentUsage,
  limit,
  planName,
  upgradePlanName,
  upgradeUrl
}) {
  const limitTypeText = limitType === "records" ? "records per sync" : "sync configurations";
  return {
    subject: "Your BaseSync sync has paused",
    text: `Hi ${userName},

Your sync has been paused because you've reached your ${planName} plan limit of ${limit.toLocaleString()} ${limitTypeText}.

Don't worry - your data is completely safe. Your existing syncs and all your data remain intact.

To resume syncing, upgrade to ${upgradePlanName}: ${upgradeUrl}

What happens now:
- Your data remains safe and unchanged
- You can still access your dashboard and view sync history
- Syncs will automatically resume once you upgrade

Thanks,
The BaseSync Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #ef4444; margin-top: 0;">Your sync has been paused</h2>

    <p>Hi ${userName},</p>

    <p>Your sync has been paused because you've reached your <strong>${planName}</strong> plan limit of <strong>${limit.toLocaleString()} ${limitTypeText}</strong>.</p>

    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600;">Don't worry - your data is completely safe.</p>
      <p style="margin: 10px 0 0 0;">Your existing syncs and all your data remain intact.</p>
    </div>

    <p>To resume syncing, upgrade to <strong>${upgradePlanName}</strong>:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${upgradeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upgrade to Resume</a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">What happens now:</h3>
    <ul style="color: #666;">
      <li>Your data remains safe and unchanged</li>
      <li>You can still access your dashboard and view sync history</li>
      <li>Syncs will automatically resume once you upgrade</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`
  };
}
function getTrialEndingSoonEmailContent({
  userName,
  daysRemaining,
  recordsSynced,
  syncConfigsCount,
  pricingUrl
}) {
  return {
    subject: `Your BaseSync trial ends in ${daysRemaining} days`,
    text: `Hi ${userName},

Your free trial ends in ${daysRemaining} days.

During your trial, you've:
- Synced ${recordsSynced.toLocaleString()} records
- Created ${syncConfigsCount} sync configuration${syncConfigsCount === 1 ? "" : "s"}

To keep your syncs running without interruption, choose a plan that fits your needs:

Starter ($9/mo): 1 sync, 1,000 records
Pro ($19/mo): 3 syncs, 5,000 records - MOST POPULAR
Business ($39/mo): 10 syncs, unlimited records

View pricing and upgrade: ${pricingUrl}

After your trial:
- Syncs will pause (no data is lost)
- You can upgrade anytime to resume

Thanks for trying BaseSync!
The BaseSync Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; margin-top: 0;">Your trial ends in ${daysRemaining} days</h2>

    <p>Hi ${userName},</p>

    <p>Your free trial is coming to an end. Here's what you've accomplished:</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${recordsSynced.toLocaleString()}</div>
          <div style="color: #666; font-size: 14px;">Records Synced</div>
        </div>
        <div>
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${syncConfigsCount}</div>
          <div style="color: #666; font-size: 14px;">Sync${syncConfigsCount === 1 ? "" : "s"} Created</div>
        </div>
      </div>
    </div>

    <p>To keep your syncs running without interruption, choose a plan that fits your needs:</p>

    <div style="margin: 25px 0;">
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
        <strong>Starter</strong> - $9/mo
        <span style="color: #666; float: right;">1 sync, 1,000 records</span>
      </div>
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 2px solid #667eea;">
        <strong>Pro</strong> - $19/mo
        <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">MOST POPULAR</span>
        <span style="color: #666; float: right;">3 syncs, 5,000 records</span>
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <strong>Business</strong> - $39/mo
        <span style="color: #666; float: right;">10 syncs, unlimited records</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${pricingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Choose Your Plan</a>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>After your trial:</strong> Syncs will pause but no data is lost. You can upgrade anytime to resume.</p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks for trying BaseSync!<br>The BaseSync Team</p>
  </div>
</body>
</html>`
  };
}
function getSyncFailedEmailContent({
  userName,
  syncName,
  errorMessage,
  dashboardUrl
}) {
  return {
    subject: `BaseSync: "${syncName}" sync failed`,
    text: `Hi ${userName},

Your sync "${syncName}" has failed.

Error: ${errorMessage}

Please check your dashboard for more details and to retry the sync: ${dashboardUrl}

Common causes:
- OAuth token expired - try reconnecting your Airtable or Google Sheets account
- Rate limit exceeded - the sync will automatically retry
- Field mapping issue - check if any fields have been renamed or deleted

Thanks,
The BaseSync Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #ef4444; margin-top: 0;">Sync Failed</h2>

    <p>Hi ${userName},</p>

    <p>Your sync <strong>"${syncName}"</strong> has failed.</p>

    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Error:</strong></p>
      <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 14px; color: #666;">${errorMessage}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Dashboard</a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">Common causes:</h3>
    <ul style="color: #666;">
      <li><strong>OAuth token expired</strong> - try reconnecting your Airtable or Google Sheets account</li>
      <li><strong>Rate limit exceeded</strong> - the sync will automatically retry</li>
      <li><strong>Field mapping issue</strong> - check if any fields have been renamed or deleted</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`
  };
}

const APP_URL = process.env.WASP_WEB_CLIENT_URL || "https://basesync.app";
const PRICING_URL = `${APP_URL}/pricing`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const EMAIL_COOLDOWN_HOURS = 24;
const emailTrackingCache = /* @__PURE__ */ new Map();
function getEmailTrackingKey(userId, emailType) {
  return `${userId}:${emailType}`;
}
function wasEmailRecentlySent(userId, emailType) {
  const key = getEmailTrackingKey(userId, emailType);
  const record = emailTrackingCache.get(key);
  if (!record) {
    return false;
  }
  const hoursSinceSent = (Date.now() - record.sentAt.getTime()) / (1e3 * 60 * 60);
  return hoursSinceSent < EMAIL_COOLDOWN_HOURS;
}
function markEmailSent(userId, emailType) {
  const key = getEmailTrackingKey(userId, emailType);
  emailTrackingCache.set(key, {
    userId,
    emailType,
    sentAt: /* @__PURE__ */ new Date()
  });
}
function getUserName(user) {
  return user.name || user.username || user.email?.split("@")[0] || "there";
}
function getUpgradePlan(currentPlan) {
  switch (currentPlan) {
    case PaymentPlanId.Starter:
      return { id: PaymentPlanId.Pro, name: "Pro" };
    case PaymentPlanId.Pro:
      return { id: PaymentPlanId.Business, name: "Business" };
    case PaymentPlanId.Business:
      return { id: PaymentPlanId.Business, name: "Business" };
    // Already highest
    default:
      return { id: PaymentPlanId.Pro, name: "Pro" };
  }
}
function getUserPlanId(user) {
  if (!user.subscriptionPlan) {
    return PaymentPlanId.Pro;
  }
  const planMap = {
    starter: PaymentPlanId.Starter,
    pro: PaymentPlanId.Pro,
    business: PaymentPlanId.Business
  };
  return planMap[user.subscriptionPlan.toLowerCase()] || PaymentPlanId.Starter;
}
async function sendApproachingLimitEmail(user, limitType, currentUsage) {
  const emailType = `approaching_${limitType}_limit`;
  if (wasEmailRecentlySent(user.id, emailType)) {
    console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
    return;
  }
  if (!user.email) {
    console.log(`Cannot send email to user ${user.id} - no email address`);
    return;
  }
  const planId = getUserPlanId(user);
  const limits = getUserPlanLimits(user);
  const upgradePlan = getUpgradePlan(planId);
  const limit = limits.maxRecordsPerSync ;
  const emailContent = getApproachingLimitEmailContent({
    userName: getUserName(user),
    limitType,
    currentUsage,
    limit,
    planName: limits.name,
    upgradePlanName: upgradePlan.name,
    upgradeUrl: PRICING_URL
  });
  try {
    await resendEmailSender.send({
      to: user.email,
      ...emailContent
    });
    markEmailSent(user.id, emailType);
    console.log(`Sent approaching limit email to user ${user.id} for ${limitType}`);
  } catch (error) {
    console.error(`Failed to send approaching limit email to user ${user.id}:`, error);
  }
}
async function sendLimitReachedEmail(user, limitType, currentUsage) {
  const emailType = `reached_${limitType}_limit`;
  if (wasEmailRecentlySent(user.id, emailType)) {
    console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
    return;
  }
  if (!user.email) {
    console.log(`Cannot send email to user ${user.id} - no email address`);
    return;
  }
  const planId = getUserPlanId(user);
  const limits = getUserPlanLimits(user);
  const upgradePlan = getUpgradePlan(planId);
  const limit = limits.maxRecordsPerSync ;
  const emailContent = getLimitReachedEmailContent({
    userName: getUserName(user),
    limitType,
    currentUsage,
    limit,
    planName: limits.name,
    upgradePlanName: upgradePlan.name,
    upgradeUrl: PRICING_URL
  });
  try {
    await resendEmailSender.send({
      to: user.email,
      ...emailContent
    });
    markEmailSent(user.id, emailType);
    console.log(`Sent limit reached email to user ${user.id} for ${limitType}`);
  } catch (error) {
    console.error(`Failed to send limit reached email to user ${user.id}:`, error);
  }
}
async function sendTrialEndingSoonEmail(user) {
  const emailType = "trial_ending_soon";
  if (wasEmailRecentlySent(user.id, emailType)) {
    console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
    return;
  }
  if (!user.email) {
    console.log(`Cannot send email to user ${user.id} - no email address`);
    return;
  }
  const trialStatus = getTrialStatus(user);
  if (!trialStatus.isOnTrial) {
    console.log(`User ${user.id} is not on trial, skipping email`);
    return;
  }
  const recordsSynced = await getTotalRecordsSynced(user.id);
  const syncConfigsCount = await dbClient.syncConfig.count({
    where: { userId: user.id }
  });
  const emailContent = getTrialEndingSoonEmailContent({
    userName: getUserName(user),
    daysRemaining: trialStatus.daysRemaining,
    recordsSynced,
    syncConfigsCount,
    pricingUrl: PRICING_URL
  });
  try {
    await resendEmailSender.send({
      to: user.email,
      ...emailContent
    });
    markEmailSent(user.id, emailType);
    console.log(`Sent trial ending soon email to user ${user.id} (${trialStatus.daysRemaining} days left)`);
  } catch (error) {
    console.error(`Failed to send trial ending soon email to user ${user.id}:`, error);
  }
}
async function sendSyncFailedEmail(user, syncName, errorMessage) {
  const emailType = `sync_failed_${syncName}`;
  if (wasEmailRecentlySent(user.id, emailType)) {
    console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
    return;
  }
  if (!user.email) {
    console.log(`Cannot send email to user ${user.id} - no email address`);
    return;
  }
  const emailContent = getSyncFailedEmailContent({
    userName: getUserName(user),
    syncName,
    errorMessage,
    dashboardUrl: DASHBOARD_URL
  });
  try {
    await resendEmailSender.send({
      to: user.email,
      ...emailContent
    });
    markEmailSent(user.id, emailType);
    console.log(`Sent sync failed email to user ${user.id} for sync "${syncName}"`);
  } catch (error) {
    console.error(`Failed to send sync failed email to user ${user.id}:`, error);
  }
}
async function checkAndSendTrialExpiringEmails() {
  console.log("Checking for trial users needing expiration emails...");
  const users = await dbClient.user.findMany({
    where: {
      subscriptionPlan: null,
      subscriptionStatus: null
    }
  });
  let emailsSent = 0;
  for (const user of users) {
    const trialStatus = getTrialStatus(user);
    if (trialStatus.isOnTrial && trialStatus.daysRemaining <= 3) {
      await sendTrialEndingSoonEmail(user);
      emailsSent++;
    }
  }
  console.log(`Sent ${emailsSent} trial expiring emails`);
}
async function checkAndSendUsageEmails(user, recordCount, currentSyncCount) {
  const limits = getUserPlanLimits(user);
  if (recordCount !== void 0 && limits.maxRecordsPerSync !== Number.MAX_SAFE_INTEGER) {
    const recordPercentage = recordCount / limits.maxRecordsPerSync * 100;
    if (recordPercentage >= 100) {
      await sendLimitReachedEmail(user, "records", recordCount);
    } else if (recordPercentage >= 80) {
      await sendApproachingLimitEmail(user, "records", recordCount);
    }
  }
}

function getMonthStart(date = /* @__PURE__ */ new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
async function getOrCreateMonthlyUsage(userId) {
  const monthStart = getMonthStart();
  let usage = await dbClient.usageStats.findUnique({
    where: {
      userId_month: {
        userId,
        month: monthStart
      }
    }
  });
  if (!usage) {
    usage = await dbClient.usageStats.create({
      data: {
        userId,
        month: monthStart,
        recordsSynced: 0,
        syncConfigsCreated: 0
      }
    });
  }
  return usage;
}
async function trackRecordsSynced(userId, count) {
  if (count <= 0) return;
  const monthStart = getMonthStart();
  await dbClient.usageStats.upsert({
    where: {
      userId_month: {
        userId,
        month: monthStart
      }
    },
    update: {
      recordsSynced: {
        increment: count
      },
      lastUpdatedAt: /* @__PURE__ */ new Date()
    },
    create: {
      userId,
      month: monthStart,
      recordsSynced: count,
      syncConfigsCreated: 0
    }
  });
}
async function trackSyncConfigCreated(userId) {
  const monthStart = getMonthStart();
  await dbClient.usageStats.upsert({
    where: {
      userId_month: {
        userId,
        month: monthStart
      }
    },
    update: {
      syncConfigsCreated: {
        increment: 1
      },
      lastUpdatedAt: /* @__PURE__ */ new Date()
    },
    create: {
      userId,
      month: monthStart,
      recordsSynced: 0,
      syncConfigsCreated: 1
    }
  });
}
async function getMonthlyUsage(userId) {
  const usage = await getOrCreateMonthlyUsage(userId);
  return {
    recordsSynced: usage.recordsSynced,
    syncConfigsCreated: usage.syncConfigsCreated,
    month: usage.month
  };
}
async function getTotalRecordsSynced(userId) {
  const result = await dbClient.usageStats.aggregate({
    where: {
      userId
    },
    _sum: {
      recordsSynced: true
    }
  });
  return result._sum.recordsSynced || 0;
}

const triggerManualSync$2 = async (args, context) => {
  const startTime = Date.now();
  const startedAt = /* @__PURE__ */ new Date();
  console.log("\n" + "=".repeat(80));
  console.log("[ManualSync] Manual sync triggered");
  console.log("[ManualSync] Config ID:", args.syncConfigId);
  console.log("[ManualSync] User:", context.user.email || context.user.username);
  console.log("[ManualSync] Time:", startedAt.toISOString());
  console.log("=".repeat(80) + "\n");
  if (!args.syncConfigId) {
    throw new HttpError(400, "syncConfigId is required");
  }
  if (typeof args.syncConfigId !== "string") {
    throw new HttpError(400, "syncConfigId must be a string");
  }
  let syncConfigForLogging = null;
  const logSyncError = async (errorMessage, errorType = "VALIDATION_ERROR") => {
    try {
      await context.entities.SyncLog.create({
        data: {
          syncConfigId: args.syncConfigId,
          status: "FAILED",
          recordsSynced: 0,
          recordsFailed: 1,
          errors: JSON.stringify([{ message: errorMessage, type: errorType }]),
          startedAt,
          completedAt: /* @__PURE__ */ new Date(),
          triggeredBy: "manual",
          direction: syncConfigForLogging?.syncDirection || "UNKNOWN"
        }
      });
      console.log("[ManualSync] Error logged to SyncLog:", errorMessage);
    } catch (logError) {
      console.error("[ManualSync] Failed to log error to SyncLog:", logError);
    }
  };
  console.log("[ManualSync] Fetching sync configuration...");
  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: args.syncConfigId },
    include: {
      user: {
        include: {
          airtableConnections: true,
          googleSheetsConnections: true
        }
      }
    }
  });
  if (!syncConfig) {
    console.error("[ManualSync] Sync config not found");
    throw new HttpError(404, "Sync configuration not found");
  }
  if (syncConfig.userId !== context.user.id) {
    console.error("[ManualSync] Unauthorized access attempt");
    throw new HttpError(403, "You do not have permission to access this sync configuration");
  }
  console.log("[ManualSync] Config found:", syncConfig.name);
  console.log("[ManualSync] Direction:", syncConfig.syncDirection);
  console.log("[ManualSync] Is active:", syncConfig.isActive);
  syncConfigForLogging = syncConfig;
  if (shouldPauseSyncs(syncConfig.user)) {
    const pauseReason = getSyncPauseReason(syncConfig.user);
    console.warn("[ManualSync] Syncs paused for user:", pauseReason);
    const errorMsg = pauseReason || "Your trial has expired or subscription is inactive. Please upgrade to continue syncing.";
    await logSyncError(errorMsg, "SUBSCRIPTION_REQUIRED");
    throw new HttpError(402, errorMsg);
  }
  if (!syncConfig.isActive) {
    console.warn("[ManualSync] Sync config is inactive");
    const errorMsg = "This sync configuration is inactive. Please activate it before running a manual sync.";
    await logSyncError(errorMsg, "INACTIVE_CONFIG");
    throw new HttpError(400, errorMsg);
  }
  const recentSync = await context.entities.SyncLog.findFirst({
    where: {
      syncConfigId: args.syncConfigId,
      startedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1e3)
        // Within last 5 minutes
      },
      completedAt: null
      // Still running
    },
    orderBy: { startedAt: "desc" }
  });
  if (recentSync) {
    console.warn("[ManualSync] Concurrent sync detected");
    throw new HttpError(
      409,
      "A sync is already in progress for this configuration. Please wait for it to complete."
    );
  }
  console.log("[ManualSync] Validating connections...");
  const airtableConnection = syncConfig.user.airtableConnections?.[0];
  const googleConnection = syncConfig.user.googleSheetsConnections?.[0];
  if (!airtableConnection) {
    console.error("[ManualSync] No Airtable connection found");
    const errorMsg = "Airtable connection not found. Please connect your Airtable account first.";
    await logSyncError(errorMsg, "MISSING_CONNECTION");
    throw new HttpError(400, errorMsg);
  }
  if (!googleConnection) {
    console.error("[ManualSync] No Google Sheets connection found");
    const errorMsg = "Google Sheets connection not found. Please connect your Google account first.";
    await logSyncError(errorMsg, "MISSING_CONNECTION");
    throw new HttpError(400, errorMsg);
  }
  console.log("[ManualSync] Connections validated");
  console.log("[ManualSync] Getting valid access tokens...");
  let airtableAccessToken;
  let sheetsAccessToken;
  try {
    airtableAccessToken = await getValidAirtableToken(context.user.id);
    console.log("[ManualSync] \u2713 Got valid Airtable token");
  } catch (error) {
    console.error("[ManualSync] Failed to get valid Airtable token:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to get Airtable access token. Please reconnect your Airtable account.";
    await logSyncError(errorMsg, "AIRTABLE_TOKEN_ERROR");
    throw new HttpError(401, errorMsg);
  }
  try {
    sheetsAccessToken = await getValidGoogleToken(context.user.id);
    console.log("[ManualSync] \u2713 Got valid Google Sheets token");
  } catch (error) {
    console.error("[ManualSync] Failed to get valid Google Sheets token:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to get Google Sheets access token. Please reconnect your Google account.";
    await logSyncError(errorMsg, "GOOGLE_TOKEN_ERROR");
    throw new HttpError(401, errorMsg);
  }
  let fieldMappings;
  if (syncConfig.fieldMappings) {
    try {
      fieldMappings = JSON.parse(syncConfig.fieldMappings);
      if (typeof fieldMappings !== "object" || fieldMappings === null) {
        throw new Error("Field mappings must be an object");
      }
      for (const [key, value] of Object.entries(fieldMappings)) {
        if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
          throw new Error(`Invalid column index for field "${key}": ${value}`);
        }
      }
    } catch (error) {
      console.error("[ManualSync] Invalid field mappings:", error);
      const errorMsg = `Invalid field mappings configuration: ${error instanceof Error ? error.message : "Unknown error"}`;
      await logSyncError(errorMsg, "FIELD_MAPPINGS_ERROR");
      throw new HttpError(400, errorMsg);
    }
  }
  console.log("[ManualSync] Executing sync...");
  let syncResult;
  let syncStatus = "SUCCESS";
  let errors = [];
  let warnings = [];
  let caughtError = null;
  try {
    switch (syncConfig.syncDirection) {
      // ----------------------------------------------------------------------
      // Airtable → Google Sheets
      // ----------------------------------------------------------------------
      case "AIRTABLE_TO_SHEETS": {
        console.log("[ManualSync] Running Airtable \u2192 Sheets sync...");
        syncResult = await syncAirtableToSheets({
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          viewId: syncConfig.airtableViewId,
          // Use view for exact order
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          fieldMappings,
          includeHeader: true,
          resolveLinkedRecords: true,
          idColumnIndex: 0,
          maxRetries: 3,
          batchSize: 100
        });
        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];
        syncStatus = errors.length === 0 ? "SUCCESS" : syncResult.added + syncResult.updated > 0 ? "PARTIAL" : "FAILED";
        break;
      }
      // ----------------------------------------------------------------------
      // Google Sheets → Airtable
      // ----------------------------------------------------------------------
      case "SHEETS_TO_AIRTABLE": {
        console.log("[ManualSync] Running Sheets \u2192 Airtable sync...");
        syncResult = await syncSheetsToAirtable({
          sheetsAccessToken,
          airtableAccessToken,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          fieldMappings,
          idColumnIndex: 0,
          skipHeaderRow: true,
          deleteExtraRecords: false,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: false,
          maxRetries: 3,
          batchSize: 10,
          validationMode: "lenient"
        });
        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];
        syncStatus = errors.length === 0 ? "SUCCESS" : syncResult.added + syncResult.updated > 0 ? "PARTIAL" : "FAILED";
        break;
      }
      // ----------------------------------------------------------------------
      // Bidirectional
      // ----------------------------------------------------------------------
      case "BIDIRECTIONAL": {
        console.log("[ManualSync] Running bidirectional sync...");
        syncResult = await syncBidirectional({
          syncConfigId: syncConfig.id,
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          viewId: syncConfig.airtableViewId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          conflictResolution: syncConfig.conflictResolution,
          fieldMappings,
          idColumnIndex: 0,
          includeHeader: true,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: false,
          maxRetries: 3,
          batchSize: 10,
          dryRun: false
        });
        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];
        syncStatus = syncResult.status;
        break;
      }
      // ----------------------------------------------------------------------
      // Unknown direction (should never happen)
      // ----------------------------------------------------------------------
      default: {
        console.error("[ManualSync] Unknown sync direction:", syncConfig.syncDirection);
        throw new HttpError(
          500,
          `Invalid sync direction: ${syncConfig.syncDirection}. Please contact support.`
        );
      }
    }
    console.log("[ManualSync] Sync execution completed");
    console.log("[ManualSync] Status:", syncStatus);
  } catch (error) {
    console.error("[ManualSync] Sync execution failed:", error);
    console.error("[ManualSync] Error stack:", error instanceof Error ? error.stack : "No stack");
    syncStatus = "FAILED";
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors = [
      {
        message: errorMessage,
        type: error instanceof HttpError ? "HTTP_ERROR" : "EXECUTION_ERROR"
      }
    ];
    syncResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      total: 0,
      errors,
      warnings: [],
      duration: Date.now() - startTime,
      startedAt,
      completedAt: /* @__PURE__ */ new Date()
    };
    if (error instanceof HttpError) {
      caughtError = error;
    }
  }
  console.log("[ManualSync] Updating sync metadata...");
  const completedAt = /* @__PURE__ */ new Date();
  const duration = Date.now() - startTime;
  try {
    await context.entities.SyncConfig.update({
      where: { id: syncConfig.id },
      data: {
        lastSyncAt: completedAt,
        lastSyncStatus: syncStatus.toLowerCase()
      }
    });
    await context.entities.SyncLog.create({
      data: {
        syncConfigId: syncConfig.id,
        status: syncStatus === "SUCCESS" ? "SUCCESS" : syncStatus === "PARTIAL" ? "PARTIAL" : "FAILED",
        recordsSynced: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : (syncResult?.added || 0) + (syncResult?.updated || 0),
        recordsFailed: errors.length,
        errors: errors.length > 0 ? JSON.stringify(
          errors.slice(0, 10).map((e) => ({
            message: e.message,
            recordId: e.recordId,
            type: e.type
          }))
        ) : null,
        startedAt,
        completedAt,
        triggeredBy: "manual",
        direction: syncConfig.syncDirection
      }
    });
    console.log("[ManualSync] Sync metadata updated");
    if (syncStatus === "SUCCESS" || syncStatus === "PARTIAL") {
      const recordsCount = syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : (syncResult?.added || 0) + (syncResult?.updated || 0);
      await trackRecordsSynced(context.user.id, recordsCount);
      if (isApproachingRecordLimit(context.user, recordsCount)) {
        warnings.push("You are approaching your monthly record limit for your plan. Consider upgrading to avoid sync interruptions.");
      }
    }
  } catch (error) {
    console.error("[ManualSync] Failed to update metadata:", error);
    warnings.push("Failed to update sync metadata in database");
  }
  console.log("[ManualSync] Building result...");
  let message;
  if (syncStatus === "SUCCESS") {
    message = "Sync completed successfully";
  } else if (syncStatus === "PARTIAL") {
    message = `Sync completed with ${errors.length} error(s)`;
  } else {
    message = "Sync failed";
  }
  const result = {
    status: syncStatus,
    message,
    details: {
      added: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) : syncResult?.added || 0,
      updated: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : syncResult?.updated || 0,
      deleted: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.deleted || 0) + (syncResult?.summary?.sheetsToAirtable?.deleted || 0) : syncResult?.deleted || 0,
      total: syncResult?.total || 0,
      errorCount: errors.length,
      duration,
      direction: syncConfig.syncDirection,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString()
    },
    errors: errors.length > 0 ? errors.slice(0, 20).map((e) => ({
      message: e.message,
      type: e.type,
      recordId: e.recordId
    })) : void 0,
    warnings: warnings.length > 0 ? warnings : void 0,
    conflicts: syncConfig.syncDirection === "BIDIRECTIONAL" ? syncResult?.summary?.conflicts : void 0
  };
  console.log("\n" + "=".repeat(80));
  console.log("[ManualSync] Manual sync completed");
  console.log("[ManualSync] Status:", syncStatus);
  console.log("[ManualSync] Duration:", duration, "ms");
  console.log("[ManualSync] Records: +", result.details.added, "\u21BB", result.details.updated, "-", result.details.deleted);
  if (errors.length > 0) {
    console.log("[ManualSync] Errors:", errors.length);
  }
  if (warnings.length > 0) {
    console.log("[ManualSync] Warnings:", warnings.length);
  }
  console.log("=".repeat(80) + "\n");
  if (caughtError) {
    throw caughtError;
  }
  return result;
};
const runInitialSync$2 = async (args, context) => {
  const startTime = Date.now();
  const startedAt = /* @__PURE__ */ new Date();
  console.log("\n" + "=".repeat(80));
  console.log("[InitialSync] Initial sync triggered");
  console.log("[InitialSync] Config ID:", args.syncConfigId);
  console.log("[InitialSync] Dry run:", args.dryRun || false);
  console.log("[InitialSync] User:", context.user.email || context.user.username);
  console.log("[InitialSync] Time:", startedAt.toISOString());
  console.log("=".repeat(80) + "\n");
  if (!args.syncConfigId) {
    throw new HttpError(400, "syncConfigId is required");
  }
  if (typeof args.syncConfigId !== "string") {
    throw new HttpError(400, "syncConfigId must be a string");
  }
  if (args.dryRun !== void 0 && typeof args.dryRun !== "boolean") {
    throw new HttpError(400, "dryRun must be a boolean");
  }
  console.log("[InitialSync] Fetching sync configuration...");
  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: args.syncConfigId },
    include: {
      user: {
        include: {
          airtableConnections: true,
          googleSheetsConnections: true
        }
      },
      syncLogs: {
        orderBy: { startedAt: "desc" },
        take: 1
      }
    }
  });
  if (!syncConfig) {
    console.error("[InitialSync] Sync config not found");
    throw new HttpError(404, "Sync configuration not found");
  }
  if (syncConfig.userId !== context.user.id) {
    console.error("[InitialSync] Unauthorized access attempt");
    throw new HttpError(
      403,
      "You do not have permission to access this sync configuration"
    );
  }
  console.log("[InitialSync] Config found:", syncConfig.name);
  console.log("[InitialSync] Direction:", syncConfig.syncDirection);
  console.log("[InitialSync] Previous syncs:", syncConfig.syncLogs.length);
  if (shouldPauseSyncs(syncConfig.user)) {
    const pauseReason = getSyncPauseReason(syncConfig.user);
    console.warn("[InitialSync] Syncs paused for user:", pauseReason);
    const errorMsg = pauseReason || "Your trial has expired or subscription is inactive. Please upgrade to continue syncing.";
    throw new HttpError(402, errorMsg);
  }
  const warnings = [];
  if (syncConfig.lastSyncAt) {
    const daysSinceLastSync = Math.floor(
      (Date.now() - syncConfig.lastSyncAt.getTime()) / (1e3 * 60 * 60 * 24)
    );
    console.warn(
      `[InitialSync] This sync config was last synced ${daysSinceLastSync} day(s) ago`
    );
    warnings.push(
      `This is not a first-time sync. Last sync was ${daysSinceLastSync} day(s) ago.`
    );
  }
  if (!syncConfig.isActive) {
    console.warn("[InitialSync] Sync config is inactive - will activate it");
    warnings.push("Sync configuration was inactive and has been activated.");
    await context.entities.SyncConfig.update({
      where: { id: args.syncConfigId },
      data: { isActive: true }
    });
  }
  console.log("[InitialSync] Validating connections...");
  const airtableConnection = syncConfig.user.airtableConnections?.[0];
  const googleConnection = syncConfig.user.googleSheetsConnections?.[0];
  if (!airtableConnection) {
    console.error("[InitialSync] No Airtable connection found");
    throw new HttpError(
      400,
      "Airtable connection not found. Please connect your Airtable account first."
    );
  }
  if (!googleConnection) {
    console.error("[InitialSync] No Google Sheets connection found");
    throw new HttpError(
      400,
      "Google Sheets connection not found. Please connect your Google account first."
    );
  }
  console.log("[InitialSync] Connections validated");
  console.log("[InitialSync] Getting valid access tokens...");
  let airtableAccessToken;
  let sheetsAccessToken;
  try {
    airtableAccessToken = await getValidAirtableToken(syncConfig.userId);
    console.log("[InitialSync] \u2713 Got valid Airtable token");
  } catch (error) {
    console.error("[InitialSync] Failed to get valid Airtable token:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to get Airtable access token. Please reconnect your Airtable account.";
    throw new HttpError(401, errorMsg);
  }
  try {
    sheetsAccessToken = await getValidGoogleToken(syncConfig.userId);
    console.log("[InitialSync] \u2713 Got valid Google Sheets token");
  } catch (error) {
    console.error("[InitialSync] Failed to get valid Google Sheets token:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to get Google Sheets access token. Please reconnect your Google account.";
    throw new HttpError(401, errorMsg);
  }
  let fieldMappings;
  if (syncConfig.fieldMappings) {
    try {
      fieldMappings = JSON.parse(syncConfig.fieldMappings);
      if (typeof fieldMappings !== "object" || fieldMappings === null) {
        throw new Error("Field mappings must be an object");
      }
      for (const [key, value] of Object.entries(fieldMappings)) {
        if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
          throw new Error(`Invalid column index for field "${key}": ${value}`);
        }
      }
    } catch (error) {
      console.error("[InitialSync] Invalid field mappings:", error);
      throw new HttpError(
        400,
        `Invalid field mappings configuration: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  console.log("[InitialSync] Executing initial sync...");
  console.log("[InitialSync] Dry run:", args.dryRun || false);
  let syncResult;
  let syncStatus = "SUCCESS";
  let errors = [];
  try {
    switch (syncConfig.syncDirection) {
      // ----------------------------------------------------------------------
      // Airtable → Google Sheets
      // ----------------------------------------------------------------------
      case "AIRTABLE_TO_SHEETS": {
        console.log("[InitialSync] Running Airtable \u2192 Sheets initial sync...");
        syncResult = await syncAirtableToSheets({
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          viewId: syncConfig.airtableViewId,
          // Use view for exact order
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          fieldMappings,
          includeHeader: true,
          resolveLinkedRecords: true,
          idColumnIndex: 0,
          maxRetries: 5,
          // More retries for large initial sync
          batchSize: 100
        });
        errors = syncResult.errors || [];
        warnings.push(...syncResult.warnings || []);
        syncStatus = errors.length === 0 ? "SUCCESS" : syncResult.added + syncResult.updated > 0 ? "PARTIAL" : "FAILED";
        break;
      }
      // ----------------------------------------------------------------------
      // Google Sheets → Airtable
      // ----------------------------------------------------------------------
      case "SHEETS_TO_AIRTABLE": {
        console.log("[InitialSync] Running Sheets \u2192 Airtable initial sync...");
        syncResult = await syncSheetsToAirtable({
          sheetsAccessToken,
          airtableAccessToken,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          fieldMappings,
          idColumnIndex: 0,
          skipHeaderRow: true,
          deleteExtraRecords: true,
          // For initial sync, clean up extra records
          resolveLinkedRecords: true,
          createMissingLinkedRecords: true,
          // Create linked records during initial sync
          maxRetries: 5,
          // More retries for large initial sync
          batchSize: 10,
          validationMode: "strict"
          // Stricter validation for initial sync
        });
        errors = syncResult.errors || [];
        warnings.push(...syncResult.warnings || []);
        syncStatus = errors.length === 0 ? "SUCCESS" : syncResult.added + syncResult.updated > 0 ? "PARTIAL" : "FAILED";
        break;
      }
      // ----------------------------------------------------------------------
      // Bidirectional
      // ----------------------------------------------------------------------
      case "BIDIRECTIONAL": {
        console.log("[InitialSync] Running bidirectional initial sync...");
        syncResult = await syncBidirectional({
          syncConfigId: syncConfig.id,
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          viewId: syncConfig.airtableViewId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          conflictResolution: syncConfig.conflictResolution,
          fieldMappings,
          idColumnIndex: 0,
          includeHeader: true,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: true,
          // Create linked records during initial sync
          maxRetries: 5,
          // More retries for large initial sync
          batchSize: 10,
          dryRun: args.dryRun || false
        });
        errors = syncResult.errors || [];
        warnings.push(...syncResult.warnings || []);
        syncStatus = syncResult.status;
        if (args.dryRun) {
          warnings.push(
            "This was a dry run. No actual changes were made. Run without dryRun flag to apply changes."
          );
        }
        break;
      }
      // ----------------------------------------------------------------------
      // Unknown direction
      // ----------------------------------------------------------------------
      default: {
        console.error("[InitialSync] Unknown sync direction:", syncConfig.syncDirection);
        throw new HttpError(
          500,
          `Invalid sync direction: ${syncConfig.syncDirection}. Please contact support.`
        );
      }
    }
    console.log("[InitialSync] Sync execution completed");
    console.log("[InitialSync] Status:", syncStatus);
  } catch (error) {
    console.error("[InitialSync] Sync execution failed:", error);
    syncStatus = "FAILED";
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors = [
      {
        message: errorMessage,
        type: "EXECUTION_ERROR"
      }
    ];
    if (error instanceof HttpError) {
      throw error;
    }
    syncResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      total: 0,
      errors,
      warnings,
      duration: Date.now() - startTime,
      startedAt,
      completedAt: /* @__PURE__ */ new Date()
    };
  }
  const completedAt = /* @__PURE__ */ new Date();
  const duration = Date.now() - startTime;
  if (!args.dryRun) {
    console.log("[InitialSync] Updating sync metadata...");
    try {
      await context.entities.SyncConfig.update({
        where: { id: syncConfig.id },
        data: {
          lastSyncAt: completedAt,
          lastSyncStatus: syncStatus.toLowerCase()
        }
      });
      await context.entities.SyncLog.create({
        data: {
          syncConfigId: syncConfig.id,
          status: syncStatus === "SUCCESS" ? "SUCCESS" : syncStatus === "PARTIAL" ? "PARTIAL" : "FAILED",
          recordsSynced: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : (syncResult?.added || 0) + (syncResult?.updated || 0),
          recordsFailed: errors.length,
          errors: errors.length > 0 ? JSON.stringify(
            errors.slice(0, 10).map((e) => ({
              message: e.message,
              recordId: e.recordId,
              type: e.type
            }))
          ) : null,
          startedAt,
          completedAt,
          triggeredBy: "initial",
          direction: syncConfig.syncDirection
        }
      });
      console.log("[InitialSync] Sync metadata updated");
    } catch (error) {
      console.error("[InitialSync] Failed to update metadata:", error);
      warnings.push("Failed to update sync metadata in database");
    }
  } else {
    console.log("[InitialSync] Skipping metadata update (dry run)");
  }
  console.log("[InitialSync] Building result...");
  let message;
  if (args.dryRun) {
    message = syncStatus === "SUCCESS" ? "Dry run completed successfully. No changes were made." : syncStatus === "PARTIAL" ? `Dry run completed with ${errors.length} potential error(s). No changes were made.` : "Dry run failed. No changes were made.";
  } else {
    message = syncStatus === "SUCCESS" ? "Initial sync completed successfully" : syncStatus === "PARTIAL" ? `Initial sync completed with ${errors.length} error(s)` : "Initial sync failed";
  }
  const result = {
    status: syncStatus,
    message,
    details: {
      added: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) : syncResult?.added || 0,
      updated: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : syncResult?.updated || 0,
      deleted: syncConfig.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.deleted || 0) + (syncResult?.summary?.sheetsToAirtable?.deleted || 0) : syncResult?.deleted || 0,
      total: syncResult?.total || 0,
      errorCount: errors.length,
      duration,
      direction: syncConfig.syncDirection,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString()
    },
    errors: errors.length > 0 ? errors.slice(0, 20).map((e) => ({
      message: e.message,
      type: e.type,
      recordId: e.recordId
    })) : void 0,
    warnings: warnings.length > 0 ? warnings : void 0,
    conflicts: syncConfig.syncDirection === "BIDIRECTIONAL" ? syncResult?.summary?.conflicts : void 0
  };
  console.log("\n" + "=".repeat(80));
  console.log("[InitialSync] Initial sync completed");
  console.log("[InitialSync] Dry run:", args.dryRun || false);
  console.log("[InitialSync] Status:", syncStatus);
  console.log("[InitialSync] Duration:", duration, "ms");
  console.log("[InitialSync] Records: +", result.details.added, "\u21BB", result.details.updated, "-", result.details.deleted);
  if (errors.length > 0) {
    console.log("[InitialSync] Errors:", errors.length);
  }
  if (warnings.length > 0) {
    console.log("[InitialSync] Warnings:", warnings.length);
  }
  console.log("=".repeat(80) + "\n");
  return result;
};

async function triggerManualSync$1(args, context) {
  return triggerManualSync$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog
    }
  });
}

var triggerManualSync = createAction(triggerManualSync$1);

async function runInitialSync$1(args, context) {
  return runInitialSync$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog
    }
  });
}

var runInitialSync = createAction(runInitialSync$1);

const createSyncConfig$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  if (!args.name || args.name.trim().length === 0) {
    throw new Error("Sync name is required");
  }
  if (!args.airtableBaseId || !args.airtableTableId) {
    throw new Error("Airtable base and table are required");
  }
  if (!args.googleSpreadsheetId || !args.googleSheetId) {
    throw new Error("Google Spreadsheet and Sheet are required");
  }
  if (!args.fieldMappings || Object.keys(args.fieldMappings).length === 0) {
    throw new Error("At least one field mapping is required");
  }
  if (!args.syncDirection) {
    throw new Error("Sync direction is required");
  }
  if (args.syncDirection === "BIDIRECTIONAL" && !args.conflictResolution) {
    throw new Error("Conflict resolution is required for bidirectional syncs");
  }
  const airtableConnection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!airtableConnection) {
    throw new Error(
      "Airtable account not connected. Please connect your Airtable account first."
    );
  }
  const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!googleConnection) {
    throw new Error(
      "Google account not connected. Please connect your Google account first."
    );
  }
  const currentSyncCount = await context.entities.SyncConfig.count({
    where: { userId: context.user.id }
  });
  const limitCheck = checkSyncConfigLimit(context.user, currentSyncCount);
  if (limitCheck.exceeded) {
    throw new Error(limitCheck.message);
  }
  try {
    const syncConfig = await context.entities.SyncConfig.create({
      data: {
        userId: context.user.id,
        name: args.name.trim(),
        airtableBaseId: args.airtableBaseId,
        airtableTableId: args.airtableTableId,
        airtableTableName: args.airtableTableName,
        airtableViewId: args.airtableViewId,
        // Store view ID for exact ordering
        googleSpreadsheetId: args.googleSpreadsheetId,
        googleSheetId: args.googleSheetId,
        googleSheetName: args.googleSheetName,
        fieldMappings: JSON.stringify(args.fieldMappings),
        syncDirection: args.syncDirection,
        conflictResolution: args.conflictResolution || "NEWEST_WINS",
        isActive: true
      }
    });
    console.log(`Created sync config: ${syncConfig.id} (${syncConfig.name})`);
    await trackSyncConfigCreated(context.user.id);
    return {
      id: syncConfig.id,
      name: syncConfig.name,
      isActive: syncConfig.isActive
    };
  } catch (error) {
    console.error("Failed to create sync configuration:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create sync configuration: ${error.message}`);
    }
    throw new Error("Failed to create sync configuration. Please try again.");
  }
};
const updateSyncConfig$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { syncConfigId, ...updates } = args;
  if (!syncConfigId) {
    throw new Error("Sync configuration ID is required");
  }
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId }
  });
  if (!existingConfig) {
    throw new Error("Sync configuration not found");
  }
  if (existingConfig.userId !== context.user.id) {
    throw new Error("You do not have permission to update this sync configuration");
  }
  const finalSyncDirection = updates.syncDirection || existingConfig.syncDirection;
  if (finalSyncDirection === "BIDIRECTIONAL") {
    const finalConflictResolution = updates.conflictResolution || existingConfig.conflictResolution;
    if (!finalConflictResolution) {
      throw new Error("Conflict resolution is required for bidirectional syncs");
    }
  }
  try {
    const updateData = {};
    if (updates.name !== void 0) {
      updateData.name = updates.name.trim();
    }
    if (updates.fieldMappings !== void 0) {
      if (Object.keys(updates.fieldMappings).length === 0) {
        throw new Error("At least one field mapping is required");
      }
      updateData.fieldMappings = JSON.stringify(updates.fieldMappings);
    }
    if (updates.syncDirection !== void 0) {
      updateData.syncDirection = updates.syncDirection;
    }
    if (updates.conflictResolution !== void 0) {
      updateData.conflictResolution = updates.conflictResolution;
    }
    const updatedConfig = await context.entities.SyncConfig.update({
      where: { id: syncConfigId },
      data: updateData
    });
    console.log(`Updated sync config: ${updatedConfig.id} (${updatedConfig.name})`);
    return {
      id: updatedConfig.id,
      name: updatedConfig.name,
      isActive: updatedConfig.isActive
    };
  } catch (error) {
    console.error("Failed to update sync configuration:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update sync configuration: ${error.message}`);
    }
    throw new Error("Failed to update sync configuration. Please try again.");
  }
};
const deleteSyncConfig$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { syncConfigId } = args;
  if (!syncConfigId) {
    throw new Error("Sync configuration ID is required");
  }
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId }
  });
  if (!existingConfig) {
    throw new Error("Sync configuration not found");
  }
  if (existingConfig.userId !== context.user.id) {
    throw new Error("You do not have permission to delete this sync configuration");
  }
  try {
    await context.entities.SyncConfig.delete({
      where: { id: syncConfigId }
    });
    console.log(`Deleted sync config: ${syncConfigId} (${existingConfig.name})`);
    return {
      success: true
    };
  } catch (error) {
    console.error("Failed to delete sync configuration:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete sync configuration: ${error.message}`);
    }
    throw new Error("Failed to delete sync configuration. Please try again.");
  }
};
const toggleSyncActive$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { syncConfigId, isActive } = args;
  if (!syncConfigId) {
    throw new Error("Sync configuration ID is required");
  }
  if (typeof isActive !== "boolean") {
    throw new Error("isActive must be a boolean value");
  }
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId }
  });
  if (!existingConfig) {
    throw new Error("Sync configuration not found");
  }
  if (existingConfig.userId !== context.user.id) {
    throw new Error("You do not have permission to modify this sync configuration");
  }
  try {
    const updatedConfig = await context.entities.SyncConfig.update({
      where: { id: syncConfigId },
      data: { isActive }
    });
    const statusText = isActive ? "resumed" : "paused";
    console.log(`Sync config ${statusText}: ${updatedConfig.id} (${updatedConfig.name})`);
    return {
      id: updatedConfig.id,
      isActive: updatedConfig.isActive
    };
  } catch (error) {
    console.error("Failed to toggle sync configuration status:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to toggle sync configuration: ${error.message}`);
    }
    throw new Error("Failed to toggle sync configuration. Please try again.");
  }
};

async function createSyncConfig$1(args, context) {
  return createSyncConfig$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var createSyncConfig = createAction(createSyncConfig$1);

async function updateSyncConfig$1(args, context) {
  return updateSyncConfig$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var updateSyncConfig = createAction(updateSyncConfig$1);

async function deleteSyncConfig$1(args, context) {
  return deleteSyncConfig$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog
    }
  });
}

var deleteSyncConfig = createAction(deleteSyncConfig$1);

async function toggleSyncActive$1(args, context) {
  return toggleSyncActive$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var toggleSyncActive = createAction(toggleSyncActive$1);

const runConnectionDiagnostics$2 = async (_args, context) => {
  const userId = context.user.id;
  const recommendations = [];
  console.log("[Diagnostics] Running connection diagnostics for user:", userId);
  const airtableConnection = await context.entities.AirtableConnection.findUnique({
    where: { userId }
  });
  const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId }
  });
  let airtableCanDecrypt = false;
  if (airtableConnection) {
    try {
      decrypt(airtableConnection.accessToken);
      decrypt(airtableConnection.refreshToken);
      airtableCanDecrypt = true;
    } catch (error) {
      console.error("[Diagnostics] Failed to decrypt Airtable tokens:", error);
      recommendations.push("Airtable tokens cannot be decrypted. Please reconnect your Airtable account.");
    }
    if (airtableConnection.needsReauth) {
      recommendations.push("Airtable connection is marked as needing reauth. Please reconnect.");
    }
    if (airtableConnection.tokenExpiry && new Date(airtableConnection.tokenExpiry) < /* @__PURE__ */ new Date()) {
      recommendations.push("Airtable token is expired. It should auto-refresh on next sync.");
    }
  } else {
    recommendations.push("No Airtable connection found. Please connect your Airtable account.");
  }
  let googleCanDecrypt = false;
  if (googleConnection) {
    try {
      decrypt(googleConnection.accessToken);
      decrypt(googleConnection.refreshToken);
      googleCanDecrypt = true;
    } catch (error) {
      console.error("[Diagnostics] Failed to decrypt Google tokens:", error);
      recommendations.push("Google Sheets tokens cannot be decrypted. Please reconnect your Google account.");
    }
    if (googleConnection.needsReauth) {
      recommendations.push("Google Sheets connection is marked as needing reauth. Please reconnect.");
    }
    if (googleConnection.tokenExpiry && new Date(googleConnection.tokenExpiry) < /* @__PURE__ */ new Date()) {
      recommendations.push("Google Sheets token is expired. It should auto-refresh on next sync.");
    }
  } else {
    recommendations.push("No Google Sheets connection found. Please connect your Google account.");
  }
  return {
    airtable: {
      connected: !!airtableConnection,
      needsReauth: airtableConnection?.needsReauth || false,
      tokenExpiry: airtableConnection?.tokenExpiry?.toISOString() || null,
      lastRefreshError: airtableConnection?.lastRefreshError || null,
      canDecryptTokens: airtableCanDecrypt
    },
    google: {
      connected: !!googleConnection,
      needsReauth: googleConnection?.needsReauth || false,
      tokenExpiry: googleConnection?.tokenExpiry?.toISOString() || null,
      lastRefreshError: googleConnection?.lastRefreshError || null,
      canDecryptTokens: googleCanDecrypt
    },
    recommendations
  };
};
const clearReauthFlags$2 = async (_args, context) => {
  const userId = context.user.id;
  console.log("[Diagnostics] Clearing reauth flags for user:", userId);
  try {
    const airtableConnection = await context.entities.AirtableConnection.findUnique({
      where: { userId }
    });
    if (airtableConnection) {
      await context.entities.AirtableConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null
        }
      });
      console.log("[Diagnostics] Cleared Airtable reauth flag");
    }
    const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId }
    });
    if (googleConnection) {
      await context.entities.GoogleSheetsConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null
        }
      });
      console.log("[Diagnostics] Cleared Google Sheets reauth flag");
    }
    return {
      success: true,
      message: "Cleared reauth flags for both connections. Try running a sync now."
    };
  } catch (error) {
    console.error("[Diagnostics] Failed to clear reauth flags:", error);
    throw new HttpError(500, "Failed to clear reauth flags");
  }
};

async function runConnectionDiagnostics$1(args, context) {
  return runConnectionDiagnostics$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var runConnectionDiagnostics = createAction(runConnectionDiagnostics$1);

async function clearReauthFlags$1(args, context) {
  return clearReauthFlags$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var clearReauthFlags = createAction(clearReauthFlags$1);

const getVerificationEmailContent = ({
  verificationLink
}) => ({
  subject: "Verify your email",
  text: `Click the link below to verify your email: ${verificationLink}`,
  html: `
        <p>Click the link below to verify your email</p>
        <a href="${verificationLink}">Verify email</a>
    `
});
const getPasswordResetEmailContent = ({
  passwordResetLink
}) => ({
  subject: "Password reset",
  text: `Click the link below to reset your password: ${passwordResetLink}`,
  html: `
        <p>Click the link below to reset your password</p>
        <a href="${passwordResetLink}">Reset password</a>
    `
});

const sendTestEmails$2 = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User must be authenticated");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Admin access required");
  }
  if (!args?.to) {
    throw new HttpError(400, "Missing destination email");
  }
  const appUrl = process.env.WASP_WEB_CLIENT_URL || "https://basesync.app";
  const emails = [
    getVerificationEmailContent({
      verificationLink: `${appUrl}/email-verification?token=test-token`
    }),
    getPasswordResetEmailContent({
      passwordResetLink: `${appUrl}/password-reset?token=test-token`
    }),
    getApproachingLimitEmailContent({
      userName: "Test User",
      limitType: "records",
      currentUsage: 800,
      limit: 1e3,
      planName: "Starter",
      upgradePlanName: "Pro",
      upgradeUrl: `${appUrl}/pricing`
    }),
    getLimitReachedEmailContent({
      userName: "Test User",
      limitType: "syncs",
      currentUsage: 3,
      limit: 3,
      planName: "Pro",
      upgradePlanName: "Business",
      upgradeUrl: `${appUrl}/pricing`
    }),
    getTrialEndingSoonEmailContent({
      userName: "Test User",
      daysRemaining: 3,
      recordsSynced: 12450,
      syncConfigsCount: 2,
      pricingUrl: `${appUrl}/pricing`
    }),
    getSyncFailedEmailContent({
      userName: "Test User",
      syncName: "Customer Sync",
      errorMessage: "Airtable token expired (simulated)",
      dashboardUrl: `${appUrl}/dashboard`
    })
  ];
  for (const content of emails) {
    await emailSender.send({
      to: args.to,
      ...content
    });
  }
  return { sent: emails.length };
};

async function sendTestEmails$1(args, context) {
  return sendTestEmails$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      UsageStats: dbClient.usageStats
    }
  });
}

var sendTestEmails = createAction(sendTestEmails$1);

async function getPaginatedUsers$1(args, context) {
  return getPaginatedUsers$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var getPaginatedUsers = createQuery(getPaginatedUsers$1);

async function exportUserData$1(args, context) {
  return exportUserData$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      UsageStats: dbClient.usageStats
    }
  });
}

var exportUserData = createQuery(exportUserData$1);

async function getCustomerPortalUrl$1(args, context) {
  return getCustomerPortalUrl$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var getCustomerPortalUrl = createQuery(getCustomerPortalUrl$1);

const getDailyStats$2 = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation"
    );
  }
  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation"
    );
  }
  const statsQuery = {
    orderBy: {
      date: "desc"
    },
    include: {
      sources: true
    }
  };
  const [dailyStats, weeklyStats] = await dbClient.$transaction([
    context.entities.DailyStats.findFirst(statsQuery),
    context.entities.DailyStats.findMany({ ...statsQuery, take: 7 })
  ]);
  if (!dailyStats) {
    console.log(
      "\x1B[34mNote: No daily stats have been generated by the dailyStatsJob yet. \x1B[0m"
    );
    return void 0;
  }
  return { dailyStats, weeklyStats };
};

async function getDailyStats$1(args, context) {
  return getDailyStats$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      DailyStats: dbClient.dailyStats
    }
  });
}

var getDailyStats = createQuery(getDailyStats$1);

async function getAdminOverviewStats$1(args, context) {
  return getAdminOverviewStats$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncLog: dbClient.syncLog,
      SyncConfig: dbClient.syncConfig,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var getAdminOverviewStats = createQuery(getAdminOverviewStats$1);

async function getRecentActivity$1(args, context) {
  return getRecentActivity$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncLog: dbClient.syncLog,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var getRecentActivity = createQuery(getRecentActivity$1);

async function searchUsers$1(args, context) {
  return searchUsers$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var searchUsers = createQuery(searchUsers$1);

async function getOnlineUsers$1(args, context) {
  return getOnlineUsers$2(args, {
    ...context,
    entities: {
      User: dbClient.user
    }
  });
}

var getOnlineUsers = createQuery(getOnlineUsers$1);

async function getUserDetail$1(args, context) {
  return getUserDetail$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection,
      GoogleSheetsConnection: dbClient.googleSheetsConnection,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog,
      UsageStats: dbClient.usageStats
    }
  });
}

var getUserDetail = createQuery(getUserDetail$1);

async function getActiveSyncs$1(args, context) {
  return getActiveSyncs$2(args, {
    ...context,
    entities: {
      SyncLog: dbClient.syncLog,
      SyncConfig: dbClient.syncConfig,
      User: dbClient.user
    }
  });
}

var getActiveSyncs = createQuery(getActiveSyncs$1);

async function getFailedSyncs$1(args, context) {
  return getFailedSyncs$2(args, {
    ...context,
    entities: {
      SyncLog: dbClient.syncLog,
      SyncConfig: dbClient.syncConfig,
      User: dbClient.user
    }
  });
}

var getFailedSyncs = createQuery(getFailedSyncs$1);

async function getSyncMonitor$1(args, context) {
  return getSyncMonitor$2(args, {
    ...context,
    entities: {
      SyncLog: dbClient.syncLog,
      SyncConfig: dbClient.syncConfig,
      User: dbClient.user
    }
  });
}

var getSyncMonitor = createQuery(getSyncMonitor$1);

async function getAirtableConnectionStatus$1(args, context) {
  return getAirtableConnectionStatus$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var getAirtableConnectionStatus = createQuery(getAirtableConnectionStatus$1);

const listUserAirtableBases$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Airtable account not connected. Please connect your Airtable account first."
    );
  }
  try {
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection
    );
    const bases = await listBases(accessToken);
    return bases.map((base) => ({
      id: base.id,
      name: base.name,
      permissionLevel: base.permissionLevel
    }));
  } catch (error) {
    console.error("Failed to list Airtable bases:", error);
    if (error instanceof Error) {
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Airtable connection has expired. Please reconnect your Airtable account."
        );
      }
      if (error.message.includes("AIRTABLE_CLIENT_ID")) {
        throw new Error("Airtable integration is not configured. Please contact support.");
      }
      throw new Error(`Failed to fetch Airtable bases: ${error.message}`);
    }
    throw new Error("Failed to fetch Airtable bases. Please try again.");
  }
};
const getAirtableTableSchema$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { baseId, tableId } = args;
  if (!baseId || !tableId) {
    throw new Error("Base ID and Table ID are required");
  }
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Airtable account not connected. Please connect your Airtable account first."
    );
  }
  try {
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection
    );
    const baseSchema = await getBaseSchema(accessToken, baseId);
    const table = baseSchema.tables.find((t) => t.id === tableId);
    if (!table) {
      throw new Error(`Table with ID "${tableId}" not found in base "${baseId}"`);
    }
    return {
      id: table.id,
      name: table.name,
      description: table.description,
      primaryFieldId: table.primaryFieldId,
      fields: table.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        description: field.description,
        options: field.options
      }))
    };
  } catch (error) {
    console.error("Failed to get Airtable table schema:", error);
    if (error instanceof Error) {
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Airtable connection has expired. Please reconnect your Airtable account."
        );
      }
      if (error.message.includes("not found")) {
        throw error;
      }
      if (error.message.includes("AIRTABLE_CLIENT_ID")) {
        throw new Error("Airtable integration is not configured. Please contact support.");
      }
      throw new Error(`Failed to fetch table schema: ${error.message}`);
    }
    throw new Error("Failed to fetch table schema. Please try again.");
  }
};
const getAirtableBaseTables$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { baseId } = args;
  if (!baseId) {
    throw new Error("Base ID is required");
  }
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Airtable account not connected. Please connect your Airtable account first."
    );
  }
  try {
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection
    );
    const baseSchema = await getBaseSchema(accessToken, baseId);
    return baseSchema.tables.map((table) => ({
      id: table.id,
      name: table.name,
      description: table.description,
      primaryFieldId: table.primaryFieldId
    }));
  } catch (error) {
    console.error("Failed to get Airtable base tables:", error);
    if (error instanceof Error) {
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Airtable connection has expired. Please reconnect your Airtable account."
        );
      }
      if (error.message.includes("AIRTABLE_CLIENT_ID")) {
        throw new Error("Airtable integration is not configured. Please contact support.");
      }
      throw new Error(`Failed to fetch base tables: ${error.message}`);
    }
    throw new Error("Failed to fetch base tables. Please try again.");
  }
};

async function listUserAirtableBases$1(args, context) {
  return listUserAirtableBases$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var listUserAirtableBases = createQuery(listUserAirtableBases$1);

async function getAirtableTableSchema$1(args, context) {
  return getAirtableTableSchema$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var getAirtableTableSchema = createQuery(getAirtableTableSchema$1);

async function getAirtableBaseTables$1(args, context) {
  return getAirtableBaseTables$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      AirtableConnection: dbClient.airtableConnection
    }
  });
}

var getAirtableBaseTables = createQuery(getAirtableBaseTables$1);

async function getGoogleConnectionStatus$1(args, context) {
  return getGoogleConnectionStatus$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var getGoogleConnectionStatus = createQuery(getGoogleConnectionStatus$1);

const MIN_SPREADSHEET_ID_LENGTH = 20;
function parseGoogleSheetUrl(url) {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL: URL must be a non-empty string");
  }
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error("Invalid URL: URL cannot be empty");
  }
  const spreadsheetIdPattern = new RegExp(`[a-zA-Z0-9_-]{${MIN_SPREADSHEET_ID_LENGTH},}`);
  const fullUrlMatch = trimmedUrl.match(
    new RegExp(`\\/spreadsheets\\/d\\/([a-zA-Z0-9_-]{${MIN_SPREADSHEET_ID_LENGTH},})(?:\\/|#|\\?|$)`, "i")
  );
  let spreadsheetId;
  if (fullUrlMatch && fullUrlMatch[1]) {
    spreadsheetId = fullUrlMatch[1];
  } else if (spreadsheetIdPattern.test(trimmedUrl) && !trimmedUrl.includes("/")) {
    spreadsheetId = trimmedUrl;
  } else {
    throw new Error(
      "Invalid Google Sheets URL: Could not extract spreadsheet ID. Please provide a valid Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/SPREADSHEET_ID) or just the spreadsheet ID itself."
    );
  }
  if (spreadsheetId.length < MIN_SPREADSHEET_ID_LENGTH) {
    throw new Error(
      "Invalid spreadsheet ID: ID appears too short. Please check that you copied the full URL or spreadsheet ID."
    );
  }
  let sheetId;
  const gidMatch = trimmedUrl.match(/[#&]gid=(\d+)/);
  if (gidMatch && gidMatch[1]) {
    const parsedGid = parseInt(gidMatch[1], 10);
    if (!isNaN(parsedGid)) {
      sheetId = parsedGid;
    }
  }
  return {
    spreadsheetId,
    ...sheetId !== void 0 && { sheetId }
  };
}

const validateSpreadsheetUrl$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { url } = args;
  if (!url || typeof url !== "string" || !url.trim()) {
    throw new Error("Please provide a valid Google Sheets URL");
  }
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Google account not connected. Please connect your Google account first."
    );
  }
  try {
    const parsed = parseGoogleSheetUrl(url.trim());
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection
    );
    const spreadsheet = await validateAndGetSpreadsheet(
      accessToken,
      parsed.spreadsheetId
    );
    return {
      spreadsheetId: spreadsheet.id,
      spreadsheetTitle: spreadsheet.title,
      sheets: spreadsheet.sheets
    };
  } catch (error) {
    console.error("Failed to validate Google Sheets URL:", error);
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.message.includes("Invalid") || error.message.includes("spreadsheet")) {
        throw new Error(
          "Invalid Google Sheets URL. Please check the URL and try again."
        );
      }
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Google connection has expired. Please reconnect your Google account."
        );
      }
      throw new Error("Failed to validate spreadsheet. Please check the URL and try again.");
    }
    throw new Error("Failed to validate spreadsheet. Please try again.");
  }
};
const getSpreadsheetSheets$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { spreadsheetId } = args;
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required");
  }
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Google account not connected. Please connect your Google account first."
    );
  }
  try {
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection
    );
    const metadata = await getSpreadsheet(accessToken, spreadsheetId);
    return {
      spreadsheetId: metadata.spreadsheetId,
      title: metadata.properties.title,
      spreadsheetUrl: metadata.spreadsheetUrl,
      sheets: metadata.sheets.map((sheet) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0,
        hidden: sheet.properties.hidden
      }))
    };
  } catch (error) {
    console.error("Failed to get spreadsheet sheets:", error);
    if (error instanceof GoogleSheetsError) {
      if (error.isAuthError) {
        throw new Error(
          "Your Google connection has expired or lacks permissions. Please reconnect your Google account."
        );
      }
      if (error.isQuotaError) {
        throw new Error(
          "Google API quota exceeded. Please try again later or contact support."
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Spreadsheet with ID "${spreadsheetId}" not found or you don't have access to it.`
        );
      }
      throw new Error(`Failed to fetch spreadsheet: ${error.message}`);
    }
    if (error instanceof Error) {
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Google connection has expired. Please reconnect your Google account."
        );
      }
      if (error.message.includes("not found")) {
        throw error;
      }
      if (error.message.includes("GOOGLE_SHEETS_CLIENT_ID")) {
        throw new Error("Google Sheets integration is not configured. Please contact support.");
      }
      throw new Error(`Failed to fetch spreadsheet: ${error.message}`);
    }
    throw new Error("Failed to fetch spreadsheet. Please try again.");
  }
};
const getSheetColumnHeaders$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { spreadsheetId, sheetId } = args;
  if (!spreadsheetId || sheetId === void 0) {
    throw new Error("Spreadsheet ID and Sheet ID are required");
  }
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id }
  });
  if (!connection) {
    throw new Error(
      "Google account not connected. Please connect your Google account first."
    );
  }
  try {
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection
    );
    const sheetData = await getSheetData(
      accessToken,
      spreadsheetId,
      sheetId,
      "A1:ZZ1"
      // Get first row, up to column ZZ (702 columns)
    );
    const headers = sheetData.values?.[0] || [];
    const metadata = await getSpreadsheet(accessToken, spreadsheetId);
    const sheet = typeof sheetId === "number" ? metadata.sheets.find((s) => s.properties.sheetId === sheetId) : metadata.sheets.find((s) => s.properties.title === sheetId);
    const columnCount = sheet?.properties.gridProperties?.columnCount || headers.length;
    const finalHeaders = headers.length > 0 ? headers.map((h, i) => h || columnNumberToLetter(i + 1)) : Array.from({ length: columnCount }, (_, i) => columnNumberToLetter(i + 1));
    return {
      headers: finalHeaders.slice(0, columnCount),
      columnCount
    };
  } catch (error) {
    console.error("Failed to get sheet column headers:", error);
    if (error instanceof GoogleSheetsError) {
      if (error.isAuthError) {
        throw new Error(
          "Your Google connection has expired or lacks permissions. Please reconnect your Google account."
        );
      }
      if (error.isQuotaError) {
        throw new Error(
          "Google API quota exceeded. Please try again later or contact support."
        );
      }
      throw new Error(`Failed to fetch column headers: ${error.message}`);
    }
    if (error instanceof Error) {
      if (error.message.includes("refresh") || error.message.includes("token")) {
        throw new Error(
          "Your Google connection has expired. Please reconnect your Google account."
        );
      }
      throw new Error(`Failed to fetch column headers: ${error.message}`);
    }
    throw new Error("Failed to fetch column headers. Please try again.");
  }
};

async function validateSpreadsheetUrl$1(args, context) {
  return validateSpreadsheetUrl$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var validateSpreadsheetUrl = createQuery(validateSpreadsheetUrl$1);

async function getSpreadsheetSheets$1(args, context) {
  return getSpreadsheetSheets$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var getSpreadsheetSheets = createQuery(getSpreadsheetSheets$1);

async function getSheetColumnHeaders$1(args, context) {
  return getSheetColumnHeaders$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      GoogleSheetsConnection: dbClient.googleSheetsConnection
    }
  });
}

var getSheetColumnHeaders = createQuery(getSheetColumnHeaders$1);

const getUserSyncConfigs$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const syncConfigs = await context.entities.SyncConfig.findMany({
      where: {
        userId: context.user.id
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
    return syncConfigs.map((config) => ({
      id: config.id,
      name: config.name,
      airtableBaseId: config.airtableBaseId,
      airtableTableId: config.airtableTableId,
      airtableTableName: config.airtableTableName,
      googleSpreadsheetId: config.googleSpreadsheetId,
      googleSheetId: config.googleSheetId,
      googleSheetName: config.googleSheetName,
      fieldMappings: JSON.parse(config.fieldMappings),
      syncDirection: config.syncDirection,
      conflictResolution: config.conflictResolution,
      isActive: config.isActive,
      lastSyncAt: config.lastSyncAt,
      lastSyncStatus: config.lastSyncStatus,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));
  } catch (error) {
    console.error("Failed to fetch sync configurations:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch sync configurations: ${error.message}`);
    }
    throw new Error("Failed to fetch sync configurations. Please try again.");
  }
};
const getSyncConfigById$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { syncConfigId } = args;
  if (!syncConfigId) {
    throw new Error("Sync configuration ID is required");
  }
  try {
    const syncConfig = await context.entities.SyncConfig.findUnique({
      where: {
        id: syncConfigId
      }
    });
    if (!syncConfig) {
      throw new Error("Sync configuration not found");
    }
    if (syncConfig.userId !== context.user.id) {
      throw new Error("You do not have permission to view this sync configuration");
    }
    return {
      id: syncConfig.id,
      name: syncConfig.name,
      airtableBaseId: syncConfig.airtableBaseId,
      airtableTableId: syncConfig.airtableTableId,
      airtableTableName: syncConfig.airtableTableName,
      googleSpreadsheetId: syncConfig.googleSpreadsheetId,
      googleSheetId: syncConfig.googleSheetId,
      googleSheetName: syncConfig.googleSheetName,
      fieldMappings: JSON.parse(syncConfig.fieldMappings),
      syncDirection: syncConfig.syncDirection,
      conflictResolution: syncConfig.conflictResolution,
      isActive: syncConfig.isActive,
      lastSyncAt: syncConfig.lastSyncAt,
      lastSyncStatus: syncConfig.lastSyncStatus,
      createdAt: syncConfig.createdAt,
      updatedAt: syncConfig.updatedAt
    };
  } catch (error) {
    console.error("Failed to fetch sync configuration:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("permission")) {
        throw error;
      }
      throw new Error(`Failed to fetch sync configuration: ${error.message}`);
    }
    throw new Error("Failed to fetch sync configuration. Please try again.");
  }
};
const getSyncLogs$2 = async (args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  const { syncConfigId, limit = 50 } = args;
  if (!syncConfigId) {
    throw new Error("Sync configuration ID is required");
  }
  try {
    const syncConfig = await context.entities.SyncConfig.findUnique({
      where: { id: syncConfigId }
    });
    if (!syncConfig) {
      throw new Error("Sync configuration not found");
    }
    if (syncConfig.userId !== context.user.id) {
      throw new Error("You do not have permission to view logs for this sync configuration");
    }
    const logs = await context.entities.SyncLog.findMany({
      where: {
        syncConfigId
      },
      orderBy: {
        startedAt: "desc"
      },
      take: limit
    });
    return logs.map((log) => ({
      id: log.id,
      syncConfigId: log.syncConfigId,
      status: log.status,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      recordsSynced: log.recordsSynced || 0,
      recordsFailed: log.recordsFailed || 0,
      errors: log.errors,
      triggeredBy: log.triggeredBy,
      direction: log.direction
    }));
  } catch (error) {
    console.error("Failed to fetch sync logs:", error);
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("permission")) {
        throw error;
      }
      throw new Error(`Failed to fetch sync logs: ${error.message}`);
    }
    throw new Error("Failed to fetch sync logs. Please try again.");
  }
};

async function getUserSyncConfigs$1(args, context) {
  return getUserSyncConfigs$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var getUserSyncConfigs = createQuery(getUserSyncConfigs$1);

async function getSyncConfigById$1(args, context) {
  return getSyncConfigById$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig
    }
  });
}

var getSyncConfigById = createQuery(getSyncConfigById$1);

async function getSyncLogs$1(args, context) {
  return getSyncLogs$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig,
      SyncLog: dbClient.syncLog
    }
  });
}

var getSyncLogs = createQuery(getSyncLogs$1);

const getUserUsage$2 = async (_args, context) => {
  if (!context.user) {
    throw new Error("User must be authenticated");
  }
  try {
    const limits = getUserPlanLimits(context.user);
    const subscriptionState = getUserSubscriptionState(context.user);
    const syncsPaused = shouldPauseSyncs(context.user);
    const syncPauseReason = getSyncPauseReason(context.user);
    const syncConfigCount = await context.entities.SyncConfig.count({
      where: {
        userId: context.user.id
      }
    });
    const monthlyUsage = await getMonthlyUsage(context.user.id);
    let frontendState;
    switch (subscriptionState.type) {
      case "trial_active":
        frontendState = {
          type: "trial_active",
          daysRemaining: subscriptionState.daysRemaining,
          trialEndsAt: subscriptionState.trialEndsAt
        };
        break;
      case "trial_expired":
        frontendState = { type: "trial_expired" };
        break;
      case "subscribed":
        frontendState = {
          type: "subscribed",
          plan: limits.name,
          status: subscriptionState.status
        };
        break;
      case "subscription_inactive":
        frontendState = {
          type: "subscription_inactive",
          plan: limits.name,
          status: subscriptionState.status
        };
        break;
      default:
        frontendState = { type: "trial_expired" };
    }
    return {
      syncConfigCount,
      maxSyncConfigs: limits.maxSyncConfigs,
      recordsSyncedThisMonth: monthlyUsage.recordsSynced,
      maxRecordsPerSync: limits.maxRecordsPerSync,
      syncIntervalMinutes: limits.syncIntervalMinutes,
      planName: limits.name,
      month: monthlyUsage.month,
      subscriptionState: frontendState,
      syncsPaused,
      syncPauseReason,
      trialDurationDays: TRIAL_DURATION_DAYS
    };
  } catch (error) {
    console.error("Failed to fetch user usage:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch usage statistics: ${error.message}`);
    }
    throw new Error("Failed to fetch usage statistics. Please try again.");
  }
};

async function getUserUsage$1(args, context) {
  return getUserUsage$2(args, {
    ...context,
    entities: {
      User: dbClient.user,
      SyncConfig: dbClient.syncConfig,
      UsageStats: dbClient.usageStats
    }
  });
}

var getUserUsage = createQuery(getUserUsage$1);

const router$4 = express.Router();
router$4.post("/update-is-user-admin-by-id", auth, updateIsUserAdminById);
router$4.post("/update-username", auth, updateUsername);
router$4.post("/request-email-change", auth, requestEmailChange);
router$4.post("/confirm-email-change", auth, confirmEmailChange);
router$4.post("/update-notification-preferences", auth, updateNotificationPreferences);
router$4.post("/change-password", auth, changePassword);
router$4.post("/delete-account", auth, deleteAccount);
router$4.post("/generate-checkout-session", auth, generateCheckoutSession);
router$4.post("/update-user", auth, updateUser);
router$4.post("/delete-user", auth, deleteUser);
router$4.post("/pause-resume-sync", auth, pauseResumeSync);
router$4.post("/trigger-manual-sync-admin", auth, triggerManualSyncAdmin);
router$4.post("/force-refresh-user-token", auth, forceRefreshUserToken);
router$4.post("/initiate-airtable-auth", auth, initiateAirtableAuth);
router$4.post("/complete-airtable-auth", auth, completeAirtableAuth);
router$4.post("/disconnect-airtable", auth, disconnectAirtable);
router$4.post("/initiate-google-auth", auth, initiateGoogleAuth);
router$4.post("/complete-google-auth", auth, completeGoogleAuth);
router$4.post("/disconnect-google", auth, disconnectGoogle);
router$4.post("/trigger-manual-sync", auth, triggerManualSync);
router$4.post("/run-initial-sync", auth, runInitialSync);
router$4.post("/create-sync-config", auth, createSyncConfig);
router$4.post("/update-sync-config", auth, updateSyncConfig);
router$4.post("/delete-sync-config", auth, deleteSyncConfig);
router$4.post("/toggle-sync-active", auth, toggleSyncActive);
router$4.post("/run-connection-diagnostics", auth, runConnectionDiagnostics);
router$4.post("/clear-reauth-flags", auth, clearReauthFlags);
router$4.post("/send-test-emails", auth, sendTestEmails);
router$4.post("/get-paginated-users", auth, getPaginatedUsers);
router$4.post("/export-user-data", auth, exportUserData);
router$4.post("/get-customer-portal-url", auth, getCustomerPortalUrl);
router$4.post("/get-daily-stats", auth, getDailyStats);
router$4.post("/get-admin-overview-stats", auth, getAdminOverviewStats);
router$4.post("/get-recent-activity", auth, getRecentActivity);
router$4.post("/search-users", auth, searchUsers);
router$4.post("/get-online-users", auth, getOnlineUsers);
router$4.post("/get-user-detail", auth, getUserDetail);
router$4.post("/get-active-syncs", auth, getActiveSyncs);
router$4.post("/get-failed-syncs", auth, getFailedSyncs);
router$4.post("/get-sync-monitor", auth, getSyncMonitor);
router$4.post("/get-airtable-connection-status", auth, getAirtableConnectionStatus);
router$4.post("/list-user-airtable-bases", auth, listUserAirtableBases);
router$4.post("/get-airtable-table-schema", auth, getAirtableTableSchema);
router$4.post("/get-airtable-base-tables", auth, getAirtableBaseTables);
router$4.post("/get-google-connection-status", auth, getGoogleConnectionStatus);
router$4.post("/validate-spreadsheet-url", auth, validateSpreadsheetUrl);
router$4.post("/get-spreadsheet-sheets", auth, getSpreadsheetSheets);
router$4.post("/get-sheet-column-headers", auth, getSheetColumnHeaders);
router$4.post("/get-user-sync-configs", auth, getUserSyncConfigs);
router$4.post("/get-sync-config-by-id", auth, getSyncConfigById);
router$4.post("/get-sync-logs", auth, getSyncLogs);
router$4.post("/get-user-usage", auth, getUserUsage);

const _waspGlobalMiddlewareConfigFn = (mc) => mc;
const defaultGlobalMiddlewareConfig = /* @__PURE__ */ new Map([
  ["helmet", helmet()],
  ["cors", cors({ origin: config$1.allowedCORSOrigins })],
  ["logger", logger("dev")],
  ["express.json", express.json()],
  ["express.urlencoded", express.urlencoded()],
  ["cookieParser", cookieParser()]
]);
const globalMiddlewareConfig = _waspGlobalMiddlewareConfigFn(defaultGlobalMiddlewareConfig);
function globalMiddlewareConfigForExpress(middlewareConfigFn) {
  if (!middlewareConfigFn) {
    return Array.from(globalMiddlewareConfig.values());
  }
  const globalMiddlewareConfigClone = new Map(globalMiddlewareConfig);
  const modifiedMiddlewareConfig = middlewareConfigFn(globalMiddlewareConfigClone);
  return Array.from(modifiedMiddlewareConfig.values());
}

var me = defineHandler(async (req, res) => {
  if (req.user) {
    res.json(serialize(req.user));
  } else {
    res.json(serialize(null));
  }
});

var logout = defineHandler(async (req, res) => {
  if (req.sessionId) {
    await invalidateSession(req.sessionId);
    res.json({ success: true });
  } else {
    throw createInvalidCredentialsError();
  }
});

const onBeforeSignupHook = async (_params) => {
};
const onAfterSignupHook = async (_params) => {
};
const onAfterEmailVerifiedHook = async (_params) => {
};
const onBeforeLoginHook = async (_params) => {
};
const onAfterLoginHook = async (_params) => {
};

function getLoginRoute() {
  return async function login(req, res) {
    const fields = req.body ?? {};
    ensureValidArgs$2(fields);
    const providerId = createProviderId("email", fields.email);
    const authIdentity = await findAuthIdentity(providerId);
    if (!authIdentity) {
      throw createInvalidCredentialsError();
    }
    const providerData = getProviderDataWithPassword(authIdentity.providerData);
    if (!providerData.isEmailVerified) {
      throw createInvalidCredentialsError();
    }
    try {
      await verifyPassword(providerData.hashedPassword, fields.password);
    } catch (e) {
      throw createInvalidCredentialsError();
    }
    const auth = await findAuthWithUserBy({ id: authIdentity.authId });
    if (auth === null) {
      throw createInvalidCredentialsError();
    }
    await onBeforeLoginHook({
      user: auth.user
    });
    const session = await createSession(auth.id);
    await onAfterLoginHook({
      user: auth.user
    });
    res.json({
      sessionId: session.id
    });
  };
}
function ensureValidArgs$2(args) {
  ensureValidEmail(args);
  ensurePasswordIsPresent(args);
}

const JWT_SECRET = new TextEncoder().encode(config$1.auth.jwtSecret);
const JWT_ALGORITHM = "HS256";
function createJWT(data, options) {
  return jwt.createJWT(JWT_ALGORITHM, JWT_SECRET, data, options);
}
async function validateJWT(token) {
  const { payload } = await jwt.validateJWT(JWT_ALGORITHM, JWT_SECRET, token);
  return payload;
}

async function createEmailVerificationLink(email, clientRoute) {
  const { jwtToken } = await createEmailJWT(email);
  return `${config$1.frontendUrl}${clientRoute}?token=${jwtToken}`;
}
async function createPasswordResetLink(email, clientRoute) {
  const { jwtToken } = await createEmailJWT(email);
  return `${config$1.frontendUrl}${clientRoute}?token=${jwtToken}`;
}
async function createEmailJWT(email) {
  const jwtToken = await createJWT({ email }, { expiresIn: new TimeSpan(30, "m") });
  return { jwtToken };
}
async function sendPasswordResetEmail(email, content) {
  return sendEmailAndSaveMetadata(email, content, {
    passwordResetSentAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function sendEmailVerificationEmail(email, content) {
  return sendEmailAndSaveMetadata(email, content, {
    emailVerificationSentAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function sendEmailAndSaveMetadata(email, content, metadata) {
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new Error(`User with email: ${email} not found.`);
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, metadata);
  emailSender.send(content).catch((e) => {
    console.error("Failed to send email", e);
  });
}
function isEmailResendAllowed(fields, field, resendInterval = 1e3 * 60) {
  const sentAt = fields[field];
  if (!sentAt) {
    return {
      isResendAllowed: true,
      timeLeft: 0
    };
  }
  const now = /* @__PURE__ */ new Date();
  const diff = now.getTime() - new Date(sentAt).getTime();
  const isResendAllowed = diff > resendInterval;
  const timeLeft = isResendAllowed ? 0 : Math.round((resendInterval - diff) / 1e3);
  return { isResendAllowed, timeLeft };
}

function getSignupRoute({
  userSignupFields,
  fromField,
  clientRoute,
  getVerificationEmailContent,
  isEmailAutoVerified
}) {
  return async function signup(req, res) {
    const fields = req.body;
    ensureValidArgs$1(fields);
    const providerId = createProviderId("email", fields.email);
    const existingAuthIdentity = await findAuthIdentity(providerId);
    if (existingAuthIdentity) {
      const providerData = getProviderDataWithPassword(
        existingAuthIdentity.providerData
      );
      if (providerData.isEmailVerified) {
        await doFakeWork();
        res.json({ success: true });
        return;
      }
      const { isResendAllowed, timeLeft } = isEmailResendAllowed(
        providerData,
        "passwordResetSentAt"
      );
      if (!isResendAllowed) {
        throw new HttpError(
          400,
          `Please wait ${timeLeft} secs before trying again.`
        );
      }
      try {
        await deleteUserByAuthId(existingAuthIdentity.authId);
      } catch (e) {
        rethrowPossibleAuthError(e);
      }
    }
    const userFields = await validateAndGetUserFields(fields, userSignupFields);
    const newUserProviderData = await sanitizeAndSerializeProviderData(
      {
        hashedPassword: fields.password,
        isEmailVerified: false,
        emailVerificationSentAt: null,
        passwordResetSentAt: null
      }
    );
    try {
      await onBeforeSignupHook({ req, providerId });
      const user = await createUser(
        providerId,
        newUserProviderData,
        // Using any here because we want to avoid TypeScript errors and
        // rely on Prisma to validate the data.
        userFields
      );
      await onAfterSignupHook({ req, providerId, user });
    } catch (e) {
      rethrowPossibleAuthError(e);
    }
    const verificationLink = await createEmailVerificationLink(
      fields.email,
      clientRoute
    );
    try {
      await sendEmailVerificationEmail(fields.email, {
        from: fromField,
        to: fields.email,
        ...getVerificationEmailContent({ verificationLink })
      });
    } catch (e) {
      console.error("Failed to send email verification email:", e);
      throw new HttpError(500, "Failed to send email verification email.");
    }
    res.json({ success: true });
  };
}
function ensureValidArgs$1(args) {
  ensureValidEmail(args);
  ensurePasswordIsPresent(args);
  ensureValidPassword(args);
}

function getRequestPasswordResetRoute({
  fromField,
  clientRoute,
  getPasswordResetEmailContent
}) {
  return async function requestPasswordReset(req, res) {
    const args = req.body ?? {};
    ensureValidEmail(args);
    const authIdentity = await findAuthIdentity(
      createProviderId("email", args.email)
    );
    if (!authIdentity) {
      await doFakeWork();
      res.json({ success: true });
      return;
    }
    const providerData = getProviderDataWithPassword(authIdentity.providerData);
    const { isResendAllowed, timeLeft } = isEmailResendAllowed(providerData, "passwordResetSentAt");
    if (!isResendAllowed) {
      throw new HttpError(400, `Please wait ${timeLeft} secs before trying again.`);
    }
    const passwordResetLink = await createPasswordResetLink(args.email, clientRoute);
    try {
      const email = authIdentity.providerUserId;
      await sendPasswordResetEmail(
        email,
        {
          from: fromField,
          to: email,
          ...getPasswordResetEmailContent({ passwordResetLink })
        }
      );
    } catch (e) {
      console.error("Failed to send password reset email:", e);
      throw new HttpError(500, "Failed to send password reset email.");
    }
    res.json({ success: true });
  };
}

async function resetPassword(req, res) {
  const args = req.body ?? {};
  ensureValidArgs(args);
  const { token, password } = args;
  const { email } = await validateJWT(token).catch(() => {
    throw new HttpError(400, "Password reset failed, invalid token");
  });
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new HttpError(400, "Password reset failed, invalid token");
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, {
    // The act of resetting the password verifies the email
    isEmailVerified: true,
    // The password will be hashed when saving the providerData
    // in the DB
    hashedPassword: password
  });
  res.json({ success: true });
}
function ensureValidArgs(args) {
  ensureTokenIsPresent(args);
  ensurePasswordIsPresent(args);
  ensureValidPassword(args);
}

async function verifyEmail(req, res) {
  const { token } = req.body;
  const { email } = await validateJWT(token).catch(() => {
    throw new HttpError(400, "Email verification failed, invalid token");
  });
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  if (!authIdentity) {
    throw new HttpError(400, "Email verification failed, invalid token");
  }
  const providerData = getProviderDataWithPassword(authIdentity.providerData);
  await updateAuthIdentityProviderData(providerId, providerData, {
    isEmailVerified: true
  });
  const auth = await findAuthWithUserBy({ id: authIdentity.authId });
  await onAfterEmailVerifiedHook({ user: auth.user });
  res.json({ success: true });
}

function defineUserSignupFields(fields) {
  return fields;
}

const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
const emailDataSchema = z$1.object({
  email: z$1.string()
});
const getEmailUserFields = defineUserSignupFields({
  email: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  username: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  isAdmin: (data) => {
    const emailData = emailDataSchema.parse(data);
    return adminEmails.includes(emailData.email);
  },
  // Set trial end date for new signups (14-day free trial)
  trialEndsAt: () => {
    return calculateTrialEndDate(/* @__PURE__ */ new Date());
  }
});
z$1.object({
  profile: z$1.object({
    emails: z$1.array(
      z$1.object({
        email: z$1.string(),
        verified: z$1.boolean()
      })
    ).min(
      1,
      "You need to have an email address associated with your GitHub account to sign up."
    ),
    login: z$1.string()
  })
});
z$1.object({
  profile: z$1.object({
    email: z$1.string(),
    email_verified: z$1.boolean()
  })
});
z$1.object({
  profile: z$1.object({
    username: z$1.string(),
    email: z$1.string().email().nullable(),
    verified: z$1.boolean().nullable()
  })
});

const _waspUserSignupFields = getEmailUserFields;
const _waspGetVerificationEmailContent = getVerificationEmailContent;
const _waspGetPasswordResetEmailContent = getPasswordResetEmailContent;
const fromField = {
  name: "BaseSync",
  email: "noreply@basesync.app"
};
const config = {
  id: "email",
  displayName: "Email and password",
  createRouter() {
    const router = Router();
    const loginRoute = defineHandler(getLoginRoute());
    router.post("/login", loginRoute);
    const signupRoute = defineHandler(getSignupRoute({
      userSignupFields: _waspUserSignupFields,
      fromField,
      clientRoute: "/email-verification",
      getVerificationEmailContent: _waspGetVerificationEmailContent,
      isEmailAutoVerified: false
    }));
    router.post("/signup", signupRoute);
    const requestPasswordResetRoute = defineHandler(getRequestPasswordResetRoute({
      fromField,
      clientRoute: "/password-reset",
      getPasswordResetEmailContent: _waspGetPasswordResetEmailContent
    }));
    router.post("/request-password-reset", requestPasswordResetRoute);
    router.post("/reset-password", defineHandler(resetPassword));
    router.post("/verify-email", defineHandler(verifyEmail));
    return router;
  }
};

const providers = [
  config
];
const router$3 = Router();
for (const provider of providers) {
  const { createRouter } = provider;
  const providerRouter = createRouter(provider);
  router$3.use(`/${provider.id}`, providerRouter);
  console.log(`\u{1F680} "${provider.displayName}" auth initialized`);
}

const router$2 = express.Router();
router$2.get("/me", auth, me);
router$2.post("/logout", auth, logout);
router$2.use("/", router$3);

const paymentsWebhook = paymentProcessor.webhook;
const paymentsMiddlewareConfigFn = paymentProcessor.webhookMiddlewareConfigFn;

const router$1 = express.Router();
const paymentsWebhookMiddleware = globalMiddlewareConfigForExpress(paymentsMiddlewareConfigFn);
router$1.post(
  "/payments-webhook",
  [auth, ...paymentsWebhookMiddleware],
  defineHandler(
    (req, res) => {
      const context = {
        user: makeAuthUserIfPossible(req.user),
        entities: {
          User: dbClient.user
        }
      };
      return paymentsWebhook(req, res, context);
    }
  )
);

const router = express.Router();
const middleware = globalMiddlewareConfigForExpress();
router.get(
  "/",
  middleware,
  function(_req, res) {
    res.status(200).send();
  }
);
router.use("/auth", middleware, router$2);
router.use("/operations", middleware, router$4);
router.use(router$1);

const app = express();
app.use("/", router);
app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message, data: err.data });
  }
  return next(err);
});

const serverSetup = async () => {
  console.log("[Server Setup] Initializing BaseSync server...");
  try {
    if (emailSender) {
      console.log("[Server Setup] Overriding Wasp emailSender with Resend HTTP API");
      const originalSend = emailSender.send;
      emailSender.send = async (args) => {
        console.log("[Email Override] Intercepted email send, using Resend HTTP API");
        return resendEmailSender.send(args);
      };
      console.log("[Server Setup] \u2713 Resend HTTP API activated (no SMTP)");
    } else {
      console.warn("[Server Setup] emailSender not found in wasp/server/email module");
    }
  } catch (error) {
    console.error("[Server Setup] Failed to override email sender:", error);
  }
  console.log("[Server Setup] \u2713 Server initialization complete");
};

const boss = createPgBoss();
function createPgBoss() {
  let pgBossNewOptions = {
    connectionString: config$1.databaseUrl
  };
  if (env.PG_BOSS_NEW_OPTIONS) {
    try {
      pgBossNewOptions = JSON.parse(env.PG_BOSS_NEW_OPTIONS);
    } catch {
      console.error("Environment variable PG_BOSS_NEW_OPTIONS was not parsable by JSON.parse()!");
    }
  }
  return new PgBoss(pgBossNewOptions);
}
let resolvePgBossStarted;
let rejectPgBossStarted;
const pgBossStarted = new Promise((resolve, reject) => {
  resolvePgBossStarted = resolve;
  rejectPgBossStarted = reject;
});
var PgBossStatus;
(function(PgBossStatus2) {
  PgBossStatus2["Unstarted"] = "Unstarted";
  PgBossStatus2["Starting"] = "Starting";
  PgBossStatus2["Started"] = "Started";
  PgBossStatus2["Error"] = "Error";
})(PgBossStatus || (PgBossStatus = {}));
let pgBossStatus = PgBossStatus.Unstarted;
async function startPgBoss() {
  if (pgBossStatus !== PgBossStatus.Unstarted) {
    return;
  }
  pgBossStatus = PgBossStatus.Starting;
  console.log("Starting pg-boss...");
  boss.on("error", (error) => console.error(error));
  try {
    await boss.start();
  } catch (error) {
    console.error("pg-boss failed to start!");
    console.error(error);
    pgBossStatus = PgBossStatus.Error;
    rejectPgBossStarted(boss);
    return;
  }
  resolvePgBossStarted(boss);
  console.log("pg-boss started!");
  pgBossStatus = PgBossStatus.Started;
}

class Job {
  jobName;
  executorName;
  constructor(jobName, executorName) {
    this.jobName = jobName;
    this.executorName = executorName;
  }
}
class SubmittedJob {
  job;
  jobId;
  constructor(job, jobId) {
    this.job = job;
    this.jobId = jobId;
  }
}

const PG_BOSS_EXECUTOR_NAME = /* @__PURE__ */ Symbol("PgBoss");
function createJobDefinition({ jobName, defaultJobOptions, jobSchedule, entities }) {
  return new PgBossJob(jobName, defaultJobOptions, entities, jobSchedule);
}
function registerJob({ job, jobFn }) {
  pgBossStarted.then(async (boss) => {
    await boss.offWork(job.jobName);
    await boss.work(job.jobName, pgBossCallbackWrapper(jobFn, job.entities));
    if (job.jobSchedule) {
      const options = {
        ...job.defaultJobOptions,
        ...job.jobSchedule.options
      };
      await boss.schedule(job.jobName, job.jobSchedule.cron, job.jobSchedule.args, options);
    }
  });
}
class PgBossJob extends Job {
  defaultJobOptions;
  startAfter;
  entities;
  jobSchedule;
  constructor(jobName, defaultJobOptions, entities, jobSchedule, startAfter) {
    super(jobName, PG_BOSS_EXECUTOR_NAME);
    this.defaultJobOptions = defaultJobOptions;
    this.entities = entities;
    this.jobSchedule = jobSchedule;
    this.startAfter = startAfter;
  }
  delay(startAfter) {
    return new PgBossJob(this.jobName, this.defaultJobOptions, this.entities, this.jobSchedule, startAfter);
  }
  async submit(jobArgs, jobOptions = {}) {
    const boss = await pgBossStarted;
    const jobId = await boss.send(this.jobName, jobArgs, {
      ...this.defaultJobOptions,
      ...this.startAfter && { startAfter: this.startAfter },
      ...jobOptions
    });
    return new PgBossSubmittedJob(boss, this, jobId);
  }
}
class PgBossSubmittedJob extends SubmittedJob {
  pgBoss;
  constructor(boss, job, jobId) {
    super(job, jobId);
    this.pgBoss = {
      cancel: () => boss.cancel(jobId),
      resume: () => boss.resume(jobId),
      // Coarcing here since pg-boss typings are not precise enough.
      details: () => boss.getJobById(jobId)
    };
  }
}
function pgBossCallbackWrapper(jobFn, entities) {
  return (args) => {
    const context = { entities };
    return jobFn(args.data, context);
  };
}

const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
const PLAUSIBLE_SITE_ID = process.env.PLAUSIBLE_SITE_ID;
const PLAUSIBLE_BASE_URL = process.env.PLAUSIBLE_BASE_URL;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${PLAUSIBLE_API_KEY}`
};
async function getDailyPageViews() {
  const totalViews = await getTotalPageViews();
  const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();
  return {
    totalViews,
    prevDayViewsChangePercent
  };
}
async function getTotalPageViews() {
  const response = await fetch(
    `${PLAUSIBLE_BASE_URL}/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&metrics=pageviews`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`
      }
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const json = await response.json();
  return json.results.pageviews.value;
}
async function getPrevDayViewsChangePercent() {
  const today = /* @__PURE__ */ new Date();
  const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString().split("T")[0];
  const dayBeforeYesterday = new Date(
    (/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() - 2)
  ).toISOString().split("T")[0];
  const pageViewsYesterday = await getPageviewsForDate(yesterday);
  const pageViewsDayBeforeYesterday = await getPageviewsForDate(dayBeforeYesterday);
  console.table({
    pageViewsYesterday,
    pageViewsDayBeforeYesterday,
    typeY: typeof pageViewsYesterday,
    typeDBY: typeof pageViewsDayBeforeYesterday
  });
  let change = 0;
  if (pageViewsYesterday === 0 || pageViewsDayBeforeYesterday === 0) {
    return "0";
  } else {
    change = (pageViewsYesterday - pageViewsDayBeforeYesterday) / pageViewsDayBeforeYesterday * 100;
  }
  return change.toFixed(0);
}
async function getPageviewsForDate(date) {
  const url = `${PLAUSIBLE_BASE_URL}/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&period=day&date=${date}&metrics=pageviews`;
  const response = await fetch(url, {
    method: "GET",
    headers
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data.results.pageviews.value;
}
async function getSources() {
  const url = `${PLAUSIBLE_BASE_URL}/v1/stats/breakdown?site_id=${PLAUSIBLE_SITE_ID}&property=visit:source&metrics=visitors`;
  const response = await fetch(url, {
    method: "GET",
    headers
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

let _polarClient = null;
function getPolarClient() {
  if (_polarClient) {
    return _polarClient;
  }
  const accessToken = process.env.POLAR_ORGANIZATION_ACCESS_TOKEN;
  const sandboxMode = process.env.POLAR_SANDBOX_MODE;
  if (!accessToken || !sandboxMode) {
    throw new Error(
      "Polar payment provider is not configured. Set POLAR_ORGANIZATION_ACCESS_TOKEN and POLAR_SANDBOX_MODE environment variables."
    );
  }
  _polarClient = new Polar({
    accessToken,
    server: sandboxMode === "true" ? "sandbox" : "production"
  });
  return _polarClient;
}
const polarClient = new Proxy({}, {
  get(target, prop) {
    return getPolarClient()[prop];
  }
});

const calculateDailyStats = async (_args, context) => {
  const nowUTC = new Date(Date.now());
  nowUTC.setUTCHours(0, 0, 0, 0);
  const yesterdayUTC = new Date(nowUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
  try {
    const yesterdaysStats = await context.entities.DailyStats.findFirst({
      where: {
        date: {
          equals: yesterdayUTC
        }
      }
    });
    const userCount = await context.entities.User.count({});
    const paidUserCount = await context.entities.User.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active
      }
    });
    let userDelta = userCount;
    let paidUserDelta = paidUserCount;
    if (yesterdaysStats) {
      userDelta -= yesterdaysStats.userCount;
      paidUserDelta -= yesterdaysStats.paidUserCount;
    }
    let totalRevenue;
    switch (paymentProcessor.id) {
      case "stripe":
        totalRevenue = await fetchTotalStripeRevenue();
        break;
      case "lemonsqueezy":
        totalRevenue = await fetchTotalLemonSqueezyRevenue();
        break;
      case "polar":
        totalRevenue = await fetchTotalPolarRevenue();
        break;
      default:
        assertUnreachable(paymentProcessor.id);
    }
    const { totalViews, prevDayViewsChangePercent } = await getDailyPageViews();
    let dailyStats = await context.entities.DailyStats.findUnique({
      where: {
        date: nowUTC
      }
    });
    if (!dailyStats) {
      console.log("No daily stat found for today, creating one...");
      dailyStats = await context.entities.DailyStats.create({
        data: {
          date: nowUTC,
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue
        }
      });
    } else {
      console.log("Daily stat found for today, updating it...");
      dailyStats = await context.entities.DailyStats.update({
        where: {
          id: dailyStats.id
        },
        data: {
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue
        }
      });
    }
    const sources = await getSources();
    for (const source of sources) {
      let visitors = source.visitors;
      if (typeof source.visitors !== "number") {
        visitors = parseInt(source.visitors);
      }
      await context.entities.PageViewSource.upsert({
        where: {
          date_name: {
            date: nowUTC,
            name: source.source
          }
        },
        create: {
          date: nowUTC,
          name: source.source,
          visitors,
          dailyStatsId: dailyStats.id
        },
        update: {
          visitors
        }
      });
    }
    console.table({ dailyStats });
    console.log("[DailyStats] Checking for trial users needing expiration emails...");
    try {
      await checkAndSendTrialExpiringEmails();
      console.log("[DailyStats] Trial expiration email check complete");
    } catch (emailError) {
      console.error("[DailyStats] Error sending trial expiration emails:", emailError?.message);
    }
  } catch (error) {
    console.error("Error calculating daily stats: ", error);
    await context.entities.Logs.create({
      data: {
        message: `Error calculating daily stats: ${error?.message}`,
        level: "job-error"
      }
    });
  }
};
async function fetchTotalStripeRevenue() {
  let totalRevenue = 0;
  let params = {
    limit: 100,
    // created: {
    //   gte: startTimestamp,
    //   lt: endTimestamp
    // },
    type: "charge"
  };
  let hasMore = true;
  while (hasMore) {
    const balanceTransactions = await stripeClient.balanceTransactions.list(params);
    for (const transaction of balanceTransactions.data) {
      if (transaction.type === "charge") {
        totalRevenue += transaction.amount;
      }
    }
    if (balanceTransactions.has_more) {
      params.starting_after = balanceTransactions.data[balanceTransactions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  return totalRevenue / 100;
}
async function fetchTotalLemonSqueezyRevenue() {
  try {
    let totalRevenue = 0;
    let hasNextPage = true;
    let currentPage = 1;
    while (hasNextPage) {
      const { data: response } = await listOrders({
        filter: {
          storeId: process.env.LEMONSQUEEZY_STORE_ID
        },
        page: {
          number: currentPage,
          size: 100
        }
      });
      if (response?.data) {
        for (const order of response.data) {
          totalRevenue += order.attributes.total;
        }
      }
      hasNextPage = !response?.meta?.page.lastPage;
      currentPage++;
    }
    return totalRevenue / 100;
  } catch (error) {
    console.error("Error fetching Lemon Squeezy revenue:", error);
    throw error;
  }
}
async function fetchTotalPolarRevenue() {
  let totalRevenue = 0;
  const result = await polarClient.orders.list({
    limit: 100
  });
  for await (const page of result) {
    const orders = page.result.items || [];
    for (const order of orders) {
      if (order.status === OrderStatus.Paid && order.totalAmount > 0) {
        totalRevenue += order.totalAmount;
      }
    }
  }
  return totalRevenue / 100;
}

const entities$1 = {
  User: dbClient.user,
  DailyStats: dbClient.dailyStats,
  Logs: dbClient.logs,
  PageViewSource: dbClient.pageViewSource
};
const jobSchedule$1 = {
  cron: "0 * * * *",
  options: {}
};
const dailyStatsJob = createJobDefinition({
  jobName: "dailyStatsJob",
  defaultJobOptions: {},
  jobSchedule: jobSchedule$1,
  entities: entities$1
});

const entities = {
  User: dbClient.user,
  AirtableConnection: dbClient.airtableConnection,
  GoogleSheetsConnection: dbClient.googleSheetsConnection,
  SyncConfig: dbClient.syncConfig,
  SyncLog: dbClient.syncLog
};
const jobSchedule = {
  cron: "*/5 * * * *",
  options: {}
};
const syncJob = createJobDefinition({
  jobName: "syncJob",
  defaultJobOptions: {},
  jobSchedule,
  entities
});

registerJob({
  job: dailyStatsJob,
  jobFn: calculateDailyStats
});

const performSync = async (_args, context) => {
  const startTime = Date.now();
  const result = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
    duration: 0
  };
  console.log("\n" + "=".repeat(80));
  console.log("[SyncJob] Starting scheduled sync job...");
  console.log("[SyncJob] Time:", (/* @__PURE__ */ new Date()).toISOString());
  console.log("=".repeat(80) + "\n");
  try {
    console.log("[SyncJob] Fetching active sync configurations...");
    const activeSyncConfigs = await context.entities.SyncConfig.findMany({
      where: {
        isActive: true
      },
      include: {
        user: {
          include: {
            airtableConnections: true,
            googleSheetsConnections: true
          }
        }
      },
      orderBy: {
        lastSyncAt: "asc"
        // Prioritize configs that haven't synced recently
      }
    });
    console.log(`[SyncJob] Found ${activeSyncConfigs.length} active sync configuration(s)`);
    if (activeSyncConfigs.length === 0) {
      console.log("[SyncJob] No active sync configurations found. Job complete.");
      return;
    }
    for (const config of activeSyncConfigs) {
      result.totalProcessed++;
      const configStartTime = Date.now();
      console.log(`
[SyncJob] [${"=".repeat(70)}]`);
      console.log(`[SyncJob] Processing config: ${config.name} (${config.id})`);
      console.log(`[SyncJob] Direction: ${config.syncDirection}`);
      console.log(`[SyncJob] User: ${config.user.email || config.user.username || config.userId}`);
      console.log(`[SyncJob] [${"=".repeat(70)}]
`);
      try {
        if (shouldPauseSyncs(config.user)) {
          const pauseReason = getSyncPauseReason(config.user);
          console.warn(`[SyncJob] \u23F8\uFE0F  Syncs paused for user: ${pauseReason}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: "SKIPPED",
            message: pauseReason || "Trial expired or subscription inactive"
          });
          continue;
        }
        const airtableConnection = config.user.airtableConnections?.[0];
        const googleConnection = config.user.googleSheetsConnections?.[0];
        if (!airtableConnection) {
          const message = "User has no Airtable connection";
          console.warn(`[SyncJob] \u26A0\uFE0F  ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: "SKIPPED",
            message
          });
          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: "failed" }
          });
          continue;
        }
        if (!googleConnection) {
          const message = "User has no Google Sheets connection";
          console.warn(`[SyncJob] \u26A0\uFE0F  ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: "SKIPPED",
            message
          });
          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: "failed" }
          });
          continue;
        }
        console.log("[SyncJob] Getting valid access tokens...");
        let airtableAccessToken;
        let sheetsAccessToken;
        try {
          airtableAccessToken = await getValidAirtableToken(config.userId);
          console.log("[SyncJob] \u2713 Got valid Airtable token");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get Airtable access token";
          console.error(`[SyncJob] \u2717 ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: "SKIPPED",
            message
          });
          continue;
        }
        try {
          sheetsAccessToken = await getValidGoogleToken(config.userId);
          console.log("[SyncJob] \u2713 Got valid Google Sheets token");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get Google Sheets access token";
          console.error(`[SyncJob] \u2717 ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: "SKIPPED",
            message
          });
          continue;
        }
        console.log(`[SyncJob] Executing ${config.syncDirection} sync...`);
        let syncResult;
        let syncStatus = "success";
        let errorMessage;
        try {
          switch (config.syncDirection) {
            case "AIRTABLE_TO_SHEETS": {
              syncResult = await syncAirtableToSheets({
                airtableAccessToken,
                sheetsAccessToken,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                fieldMappings: config.fieldMappings ? JSON.parse(config.fieldMappings) : void 0,
                includeHeader: true,
                deleteExtraRows: false,
                resolveLinkedRecords: true,
                idColumnIndex: 0,
                maxRetries: 3,
                batchSize: 100
              });
              syncStatus = syncResult.errors.length === 0 ? "success" : syncResult.added + syncResult.updated > 0 ? "partial" : "failed";
              break;
            }
            case "SHEETS_TO_AIRTABLE": {
              syncResult = await syncSheetsToAirtable({
                sheetsAccessToken,
                airtableAccessToken,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                fieldMappings: config.fieldMappings ? JSON.parse(config.fieldMappings) : void 0,
                idColumnIndex: 0,
                skipHeaderRow: true,
                deleteExtraRecords: false,
                resolveLinkedRecords: true,
                createMissingLinkedRecords: false,
                maxRetries: 3,
                batchSize: 10,
                validationMode: "lenient"
              });
              syncStatus = syncResult.errors.length === 0 ? "success" : syncResult.added + syncResult.updated > 0 ? "partial" : "failed";
              break;
            }
            case "BIDIRECTIONAL": {
              syncResult = await syncBidirectional({
                syncConfigId: config.id,
                airtableAccessToken,
                sheetsAccessToken,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                conflictResolution: config.conflictResolution,
                fieldMappings: config.fieldMappings ? JSON.parse(config.fieldMappings) : void 0,
                idColumnIndex: 0,
                includeHeader: true,
                resolveLinkedRecords: true,
                createMissingLinkedRecords: false,
                maxRetries: 3,
                batchSize: 10,
                dryRun: false
              });
              syncStatus = syncResult.status === "SUCCESS" ? "success" : syncResult.status === "PARTIAL" ? "partial" : "failed";
              break;
            }
            default:
              throw new Error(`Unknown sync direction: ${config.syncDirection}`);
          }
          console.log(`[SyncJob] \u2713 Sync completed successfully`);
          console.log(`[SyncJob]   Status: ${syncStatus}`);
          if (config.syncDirection === "BIDIRECTIONAL") {
            console.log(
              `[SyncJob]   Airtable \u2192 Sheets: ${syncResult.summary.airtableToSheets.added} added, ${syncResult.summary.airtableToSheets.updated} updated`
            );
            console.log(
              `[SyncJob]   Sheets \u2192 Airtable: ${syncResult.summary.sheetsToAirtable.added} added, ${syncResult.summary.sheetsToAirtable.updated} updated`
            );
            console.log(`[SyncJob]   Conflicts: ${syncResult.summary.conflicts.total} resolved`);
          } else {
            console.log(
              `[SyncJob]   Records: ${syncResult.added} added, ${syncResult.updated} updated, ${syncResult.deleted} deleted`
            );
          }
          console.log(`[SyncJob]   Duration: ${syncResult.duration}ms`);
          if (syncResult.errors && syncResult.errors.length > 0) {
            console.warn(`[SyncJob]   \u26A0\uFE0F  ${syncResult.errors.length} error(s) occurred`);
            errorMessage = syncResult.errors.slice(0, 3).map((e) => e.message).join("; ");
          }
          try {
            const recordCount = config.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.total || 0) + (syncResult?.summary?.sheetsToAirtable?.total || 0) : syncResult?.total || 0;
            if (recordCount > 0) {
              await checkAndSendUsageEmails(config.user, recordCount);
            }
          } catch (usageEmailError) {
            console.error("[SyncJob] Failed to send usage notification email:", usageEmailError);
          }
          result.successful++;
        } catch (syncError) {
          syncStatus = "failed";
          errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
          console.error(`[SyncJob] \u2717 Sync failed:`, errorMessage);
          console.error(`[SyncJob] Error stack:`, syncError instanceof Error ? syncError.stack : "No stack");
          result.failed++;
          syncResult = {
            added: 0,
            updated: 0,
            deleted: 0,
            total: 0,
            errors: [{ message: errorMessage, type: "SYNC_ERROR" }],
            warnings: [],
            duration: Date.now() - configStartTime
          };
          try {
            await sendSyncFailedEmail(
              config.user,
              config.name,
              errorMessage
            );
          } catch (emailError) {
            console.error("[SyncJob] Failed to send sync failure email:", emailError);
          }
        }
        console.log("[SyncJob] Updating sync metadata...");
        const configDuration = Date.now() - configStartTime;
        await context.entities.SyncConfig.update({
          where: { id: config.id },
          data: {
            lastSyncAt: /* @__PURE__ */ new Date(),
            lastSyncStatus: syncStatus
          }
        });
        await context.entities.SyncLog.create({
          data: {
            syncConfigId: config.id,
            status: syncStatus === "success" ? "SUCCESS" : syncStatus === "partial" ? "PARTIAL" : "FAILED",
            recordsSynced: config.syncDirection === "BIDIRECTIONAL" ? (syncResult?.summary?.airtableToSheets?.added || 0) + (syncResult?.summary?.airtableToSheets?.updated || 0) + (syncResult?.summary?.sheetsToAirtable?.added || 0) + (syncResult?.summary?.sheetsToAirtable?.updated || 0) : (syncResult?.added || 0) + (syncResult?.updated || 0),
            recordsFailed: syncResult?.errors?.length || 0,
            errors: errorMessage ? JSON.stringify([{ message: errorMessage }]) : syncResult?.errors && syncResult.errors.length > 0 ? JSON.stringify(
              syncResult.errors.slice(0, 10).map((e) => ({
                message: e.message,
                recordId: e.recordId,
                type: e.type
              }))
            ) : null,
            startedAt: new Date(configStartTime),
            completedAt: /* @__PURE__ */ new Date(),
            triggeredBy: "scheduled",
            direction: config.syncDirection
          }
        });
        result.results.push({
          configId: config.id,
          configName: config.name,
          status: syncStatus === "failed" ? "FAILED" : "SUCCESS",
          message: syncStatus === "failed" ? errorMessage || "Sync failed" : `Synced successfully (${syncStatus})`,
          duration: configDuration,
          error: errorMessage
        });
        console.log("[SyncJob] \u2713 Sync metadata updated");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[SyncJob] \u2717 Failed to process config:`, errorMessage);
        result.failed++;
        result.results.push({
          configId: config.id,
          configName: config.name,
          status: "FAILED",
          message: "Failed to process config",
          error: errorMessage
        });
        try {
          await context.entities.SyncLog.create({
            data: {
              syncConfigId: config.id,
              status: "FAILED",
              recordsSynced: 0,
              recordsFailed: 0,
              errors: JSON.stringify([
                { message: errorMessage, type: "PROCESSING_ERROR" }
              ]),
              startedAt: new Date(configStartTime),
              completedAt: /* @__PURE__ */ new Date(),
              triggeredBy: "scheduled",
              direction: config.syncDirection
            }
          });
          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: "failed" }
          });
        } catch (logError) {
          console.error(
            "[SyncJob] Failed to log error:",
            logError instanceof Error ? logError.message : String(logError)
          );
        }
      }
    }
    result.duration = Date.now() - startTime;
    console.log("\n" + "=".repeat(80));
    console.log("[SyncJob] Job Summary:");
    console.log(`[SyncJob]   Total Processed: ${result.totalProcessed}`);
    console.log(`[SyncJob]   Successful: ${result.successful}`);
    console.log(`[SyncJob]   Failed: ${result.failed}`);
    console.log(`[SyncJob]   Skipped: ${result.skipped}`);
    console.log(`[SyncJob]   Duration: ${result.duration}ms`);
    console.log("[SyncJob]");
    console.log("[SyncJob] Detailed Results:");
    result.results.forEach((r, i) => {
      const icon = r.status === "SUCCESS" ? "\u2713" : r.status === "FAILED" ? "\u2717" : "\u2298";
      console.log(
        `[SyncJob]   ${i + 1}. ${icon} ${r.configName} - ${r.message}${r.duration ? ` (${r.duration}ms)` : ""}`
      );
      if (r.error) {
        console.log(`[SyncJob]      Error: ${r.error}`);
      }
    });
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error(
      "\n[SyncJob] \u2717 CRITICAL ERROR in sync job:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("[SyncJob] Stack trace:", error);
    console.error("[SyncJob] Job will retry on next schedule\n");
  }
};

registerJob({
  job: syncJob,
  jobFn: performSync
});

const startServer = async () => {
  await startPgBoss();
  const port = normalizePort(config$1.port);
  app.set("port", port);
  const server = http.createServer(app);
  await serverSetup();
  server.listen(port);
  server.on("error", (error) => {
    if (error.syscall !== "listen") throw error;
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
      default:
        throw error;
    }
  });
  server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("Server listening on " + bind);
  });
};
startServer().catch((e) => console.error(e));
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}
//# sourceMappingURL=server.js.map
