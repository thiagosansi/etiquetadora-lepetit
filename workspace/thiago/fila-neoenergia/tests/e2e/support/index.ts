// Cypress support file — global setup for E2E tests

// Mock Supabase auth store for tests
beforeEach(() => {
  // Clear persisted auth state between tests
  cy.clearLocalStorage('fila-auth');
});

// Custom command: login as operator
Cypress.Commands.add('loginAsOperator', (pin = '1234') => {
  // Set auth state directly to avoid network calls in unit-style E2E
  cy.window().then((win) => {
    win.localStorage.setItem(
      'fila-auth',
      JSON.stringify({
        state: {
          operator: { id: 'test-op-id', name: 'Tablet 1' },
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  });
  cy.reload();
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsOperator(pin?: string): void;
    }
  }
}
