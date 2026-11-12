# Mickael Knop · Portfólio

Um portfólio estático com direção visual editorial, temas claro/escuro, carrossel de projetos e conteúdo inteiramente editável em [`portfolio.json`](./portfolio.json). Inclui um **CMS local** que lê e grava esse arquivo. HTML, CSS e JavaScript nativos; sem dependências de runtime ou instalação de pacotes.

## Rodar localmente

Requer **Node.js 22 ou superior**.

```sh
npm run dev
```

Abra **http://127.0.0.1:4173**. Atualize a página depois de editar os arquivos; o servidor sempre entrega a versão atual. Não é necessário executar `npm install`.

```sh
npm run check                 # Sintaxe, validação do JSON e testes de comportamento
npm run build                 # Gera somente os arquivos públicos em dist/
npm run preview               # Serve o build em http://127.0.0.1:4173
```

Porta, interface e subdiretório podem ser configurados:

```sh
npm run dev -- --port 3000
npm run preview -- --port 4174 --base /portfolio/
```

O servidor também aceita `PORT` e `HOST`. Abrir `index.html` diretamente com `file://` não funciona, pois o navegador precisa buscar o JSON por HTTP.

## CMS local

```sh
npm run cms
```

- **Painel:** http://127.0.0.1:4180/cms/
- **Site com o conteúdo salvo:** http://127.0.0.1:4180/
- Para escolher uma porta: `npm run cms -- --port 4181`.

O próprio processo do CMS também serve o site; basta esse comando para editar e conferir o resultado. Ele escuta exclusivamente em `127.0.0.1`. Use o endereço exato exibido no terminal.

### Fluxo de edição

1. Ao abrir, o CMS lê o `portfolio.json` do disco e preenche os formulários com os dados atuais.
2. Em **Projetos**, crie, edite, remova, busque e reordene os itens. Os campos incluem descrição, tecnologias, blocos de detalhes, visibilidade do código, URL do repositório e URL do site/demo.
3. **Aplicar projeto** atualiza o rascunho do painel.
4. **Salvar no JSON** valida e grava o rascunho no `portfolio.json`. Atualize a aba do site para visualizar.
5. Em **Conteúdo do site**, escolha uma seção. Os formulários são gerados a partir dos valores e tipos atuais do JSON; listas permitem adicionar, remover e ordenar itens. As mudanças nesses campos atualizam diretamente o rascunho.

O painel avisa sobre alterações não salvas. **Exportar rascunho** baixa uma cópia JSON; **Recarregar** descarta o rascunho e relê o arquivo. Uma mudança no arquivo por outra aba ou editor bloqueia a gravação com conflito: exporte suas alterações, recarregue e reaplique o necessário.

Antes de cada gravação, a versão anterior é copiada para **`.cms/portfolio.backup.json`**. A gravação do conteúdo usa arquivo temporário e renomeação. O backup é local e fica fora do Git e da publicação.

### Ordem dos projetos

Use as setas **↑ / ↓** na lista do CMS para definir a sequência e clique em **Salvar no JSON**. O portfólio exibe todos os projetos exatamente nessa ordem, conforme o array `projects`, sem agrupamento ou filtros de categoria. A busca do CMS ajuda a localizar projetos e preserva a sequência dos resultados.

### Galerias e capa do projeto

Cada projeto pode usar:

| Apresentação | Comportamento |
| --- | --- |
| **Galeria** | Aceita várias imagens PNG, JPEG e WebP, de até 8 MB **cada**, incluindo formatos wide e mobile. Cada imagem tem prévia e texto alternativo obrigatório. Permite adicionar, remover, reordenar e escolher uma imagem como **capa do projeto**. |
| **Visual técnico — sem screenshot** | Salva `visual.type: "repository"`. O site mostra uma capa tipográfica com o título e tecnologias, adequada a projetos sem interface visual ou deploy. |

A capa escolhida abre a galeria no card e nos detalhes. A interface mostra somente os botões **anterior/próxima** sobre a imagem, sem barra, contador ou legenda visível. A navegação também funciona por teclado (ArrowLeft/ArrowRight/Home/End) e deslize em telas de toque; a posição e o texto alternativo continuam disponíveis aos leitores de tela. Prints wide e mobile são exibidos com `object-fit: contain`, sem recorte. Remover a capa seleciona a primeira imagem restante. Galerias precisam de pelo menos uma imagem; com apenas uma, as setas ficam desativadas.

Os arquivos são copiados para `assets/projects/`, com nomes gerados, ao aplicar o projeto; os vínculos no JSON só são persistidos em **Salvar no JSON**. Imagens já enviadas são reutilizadas ao editar. Imagens antigas ou de rascunhos descartados não são apagadas automaticamente. Todas as imagens referenciadas pela galeria entram no build publicado, não apenas a capa.

