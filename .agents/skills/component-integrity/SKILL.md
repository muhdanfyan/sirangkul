# Skill: React Component Integrity Verification

## Problem
Adding logic to functional components without verifying state declarations leads to `ReferenceError` and production crashes.

## Mandatory Checklist
1. **State Declaration**: If you call `setX`, search for `const [x, setX] = useState`. If it doesn't exist, **DO NOT PUSH**.
2. **Prop Consistency**: Ensure any new props added to shared components (like `api.ts` interfaces) are updated in ALL pages consuming that interface.
3. **Local Build Check**: Always run `npm run build` locally before syncing to VPS. A broken reference will fail the build.
