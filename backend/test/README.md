# World Cup Simulator - Test Suite

This directory contains the comprehensive test suite for the World Cup Simulator backend API.

## Test Structure

```
test/
├── unit/                   # Unit tests for individual services
│   └── services/
│       ├── MatchService.test.js
│       ├── QualificationService.test.js
│       └── UserService.test.js
├── integration/           # Integration tests for API endpoints
│   └── routes/
│       ├── auth.test.js
│       ├── tournament.test.js
│       └── matches.test.js
├── fixtures/              # Test data and fixtures
│   └── testData.js
├── utils/                 # Test utilities and helpers
│   └── testHelpers.js
├── setup.js              # Test environment setup
└── mocha.config.js       # Mocha configuration
```

## Running Tests

### From Project Root

```bash
# Run all tests
./run-tests.sh

# For CI/CD environments
./run-tests-ci.sh
```

### From Backend Directory

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### Unit Tests

Unit tests focus on testing individual service methods in isolation:

- **MatchService**: Tests for match simulation logic, score calculation, and team power calculations
- **QualificationService**: Tests for qualification group distribution, match generation, and standings
- **UserService**: Tests for authentication, user management, and password handling

### Integration Tests

Integration tests verify complete API endpoints with database interactions:

- **Auth Routes**: Registration, login, and authentication flow
- **Tournament Routes**: Tournament CRUD operations and status management
- **Match Routes**: Match generation, simulation, and standings

## Test Environment

- Uses **MongoDB Memory Server** for isolated database testing
- Each test suite has its own database instance
- Database is cleared between tests to ensure isolation
- Test data is provided through fixtures

## Writing New Tests

### Unit Test Example

```javascript
import { expect } from 'chai'
import sinon from 'sinon'
import ServiceName from '../../../services/ServiceName.js'

describe('ServiceName Unit Tests', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('methodName', () => {
    it('should do something specific', () => {
      // Test implementation
    })
  })
})
```

### Integration Test Example

```javascript
import { expect } from 'chai'
import request from 'supertest'
import app from '../../../server.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup.js'

describe('Route Integration Tests', () => {
  before(async function() {
    this.timeout(30000)
    await setupTestDB()
  })

  afterEach(async () => {
    await clearTestDB()
  })

  after(async () => {
    await teardownTestDB()
  })

  describe('GET /api/endpoint', () => {
    it('should return expected data', async () => {
      const res = await request(app)
        .get('/api/endpoint')
        .expect(200)
      
      expect(res.body).to.have.property('data')
    })
  })
})
```

## Test Coverage

The test suite uses `c8` for code coverage reporting. After running tests with coverage, reports are available in:

- `backend/coverage/lcov-report/index.html` - HTML coverage report
- `backend/coverage/coverage-final.json` - JSON coverage data

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Names**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Mock External Dependencies**: Use Sinon for mocking external services
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Keep Tests Fast**: Use in-memory database and avoid unnecessary operations

## Troubleshooting

### Tests Timing Out

Increase timeout in test files:
```javascript
this.timeout(30000) // 30 seconds
```

### Database Connection Issues

Ensure MongoDB Memory Server has enough time to start:
```javascript
before(async function() {
  this.timeout(30000)
  await setupTestDB()
})
```

### Port Conflicts

If you get port conflicts, ensure no other instances of the app are running:
```bash
lsof -i :3001  # Check if port is in use
kill -9 <PID>  # Kill the process if needed
```