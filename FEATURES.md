# Funcionalidades do Projeto

## Perfis de Usuário e Permissões

- **Status**: concluído
- **Descrição**: o sistema terá 3 papéis de usuário, com escopos de acesso diferentes.
- **Regras de negócio**:
  - **MASTER**: perfil do dono do sistema. Cria contas de ADM e de COLABORADOR. Acesso irrestrito a qualquer informação do sistema.
  - **ADM**: cria contas de COLABORADOR. Acesso **global** — não existe vínculo fixo entre ADM e colaborador, ou seja, qualquer ADM pode visualizar o relatório de qualquer colaborador do sistema (não só os que ele mesmo criou). Pode adicionar observações no relatório mensal e publicar avisos no quadro de avisos.
  - **COLABORADOR**: acesso à Home (alertas pessoais + quadro de avisos) e ao Planner. Preenche os próprios registros diários.

## Criação e Gerenciamento de Contas

- **Status**: concluído
- **Descrição**: forma de provisionamento de novos usuários no sistema.
- **Regras de negócio**:
  - Não haverá cadastro público (`/signup` atual deve ser removido/desativado).
  - MASTER cria contas de ADM e COLABORADOR; ADM cria contas de COLABORADOR.
  - A criação é feita com e-mail + **senha provisória** definida por quem está criando a conta.
  - O usuário deve trocar a senha provisória no primeiro login.

## Planner

- **Status**: concluído
- **Descrição**: aba com um calendário em tela cheia onde o COLABORADOR registra suas atividades diárias. Ao clicar em uma data, abre o preenchimento do dia. Além dos dias, o mês como um todo tem seus próprios campos e imagens anexadas.
- **Regras de negócio**:
  - Campos preenchidos por dia (todos em texto livre):
    - Atividades realizadas pela manhã
    - Atividades realizadas à tarde
  - Campos preenchidos por mês, não vinculados a um dia específico (todos em texto livre):
    - Planejamento
    - Lições aprendidas
    - Próximos passos
  - O mês também permite anexar **imagens com legenda**, sem vínculo a um dia específico.
  - O COLABORADOR pode editar livremente os dias e os campos/imagens do **mês corrente**.
  - Ao virar o mês, os dias e os campos/imagens daquele mês **travam** e não podem mais ser editados.
  - Dias sem preenchimento (falta, folga, fim de semana etc.) simplesmente ficam vazios no relatório — não exigem justificativa.

## Relatório Mensal

- **Status**: planejado
- **Descrição**: documento consolidado a partir dos dias preenchidos no Planner de um colaborador em um mês, acessado por ADM/MASTER.
- **Regras de negócio**:
  - Montado **sob demanda** (não há geração/fechamento automático) — sempre reflete o estado atual do Planner, inclusive de um mês ainda em andamento.
  - Qualquer ADM/MASTER pode acessar o relatório de qualquer colaborador (acesso global, ver [[Perfis de Usuário e Permissões]]).
  - ADM pode adicionar uma **observação/parecer geral por relatório** (nível do relatório mensal como um todo, não por dia individual).
  - Deve ser possível **exportar o relatório em PDF**.

## Home — Quadro de Avisos

- **Status**: concluído
- **Descrição**: mural de mensagens visível para todos os colaboradores, funcionando como uma **timeline estilo Instagram** (feed de posts/posters em ordem cronológica), e não como uma lista simples de avisos.
- **Regras de negócio**:
  - Apenas MASTER e ADM podem publicar posts.
  - O quadro é **global** — visível para todos os colaboradores, sem segmentação por equipe.
  - Cada post pode conter **imagem opcional** (poster/flyer) e texto/legenda — imagem não é obrigatória.
  - Colaboradores podem **comentar** nos posts (sem curtidas/reações).
  - Quem publicou (ou qualquer ADM/MASTER, dado o acesso global) pode **editar** o post depois de publicado.

## Home — Alertas

- **Status**: planejado
- **Descrição**: área separada do quadro de avisos. Alertas **não são gerados automaticamente pelo sistema** — são criados manualmente por um ADM/MASTER e direcionados a um colaborador específico (ex.: um aviso individual sobre algo do relatório dele).
- **Regras de negócio**:
  - Criado por ADM/MASTER, sempre direcionado a **um colaborador específico** (não é broadcast como o quadro de avisos).
  - Visível para o colaborador destinatário na sua Home.
  - Exige **confirmação de leitura** — o colaborador precisa marcar o alerta como lido/ciente.
  - ADM/MASTER pode ver se o alerta foi confirmado pelo colaborador.
  - Quem criou (ou qualquer ADM/MASTER, dado o acesso global) pode **editar** o alerta depois de criado.

## Meu Perfil

- **Status**: concluído
- **Descrição**: o nome do usuário logado aparece no cabeçalho e, ao clicar, leva para `/perfil`, onde ele preenche/edita os dados usados nos relatórios.
- **Regras de negócio**:
  - Campos editáveis: Nome Completo, Gerência Regional de Saúde, Celular (Whatsapp).
  - E-mail é exibido mas não é editável nessa tela — é o e-mail de login (`auth.users`); alterá-lo é responsabilidade de um administrador.
  - Cada usuário só edita o próprio perfil (RLS já existente em `public.profiles`).

## Pontos em aberto / a definir

- Recursos adicionais do quadro de avisos (fixar post, expiração automática).
- Se é possível **remover** um post do mural ou um alerta já publicado (por ora só está definida a edição).
- Se o ADM pode editar ou remover uma observação já feita em um relatório mensal.
