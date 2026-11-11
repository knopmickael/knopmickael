# Mickael Knop · Portfólio

Um portfólio frontend-only com direção visual editorial, temas claro/escuro e conteúdo inteiramente editável em [`portfolio.json`](./portfolio.json). HTML, CSS e JavaScript nativos; sem dependências de runtime ou instalação de pacotes.

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
| `projectsSection`, `projects` | Categorias, projetos, links e detalhes |
| `expertise` | Grupos de competências e estudos atuais |
| `experience` | Histórico profissional e tecnologias utilizadas |
| `contact`, `footer` | Chamada de contato, link para copiar e rodapé |

### Adicionar um projeto

Duplique um objeto em `projects` e altere seus dados. Use um `id` único e uma `category` que exista em `projectsSection.categories`. O filtro `all` reúne os projetos automaticamente. Os contadores acompanham o JSON.

```json
{
  "id": "meu-projeto",
  "number": "05",
  "title": "Meu projeto",
  "category": "backend",
  "type": "API & INTEGRAÇÕES",
  "description": "Uma descrição objetiva da solução.",
  "tags": ["Java", "Spring Boot"],
  "url": "https://github.com/seu-usuario/seu-projeto",
  "visual": {
    "type": "pipeline",
    "label": "Diagrama conceitual de uma API conectada a um fluxo assíncrono.",
    "eyebrow": "API / WORKFLOW",
    "title": "Uma solução.\nUm fluxo claro.",
    "subtitle": "PROCESSAMENTO ASSÍNCRONO",
    "items": ["API", "Evento", "Fila", "Worker"],
    "footer": "REQUEST → EVENT → QUEUE → JOB"
  },
  "details": [
    { "title": "O desafio", "text": "Qual problema o projeto resolve." },
    { "title": "A implementação", "text": "Sua contribuição e as decisões relevantes." }
  ]
}
```

As ilustrações são composições originais em HTML/CSS, identificadas como **conceituais** na descrição acessível. Os modelos disponíveis são `cinema` (três itens), `pipeline` (quatro), `cluster` (processo principal e três workers) e `document` (três). Não são screenshots nem demonstrações conectadas a APIs.

Os identificadores de seção (`sobre`, `projetos`, `repertorio`, `experiencia`, `contato`) e das camadas (`interface`, `domain`, `foundation`) são estruturais; preserve-os. O validador detecta erros de navegação, IDs de projetos duplicados, categorias desconhecidas e links inválidos. Execute `npm run check` após editar.

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

O artefato `dist/` usa uma lista explícita de arquivos públicos. A pasta `kb/`, os testes, os scripts e a documentação não são publicados no Pages. `kb/` também está no `.gitignore`, pois contém material de referência interno.

## Decisões de conteúdo

O perfil utiliza os arquivos profissionais fornecidos em `kb/`. Os quatro repositórios destacados tiveram sua descrição conferida nos READMEs públicos. Não foram adicionadas métricas não comprovadas, certificações ou dados de clientes.

O período atual da Datainfo é consistente nas fontes. As experiências anteriores são apresentadas sem datas específicas, pois a base fornecida registra divergências cronológicas. Edite os campos `period` após confirmar as datas. O e-mail marcado como interno não foi publicado; o contato utiliza os perfis profissionais públicos.

## Acessibilidade e funcionamento

- HTML semântico, link para pular ao conteúdo e hierarquia de títulos.
- Links para navegação; botões para ações e filtros com estado `aria-pressed`.
- Menu mobile com estado expandido, fechamento por Escape e gerenciamento de foco ao sair.
- Detalhes de projetos em `<dialog>` nativo, com contenção de foco, Escape e retorno ao botão de origem.
- Histórico com `<details>` e `<summary>` acessíveis por teclado.
- Respeito a `prefers-reduced-motion`, foco visível e adaptação a telas estreitas.
- Estados de carregamento, erro do JSON com nova tentativa, seleção vazia e feedback de cópia.
- Metadados e mensagem para JavaScript desativado incorporados ao HTML pelo build a partir do JSON.

O roteiro [`tests/browser.mjs`](./tests/browser.mjs) contém regressões de menu mobile (inclusive clique no SVG), foco, diálogo, filtros, conteúdo longo, reflow de 320 a 1440 px, estado vazio, carregamento, falha e nova tentativa. Com o servidor rodando e uma aba aberta no site, execute o arquivo pelo parâmetro `filename` de `playwright_browser_run_code_unsafe` no Playwright MCP. A instância `page` é fornecida pelo MCP; nenhuma dependência é adicionada ao site. `npm run check` executa os testes Node e verifica a sintaxe desse roteiro; os testes de navegador são executados separadamente pelo MCP.

O site precisa de JavaScript para renderizar o portfólio. Sem JavaScript, o HTML gerado oferece os contatos públicos como alternativa. As fontes Manrope e IBM Plex Mono são carregadas do Google Fonts com `display=swap`; se o serviço estiver indisponível, as fontes de sistema assumem o layout. Não há analytics, backend, formulário com envio ou autenticação.

## Estrutura

```text
portfolio.json                   # Todo o conteúdo editável
index.html                       # Estrutura e entrada da aplicação
app.js                           # Renderização e interações
styles.css                       # Tokens, componentes, temas e responsividade
lib/content.js                   # Validação, filtros e geração do currículo
assets/favicon.svg               # Marca do navegador
scripts/site.mjs                 # Compilação de metadados e lista pública
scripts/serve.mjs                # Servidor local, inclusive em subdiretório
scripts/build.mjs                # Build estático sem dependências
tests/content.test.mjs           # Regressões de conteúdo e comportamento
tests/browser.mjs                # Regressões executáveis pelo Playwright MCP
.github/workflows/pages.yml      # Publicação no GitHub Pages
```
