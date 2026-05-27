describe('Cadastro de Cliente', () => {
  beforeEach(() => {
    cy.loginAsOperator();
    cy.visit('/register');
  });

  it('exibe formulário com campos obrigatórios', () => {
    cy.get('[id="customer_name"]').should('be.visible');
    cy.get('[id="phone"]').should('be.visible');
    cy.get('[id="scheduled_time"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.contains('Cancelar').should('be.visible');
  });

  it('exibe erro para telefone inválido', () => {
    cy.get('[id="customer_name"]').type('João Silva');
    cy.get('[id="phone"]').type('123');
    cy.get('[id="scheduled_time"]').type('14:30');
    cy.get('button[type="submit"]').click();
    cy.contains('Telefone inválido').should('be.visible');
  });

  it('exibe erro para nome em branco', () => {
    cy.get('[id="phone"]').type('71999887766');
    cy.get('[id="scheduled_time"]').type('14:30');
    cy.get('button[type="submit"]').click();
    cy.contains('Nome deve ter ao menos').should('be.visible');
  });

  it('cancela e volta para o painel', () => {
    cy.contains('Cancelar').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('volta para o painel com o botão voltar', () => {
    cy.contains('← Voltar').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