As URLs de repositório e de site/demo são **opcionais e independentes**. Um projeto privado pode ter imagem e demo pública sem URL de código, ou não ter link algum. O site só cria os links preenchidos e mostra “Código privado” quando essa visibilidade é escolhida. Os links preenchidos devem usar HTTPS.

## Personalizar o conteúdo

**O arquivo `portfolio.json`, no mesmo diretório de `index.html`, é a fonte de conteúdo.** Inclui nomes, metadados, navegação, títulos, descrições, links, textos acessíveis, mensagens de estado, ilustrações, tecnologias, experiências, contato e rodapé.

| Chave | O que editar |
| --- | --- |
| `meta` | Título, descrição, idioma, cor do navegador e tema padrão (`dark` ou `light`) |
| `ui` | Textos de botões, acessibilidade, carregamento, erro e feedback |
| `profile` | Nome, marca, apresentação, localização, links e formação |
| `navigation`, `header` | Navegação e chamada de contato |
| `hero`, `system` | Apresentação e camadas do diagrama interativo |
| `technologyStrip`, `about` | Tecnologias, biografia e destaques |
| `projectsSection`, `projects` | Apresentação da seção, projetos em ordem, links e detalhes |
| `expertise` | Grupos de competências do Repertório Técnico |
| `experience` | Histórico profissional e tecnologias utilizadas |
| `contact`, `footer` | Chamada de contato, link para copiar e rodapé |

### Adicionar um projeto

Use **Novo projeto** no CMS, ou duplique um objeto em `projects` e altere seus dados. Não há limite fixo de quatro projetos. Use um `id` único. A ordem dos objetos no array define a sequência do carrossel; o CMS atualiza a numeração ao reordenar ou remover itens.

```json
{
  "id": "meu-projeto",
  "number": "05",
  "title": "Meu projeto",
  "type": "API & INTEGRAÇÕES",
  "description": "Uma descrição objetiva da solução.",
  "tags": ["Java", "Spring Boot"],
  "url": "https://github.com/seu-usuario/seu-projeto",
  "visual": {
    "type": "repository"
  },
  "details": [
    { "title": "O desafio", "text": "Qual problema o projeto resolve." },
    { "title": "A implementação", "text": "Sua contribuição e as decisões relevantes." }
  ]
}
```

O esquema atual (`schemaVersion: 4`) usa somente `repository` e `gallery` para os visuais e não possui categorias de projetos. A capa é o índice da imagem no array, começando em zero. Por exemplo:

```json
"visual": {
  "type": "gallery",
  "cover": 1,
  "images": [
    { "src": "assets/projects/meu-projeto-wide.png", "label": "Tela inicial no desktop" },
    { "src": "assets/projects/meu-projeto-mobile.png", "label": "Tela inicial no mobile" }
  ]
}
```

Os identificadores de seção (`sobre`, `projetos`, `repertorio`, `experiencia`, `contato`) e das camadas (`interface`, `domain`, `foundation`) são estruturais; preserve-os. O validador detecta erros de navegação, IDs de projetos duplicados, galerias inválidas e links inválidos. Execute `npm run check` após editar.

### Currículo e contato

- **Baixar currículo** gera um arquivo Markdown no próprio navegador, usando os dados atuais do JSON. Não há currículo duplicado para manter.
- O contato abre o LinkedIn. O botão de copiar usa a Clipboard API e apresenta feedback de sucesso ou falha.
- Para alterar o destino, edite `profile.socials`, `contact.primarySocialId` e `contact.copyValue`.
- O tema escolhido é guardado localmente; nenhuma informação é enviada para um servidor.

## Publicar no GitHub Pages

O workflow em [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) valida, gera e publica o site a cada push para `main`.

1. Crie um repositório no GitHub e envie este projeto para a branch `main`.
2. No repositório, abra **Settings → Pages → Build and deployment**.
3. Em **Source**, selecione **GitHub Actions**.
4. Faça um push para `main`, ou execute manualmente **Publish portfolio to GitHub Pages** na aba **Actions**.
5. A URL publicada aparece no job `deploy` e em **Settings → Pages**.

Se sua branch principal tiver outro nome, ajuste `on.push.branches` no workflow.

Todos os caminhos de assets e do JSON são relativos. O mesmo build funciona em `https://usuario.github.io/` e em `https://usuario.github.io/nome-do-repositorio/`, sem configuração de base path. A navegação usa âncoras nativas e não depende de reescrita de rotas.

O artefato `dist/` usa uma lista explícita de arquivos públicos, acrescida das imagens referenciadas pelo JSON. O CMS, suas APIs, backups, a pasta `kb/`, os testes, os scripts e a documentação não são publicados no Pages. `kb/` também está no `.gitignore`, pois contém material de referência interno. Para publicar edições do CMS, envie o `portfolio.json` e as novas imagens em `assets/projects/` para a branch de publicação.

