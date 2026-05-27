Feature: Operações de Fila
  Como operador do atendimento NEOENERGIA
  Quero controlar a fila de clientes
  Para garantir atendimento organizado no BAHIA FARM 2026

  Background:
    Given o operador está autenticado com o PIN "1234"
    And existem clientes na fila aguardando

  Scenario: Chamar próximo cliente
    When clico em "Chamar Próximo"
    Then o primeiro cliente por horário muda para "Em atendimento"
    And a tela de chamada exibe o nome do cliente

  Scenario: Marcar cliente como ausente
    Given um cliente está "Em atendimento"
    When clico em "Ausente"
    Then o status muda para "Ausente"

  Scenario: Finalizar atendimento
    Given um cliente está "Em atendimento"
    When clico em "Finalizar"
    Then o status muda para "Finalizado"
    And o cliente sai da lista de espera

  Scenario: Retornar cliente ausente
    Given um cliente está com status "Ausente"
    When clico em "Retornar" no card do cliente
    Then o status volta para "Aguardando"
    And o cliente retorna à fila

  Scenario: Fila vazia
    Given a fila está vazia
    When tento clicar em "Chamar Próximo"
    Then o botão está desabilitado
