# Skill: SQL Strict Mode Compliance (MySQL)

## Problem
Laravel queries often fail in production if they don't comply with `ONLY_FULL_GROUP_BY` strict mode, common in Ubuntu/VPS environments.

## Prevention Rules
1. **Never** use `orderBy('created_at')` in a `groupBy` query unless `created_at` is in the group.
2. **Always** use `orderByRaw('MIN(column)')` or `orderByRaw('MAX(column)')` for chronological ordering inside aggregate queries.
3. **Audit**: Run query testing on a strict-mode local environment before pushing.
