---
inclusion: manual
---

# Git Workflow

## Branch Naming

- Feature: `feature/description` (e.g., `feature/driver-crud`)
- Bugfix: `bugfix/description` (e.g., `bugfix/login-validation`)
- Hotfix: `hotfix/description` (e.g., `hotfix/api-timeout`)
- Refactor: `refactor/description` (e.g., `refactor/modal-components`)

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

Examples:
```
feat(drivers): add driver creation modal

- Implement AddDriverModal component
- Add form validation for driver fields
- Integrate with POST /api/drivers/admin/ endpoint
- Combine firstName and lastName into name field

Closes #123
```

```
fix(auth): handle 401 responses correctly

- Logout user on 401 response
- Redirect to /login after logout
- Clear auth store state

Fixes #456
```

## Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] All acceptance criteria met
- [ ] No console errors

## Screenshots
(if applicable)

## Related Issues
Closes #issue_number
```

## Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] No console.log statements left in code
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] API field names match schema
- [ ] Validation is comprehensive
- [ ] No hardcoded values (use env vars)
- [ ] Comments explain complex logic
- [ ] No duplicate code

## Pre-commit Checklist

- [ ] Run `npm run dev` and verify no build errors
- [ ] Test changed functionality manually
- [ ] Check for TypeScript errors
- [ ] Remove debug code and console.logs
- [ ] Update documentation if needed
- [ ] Verify no sensitive data in commits

## Merge Strategy

- Use squash and merge for feature branches
- Keep commit history clean and meaningful
- Delete branch after merge
- Update local main branch after merge
