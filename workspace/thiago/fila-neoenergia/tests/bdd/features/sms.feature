Feature: Notificação por SMS
  Como operador do atendimento NEOENERGIA
  Quero enviar SMS para os clientes
  Para avisá-los quando sua vez está próxima

  Background:
    Given o operador está autenticado com o PIN "1234"

  Scenario: SMS automático ao chamar próximo
    Given o cliente "A" está em atendimento
    And o cliente "B" é o próximo da fila com sms_sent = false
    When o cliente "A" é finalizado
    Then a Edge Function envia SMS para o cliente "B"
    And o campo sms_sent fica true para o cliente "B"

  Scenario: SMS manual pelo operador
    Given existe um cliente "Carlos" aguardando na fila
    When clico em "SMS" no card do cliente "Carlos"
    Then o badge de status exibe "Enviando…"
    And após confirmação exibe "Enviado"

  Scenario: Idempotência — SMS não enviado duas vezes
    Given o cliente "B" já tem sms_sent = true
    When a Edge Function é chamada novamente para o mesmo cliente
    Then o SMS não é enviado novamente
    And a resposta indica "already_sent"
