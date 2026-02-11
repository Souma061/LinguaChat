// Global test setup and configuration

// Suppress console logs during tests (optional)
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Global timeout for all tests
jest.setTimeout(30000);
