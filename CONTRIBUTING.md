# Contributing

## Local setup

**Requirements:** Node ≥ 18, pnpm

```bash
git clone https://github.com/tupe12334/tools-view.git
cd tools-view
pnpm install
```

**Build:**

```bash
pnpm build        # one-shot build → dist/
pnpm dev          # watch mode
```

**Test locally against your own skills:**

```bash
node dist/index.js
```

Run from inside any repo with `.claude/skills/`, or from within this repo itself.
