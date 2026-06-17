# QuAIto

Digital implementation of the [Quarto](https://en.wikipedia.org/wiki/Quarto_(board_game)) board game with AI opponents.

Built with React 19, TypeScript, Vite, and plain CSS.

## Cursor rules

Development conventions and domain context for AI assistants live in `.cursor/rules/`:

| File | Purpose |
|------|---------|
| `common-SPA.mdc` | Shared Smart Games SPA conventions (symlink) |
| `common-react-architecture.mdc` | Shared React architecture (symlink) |
| `quaito.mdc` | App overview, file map, stack overrides |
| `quaito-game-rules.mdc` | Quarto rules and domain model |
| `quaito-ai.mdc` | Heuristic AI and MCTS module |
| `quaito-ui.mdc` | CSS layout and piece styling |

See [`.cursor/rules/README.md`](.cursor/rules/README.md) for shared-rules setup.

## Getting started

```bash
npm install
npm run dev
npm run build
```

## Player help

Strategy tips and full game rules are available in the in-game help modal.
