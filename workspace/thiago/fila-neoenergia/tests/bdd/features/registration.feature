Feature: Cadastro de Cliente na Fila
  Como operador do atendimento NEOENERGIA
  Quero registrar clientes na fila
  Para organizar o atendimento no BAHIA FARM 2026

  Background:
    Given o operador está autenticado com o PIN "1234"

  Scenario: Registro bem-sucedido de cliente
    When preencho nome "João Silva", telefone "71999887766", horário "14:30"
    And confirmo o cadastro
    Then o cliente aparece na fila com status "Aguardando"
    And uma mensagem de sucesso é exibida

  Scenario: Telefone inválido
    When preencho nome "Maria Santos", telefone "123", horário "15:00"
    And confirmo o cadastro
    Then vejo o erro "Telefone inválido — use DDD + número (ex: 71999887766)"
    And nenhum cliente é adicionado à fila

  Scenario: Nome em branco
    When deixo o campo nome em branco e preencho telefone "71999887766", horário "14:00"
    And confirmo o cadastro
    Then vejo o erro de validação no campo nome

  Scenario: Horário em branco
    When preencho nome "Carlos Lima", telefone "71988776655"
    And deixo o horário em branco
    And confirmo o cadastro
    Then vejo o erro de validação no campo horário