## Decisões de conteúdo

O perfil utiliza os arquivos profissionais fornecidos em `kb/`. Descrições e stacks do acervo inicial foram conferidas nos metadados e READMEs dos repositórios públicos. Os projetos sem screenshots usam visual técnico; adicione galerias pelo CMS conforme tiver imagens disponíveis. Não foram adicionadas métricas não comprovadas, certificações ou dados de clientes.

O período atual da Datainfo é consistente nas fontes. As experiências anteriores são apresentadas sem datas específicas, pois a base fornecida registra divergências cronológicas. Edite os campos `period` após confirmar as datas. O e-mail marcado como interno não foi publicado; o contato utiliza os perfis profissionais públicos.

## Acessibilidade e funcionamento

- HTML semântico, link para pular ao conteúdo e hierarquia de títulos.
- Links para navegação e botões para ações, com nomes acessíveis.
- Menu mobile com estado expandido, fechamento por Escape e gerenciamento de foco ao sair.
- Detalhes de projetos em `<dialog>` nativo, com contenção de foco, Escape e retorno ao botão de origem.
- Carrossel de projetos manual, sem autoplay, na ordem definida pelo CMS, com rolagem por toque/trackpad, setas, indicação da posição e suporte a ArrowLeft/ArrowRight/Home/End quando a região está focada.
- Histórico com `<details>` e `<summary>` acessíveis por teclado.
- Respeito a `prefers-reduced-motion`, foco visível e adaptação a telas estreitas.
- Estados de carregamento, erro do JSON com nova tentativa, acervo vazio e feedback de cópia.
- Metadados e mensagem para JavaScript desativado incorporados ao HTML pelo build a partir do JSON.

O roteiro [`tests/browser.mjs`](./tests/browser.mjs) contém regressões de menu mobile (inclusive clique no SVG), foco, diálogo, ordem dos projetos, conteúdo longo, reflow de 320 a 1440 px, estado vazio, carregamento, falha e nova tentativa. Com o servidor rodando e uma aba aberta no site, execute o arquivo pelo parâmetro `filename` de `playwright_browser_run_code_unsafe` no Playwright MCP. A instância `page` é fornecida pelo MCP; nenhuma dependência é adicionada ao site. `npm run check` executa os testes Node e verifica a sintaxe desse roteiro; os testes de navegador são executados separadamente pelo MCP.

Os testes Node de [`tests/cms.test.mjs`](./tests/cms.test.mjs) cobrem persistência, backup, conflitos, validação, proteção de origem, uploads e publicação de imagens, usando armazenamento temporário. Para testar o CMS no navegador sem alterar o JSON de trabalho, rode **`node tests/serve-cms.mjs`**, abra **http://127.0.0.1:4175/cms/** e execute [`tests/browser-cms.mjs`](./tests/browser-cms.mjs) pelo mesmo Playwright MCP. O roteiro cobre CRUD, ordenação entre CMS e landing, projeto privado, upload real, galerias com botões sobrepostos, editor de conteúdo e layout mobile. Encerre o servidor de teste ao terminar.

O site precisa de JavaScript para renderizar o portfólio. Sem JavaScript, o HTML gerado oferece os contatos públicos como alternativa. As fontes Manrope e IBM Plex Mono são carregadas do Google Fonts com `display=swap`; se o serviço estiver indisponível, as fontes de sistema assumem o layout. O site publicado é estático, sem analytics ou autenticação. Somente o CMS local tem servidor de escrita; ele restringe host/origem e exige token por sessão para alterações.

## Estrutura

```text
portfolio.json                   # Todo o conteúdo editável
index.html                       # Estrutura e entrada da aplicação
app.js                           # Renderização e interações
styles.css                       # Tokens, componentes, temas e responsividade
lib/content.js                   # Validação, filtros e geração do currículo
assets/favicon.svg               # Marca do navegador
assets/projects/                 # Imagens enviadas pelo CMS (criada no primeiro upload)
cms/index.html                   # Entrada do painel local
cms/cms.js                       # Formulários, rascunho e CRUD
cms/cms.css                      # Interface do CMS
scripts/site.mjs                 # Compilação de metadados e lista pública
scripts/serve.mjs                # Servidor local, inclusive em subdiretório
scripts/build.mjs                # Build estático sem dependências
scripts/cms.mjs                  # API e servidor exclusivo para uso local
tests/content.test.mjs           # Regressões de conteúdo e comportamento
tests/cms.test.mjs               # Integração da API, disco, imagens e build
tests/browser.mjs                # Regressões executáveis pelo Playwright MCP
tests/browser-cms.mjs            # Fluxos de edição pelo navegador
tests/serve-cms.mjs              # Cópia temporária para testes manuais/E2E
.github/workflows/pages.yml      # Publicação no GitHub Pages
```
