# GitHub Branch Protection Setup

This document provides step-by-step instructions for configuring branch protection rules to ensure code quality and security.

## Overview

Branch protection rules prevent direct commits to important branches and enforce quality checks before merging pull requests. This ensures all code changes are reviewed and tested before reaching production.

## Recommended Protection Rules

### Main Branch (`main`)

The `main` branch represents production-ready code. It should have the strictest protection rules.

#### Configuration Steps

1. Navigate to your repository on GitHub
2. Click **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `main`
4. Configure the following settings:

#### Required Settings ✅

**Branch name pattern**: `main`

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1** (minimum, increase for larger teams)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS file exists)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks** (select all that apply):
    - `Lint & Type Check`
    - `Run Tests`
    - `Build Frontend`
    - `Build Backend`
    - `Security Scan`

- [x] **Require conversation resolution before merging**
  - All PR comments must be resolved before merge

- [x] **Require signed commits** (optional but recommended)
  - Ensures commits are verified

- [x] **Require linear history** (optional)
  - Prevents merge commits, enforces rebase or squash

- [x] **Include administrators**
  - Apply rules to repository administrators

- [x] **Restrict who can push to matching branches**
  - Only allow specific users/teams to push (if needed)
  - Most teams should leave this unchecked to allow PR merges

- [x] **Allow force pushes**: **Disabled**
  - Prevents force push to main branch

- [x] **Allow deletions**: **Disabled**
  - Prevents accidental branch deletion

#### Recommended Settings 📋

- [ ] **Require deployments to succeed before merging** (if you have preview deployments)
- [ ] **Lock branch** (only for extreme cases, prevents all changes)

---

### Develop Branch (`develop`)

The `develop` branch is for integration and pre-release testing. It should have moderate protection.

#### Configuration Steps

1. Click **Add rule** for `develop` branch
2. Configure similar to `main` but with relaxed requirements:

**Branch name pattern**: `develop`

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [ ] Dismiss stale pull request approvals (optional for develop)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks**:
    - `Lint & Type Check`
    - `Run Tests`
    - `Build Frontend`
    - `Build Backend`

- [x] **Require conversation resolution before merging**

- [ ] **Include administrators** (optional, allows admins to bypass for hotfixes)

- [x] **Allow force pushes**: **Disabled**
- [x] **Allow deletions**: **Disabled**

---

### Feature Branch Pattern (`feature/*`, `fix/*`, `chore/*`)

Optional: Add protection for feature branches to enforce CI checks.

**Branch name pattern**: `feature/*` (add separate rules for `fix/*`, `chore/*`)

- [x] **Require status checks to pass before merging**
  - **Required status checks**:
    - `Lint & Type Check`
    - `Run Tests`

---

## Rulesets (Alternative to Branch Protection)

GitHub Rulesets provide more flexibility than traditional branch protection. Consider using rulesets for:
- Pattern-based rules (e.g., `release/*`, `hotfix/*`)
- Tag protection
- Bypass permissions for specific scenarios

### Creating a Ruleset

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset**
3. Choose **Branch ruleset**
4. Configure similar rules as above

---

## CODEOWNERS File

Create a `CODEOWNERS` file to automatically request reviews from specific people or teams.

**Location**: `.github/CODEOWNERS`

```plaintext
# Default owners for everything
* @your-username @your-team

# Frontend code
/apps/ruach-next/** @frontend-team
/packages/ruach-components/** @frontend-team

# Backend code
/ruach-ministries-backend/** @backend-team

# Infrastructure and deployment
/.github/workflows/** @devops-team
/Dockerfile @devops-team
/docker-compose.yml @devops-team

# Security-sensitive files
/ruach-ministries-backend/src/api/auth/** @security-team
/ruach-ministries-backend/src/services/token-*.js @security-team

# Configuration files
/.env.example @devops-team @security-team
/config/** @devops-team
```

---

## Required GitHub Actions Secrets

For CI/CD to work with branch protection, configure these secrets:

### Repository Secrets

Navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Required for All Environments:

- `NEXTAUTH_SECRET` - NextAuth.js secret (generate: `openssl rand -base64 48`)
- `NEXT_PUBLIC_STRAPI_URL` - Strapi backend URL
- `NEXTAUTH_URL` - Frontend application URL

