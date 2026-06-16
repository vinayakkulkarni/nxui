<!--
  Thanks for contributing to nxui! Please fill out the sections below.
  Keep the PR focused — one logical change per pull request.
-->

## Description

<!-- What does this PR do and why? Link any related issues. -->

Closes #

## Type of change

<!-- Check all that apply. -->

- [ ] `fix` — bug fix (non-breaking change that fixes an issue)
- [ ] `feat` — new component or feature (non-breaking change that adds functionality)
- [ ] `docs` — documentation only
- [ ] `refactor` — code change that neither fixes a bug nor adds a feature
- [ ] `chore` — tooling, dependencies, or build changes
- [ ] Breaking change (fix or feature that would change existing behavior)

## Checklist

- [ ] My commits follow [Conventional Commits](https://www.conventionalcommits.org) and are signed (`git commit -S`)
- [ ] `pnpm run lint` passes with 0 errors and 0 warnings
- [ ] `pnpm run format:check` passes
- [ ] `pnpm run build` completes successfully
- [ ] For a new component: it is wired into `scripts/build-registry.ts` and `app/config/docs.ts`, has a doc page + demo, and `pnpm run build:registry` succeeds
- [ ] I have tested my changes in both light and dark mode
- [ ] Types live in `app/types/` (no inline `interface`/`type` in `.vue` files), no `any`

## Screenshots / demo

<!-- For any visual change, include before/after screenshots or a short clip (light + dark mode). -->
