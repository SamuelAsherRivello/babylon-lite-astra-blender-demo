# Template provenance

This repository was cloned from [SamuelAsherRivello/github-repository-template](https://github.com/SamuelAsherRivello/github-repository-template) at commit `54c4b860db322db9d2a3136f3146e2c7bef5bac7`. Its complete Git history, MIT license, creator banner, credits and contact information are preserved. The template documentation images remain under `PROJECT_NAME/documentation/`; its sample screenshot is not presented as this game's output.

The template unexpectedly includes wallet-specific `.openspec/` changes and configuration. They are inherited reference material only. This game's authoritative planning root is **`openspec/`**, beginning with C001; use `npm run spec:validate` from the root. No wallet, blockchain integration, wallet dependencies or transaction behavior is implemented by this demo.

The inherited deployment workflow targeted a nonexistent wallet package. It now targets this project's `dist/` and is manual-only. CI builds and tests on pushes and pull requests. A live demo URL is only added after actual deployment.
