# QuAIto Cursor rules

| File | Purpose |
|------|---------|
| `common-SPA.mdc` | Symlink → shared SPA + FastAPI conventions |
| `common-react-architecture.mdc` | Symlink → shared React architecture |
| `quaito.mdc` | App overview, file map, stack overrides (always apply) |
| `quaito-game-rules.mdc` | Quarto domain rules and win logic |
| `quaito-ai.mdc` | Heuristic AI and MCTS module |
| `quaito-ui.mdc` | CSS Grid layout and piece styling |

## Layout

```text
QuAIto/
├── .cursor/rules/
│   ├── common-SPA.mdc              →  ../../shared/common-spa/.cursor/rules/common-SPA.mdc
│   ├── common-react-architecture.mdc →  ../../shared/common-spa/.cursor/rules/common-react-architecture.mdc
│   ├── quaito.mdc
│   ├── quaito-game-rules.mdc
│   ├── quaito-ai.mdc
│   └── quaito-ui.mdc
└── shared/
    └── common-spa                  →  ../../common-SPA/   (local dev symlink)
```

Shared rules and React utilities live in the [`common-SPA`](../../common-SPA/) repo. QuAIto consumes them via:

- **Cursor rules:** symlinks above
- **Code:** `"@smart-games/common-spa": "file:./shared/common-spa"` in `package.json`

## Local development

Clone or place repos as siblings under `free-games-SPA/`:

```text
free-games-SPA/
├── common-SPA/
└── QuAIto/
```

Then run `npm install` in QuAIto.

## After common-SPA is on GitHub

Replace the local symlink with a git submodule:

```bash
rm shared/common-spa
git submodule add git@github.com:dfotland/common-SPA.git shared/common-spa
git submodule update --init --recursive
```

Recreate the shared-rules symlinks from the QuAIto root:

```bash
ln -sf shared/common-spa/.cursor/rules/common-SPA.mdc .cursor/rules/common-SPA.mdc
ln -sf shared/common-spa/.cursor/rules/common-react-architecture.mdc .cursor/rules/common-react-architecture.mdc
```

Open **QuAIto/** as the Cursor workspace (not the parent `free-games-SPA/` folder).
