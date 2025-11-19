# CI/CD Setup Notes

## Installation Issue with Optional Dependencies

If you encounter errors about missing `@rollup/rollup-linux-x64-gnu` or other platform-specific optional dependencies during CI builds, ensure that optional dependencies are included during installation.

### Solution

In your CI workflow (e.g., GitHub Actions), use one of the following:

**Option 1: Use npm ci with include flag**
```bash
npm ci --include=optional
```

**Option 2: Use npm install instead of npm ci**
```bash
npm install
```

**Option 3: Use the npm script**
```bash
npm run ci
```

### Why this happens

Rollup uses platform-specific optional dependencies for native binaries. When `npm ci` runs in CI (Linux), it may skip optional dependencies if they fail to install, even though they're listed in `package-lock.json`. Using `--include=optional` ensures these dependencies are installed.

### Example GitHub Actions workflow

```yaml
- name: Install dependencies
  run: npm ci --include=optional
  working-directory: ./web
```

