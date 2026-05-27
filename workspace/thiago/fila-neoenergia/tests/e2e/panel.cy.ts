describe('Painel do Operador', () => {
  beforeEach(() => {
    cy.loginAsOperator();
    cy.visit('/');
  });

  it('exibe o painel principal com botões de ação', () => {
    cy.contains('NEOENERGIA').should('be.visible');
    cy.contains('BAHIA FARM 2026').should('be.visible');
    cy.contains('Registrar Cliente').should('be.visible');
    cy.contains('Finalizar').should('be.visible');
    cy.contains('Ausente').should('be.visible');
  });

  it('botão Chamar Próximo está desabilitado com fila vazia', () => {
    // With empty queue (no Supabase connection), button shows "Chamar Próximo (0)"
    cy.get('button').contains(/Chamar Próximo/).should('be.disabled');
  });

  it('navega para /register ao clicar em Registrar Cliente', () => {
    cy.contains('Registrar Cliente').click();
    cy.url().should('include', '/register');
  });

  it('faz logout ao clicar em Sair', () => {
    cy.contains('Sair').click();
    cy.url().should('include', '/login');
  });
});
