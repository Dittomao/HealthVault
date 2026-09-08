---
name: git-commit
description: Team standard for generating unified git commit messages
---

# Git Commit Message Standards

When generating git commit messages, always strictly follow the conventional commits specification:

1. **Format**: `<type>(<optional scope>): <description>`
2. **Types allowed**:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation only changes
   - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
   - `refactor`: A code change that neither fixes a bug nor adds a feature
   - `perf`: A code change that improves performance
   - `test`: Adding missing tests or correcting existing tests
   - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Examples:**
- `feat(auth): implement Supabase user login`
- `fix(ui): resolve overflow issue on mobile dashboard`
- `docs: update README with new environment variables`