#### Required for Docker Build & Deploy:

- `DO_REGISTRY_URL` - DigitalOcean Container Registry URL (e.g., `registry.digitalocean.com/your-registry`)
- `DO_REGISTRY_TOKEN` - DigitalOcean API token with registry access
- `DO_HOST` - Production server IP or hostname
- `DO_USERNAME` - SSH username for deployment
- `DO_SSH_KEY` - SSH private key for deployment
- `DO_SSH_PORT` - SSH port (default: 22)

#### Optional:

- `CODECOV_TOKEN` - For test coverage reporting
- `SLACK_WEBHOOK_URL` - For deployment notifications
- `SENTRY_DSN` - For error monitoring

---

## Environment Protection Rules

For production deployments, add environment protection:

1. Go to **Settings** → **Environments**
2. Click **New environment** or select existing (e.g., `production`)
3. Configure:
   - [x] **Required reviewers** (1-6 people who must approve deployments)
   - [x] **Wait timer** (optional delay before deployment)
   - [x] **Deployment branches** (restrict to `main` only)

---

## Status Check Configuration

The CI/CD workflow (`.github/workflows/ci.yml`) defines these status checks:

| Status Check Name | Description | Required For |
|-------------------|-------------|--------------|
| `Lint & Type Check` | ESLint and TypeScript validation | `main`, `develop` |
| `Run Tests` | Unit and integration tests | `main`, `develop` |
| `Build Frontend` | Next.js build verification | `main`, `develop` |
| `Build Backend` | Strapi build verification | `main`, `develop` |
| `Security Scan` | npm audit and env validation | `main` |
| `Docker Build - Frontend` | Docker image build | `main` (deploy) |
| `Docker Build - Backend` | Docker image build | `main` (deploy) |
| `Deploy to Production` | Production deployment | `main` (manual approval) |

---

## Verification

After configuring branch protection:

1. **Test with a dummy PR**:
   ```bash
   git checkout -b test-branch-protection
   echo "test" > test.txt
   git add test.txt
   git commit -m "test: verify branch protection"
   git push origin test-branch-protection
   ```

2. **Create PR** to `main` or `develop`

3. **Verify the following**:
   - Cannot merge without required checks passing
   - Cannot merge without approval (if configured)
   - Status checks run automatically
   - Cannot push directly to protected branch

4. **Clean up**:
   ```bash
   git checkout main
   git branch -D test-branch-protection
   git push origin --delete test-branch-protection
   ```

---

## Troubleshooting

### "Required status checks are failing"

- Check the Actions tab for error details
- Ensure all required environment variables are set
- Verify your code passes `pnpm lint` and `pnpm typecheck` locally

### "Cannot find status check"

- Status checks must run at least once before they appear in the dropdown
- Create a PR to trigger the workflow first
- Then add the check to branch protection

### "Administrators can bypass these settings"

- This is expected if you checked "Include administrators"
- Uncheck to enforce rules on everyone
- Or use the bypass only for emergency hotfixes

### "Required approvals not showing"

- Ensure you've selected "Require a pull request before merging"
- Set the number of required approvals
- Note: PR author cannot approve their own PR

---

## Best Practices

1. **Start simple**: Begin with just CI checks required, add more rules gradually
2. **Test thoroughly**: Verify branch protection with test PRs before enforcing
3. **Document exceptions**: If you need to bypass protection, document why
4. **Review regularly**: Audit protection rules quarterly
5. **Use CODEOWNERS**: Automatically route reviews to correct teams
6. **Monitor compliance**: Check that rules are being followed
7. **Update as needed**: Adjust rules as team size and workflow evolve

---

## Quick Setup Checklist

For a new repository:

- [ ] Create `.github/workflows/ci.yml` (already done)
- [ ] Set up required GitHub Actions secrets
- [ ] Configure branch protection for `main`
- [ ] Configure branch protection for `develop`
- [ ] Create `.github/CODEOWNERS` file
- [ ] Set up environment protection for `production`
- [ ] Test with a PR to verify all checks run
- [ ] Document any custom rules in team wiki
- [ ] Train team on PR workflow
- [ ] Set up notifications for failed builds

---

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [CODEOWNERS Syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated**: 2025-10-24
**Version**: 1.0
**Status**: Production Ready ✅
