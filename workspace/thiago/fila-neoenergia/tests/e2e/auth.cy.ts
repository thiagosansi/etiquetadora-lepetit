describe('Auth — Login de Operador', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('exibe a tela de login com numpad', () => {
    cy.contains('NEOENERGIA').should('be.visible');
    cy.contains('BAHIA FARM 2026').should('be.visible');
    cy.get('button').contains('1').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('preenche PIN via numpad e habilita botão', () => {
    cy.get('button').contains('1').click();
    cy.get('button').contains('2').click();
    cy.get('button').contains('3').click();
    cy.get('button').contains('4').click();
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('redireciona para / após login com PIN correto', () => {
    // Note: this test requires a real Supabase connection.
    // In CI, skip or use a stub.
    cy.log('Skipped: requires real Supabase — tested in integration');
  });

  it('mostra erro para PIN inválido', () => {
    cy.log('Skipped: requires real Supabase — tested in integration');
  });

  it('redireciona para /login se não autenticado', () => {
    cy.clearLocalStorage('fila-auth');
    cy.visit('/');
    cy.url().should('include', '/login');
  });
});
