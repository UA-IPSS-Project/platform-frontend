# Agendamento de Marcações App

Aplicação frontend em React + Vite para gestão de marcações.

## Requisitos

- Node.js (recomendo v16+ ou v18+)
- npm (ou `pnpm`/`yarn` se preferir)

## Instalação

Instala as dependências com:

```bash
npm install
```

## Executar em desenvolvimento

Inicia o servidor de desenvolvimento (hot-reload):

```bash
npm run dev
```

Abre a aplicação em `http://localhost:5173` (porta por defeito do Vite).

## Build para produção

Gera a versão de produção na pasta `build`:

```bash
npm run build
```

Para ver a build localmente podes usar o preview do Vite:

```bash
npx vite preview
```

ou servir com qualquer servidor estático apontando para a pasta `build/`.

## Scripts úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — gera build de produção
- `npx vite preview` — serve a build localmente para testes

## Notas

- O projecto usa Vite como bundler/servidor de desenvolvimento (ver `package.json`).
- O diretório `build/` está ignorado por `.gitignore` e deixará de ser versionado.

Se quiseres, actualizo também o `package.json` para adicionar um script `preview` (`"preview": "vite preview"`).
### Making a Progressive Web App
