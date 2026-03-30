import { afterAll, beforeAll, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Global test setup and configuration

// Suppress console logs during tests (optional)
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

declare global {
  // eslint-disable-next-line no-var
  var __mongoMemoryServer__: MongoMemoryServer | undefined;
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET ??= "test-jwt-secret";
  process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret";

  if (!globalThis.__mongoMemoryServer__) {
    globalThis.__mongoMemoryServer__ = await MongoMemoryServer.create();
  }

  process.env.TEST_MONGODB_URI = globalThis.__mongoMemoryServer__.getUri();

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.TEST_MONGODB_URI, {
      dbName: "lingo-test",
      serverSelectionTimeoutMS: 5000,
    });
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    if (globalThis.__mongoMemoryServer__) {
      await globalThis.__mongoMemoryServer__.stop();
      globalThis.__mongoMemoryServer__ = undefined;
    }
    jest.restoreAllMocks();
  }
});

// Global timeout for all tests
jest.setTimeout(30000);
