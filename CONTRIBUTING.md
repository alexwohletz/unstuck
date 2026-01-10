# Contributing to Unstuck

Thank you for your interest in contributing to Unstuck! This project exists to help people struggling with task paralysis, and your contributions help make that possible.

## Philosophy

Before contributing, please understand our core principles:

1. **Simplicity over features** - Every addition should reduce cognitive load, not add to it
2. **Privacy is non-negotiable** - No tracking, no data collection, everything stays local
3. **Accessibility matters** - The people who need this tool most may also need accessibility features
4. **No build step** - The project should remain forkable and runnable without any tooling

## Ways to Contribute

### Bug Reports

Found a bug? Please open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your browser and OS

### Feature Suggestions

Before suggesting a feature, consider:
- Does it reduce complexity or add to it?
- Is it in scope for v1? (see the spec file for what's explicitly out of scope)
- Could it help someone in the middle of a task paralysis episode?

Open an issue to discuss before implementing.

### Code Contributions

1. **Fork** the repository
2. **Create a branch** for your changes (`git checkout -b fix/button-focus`)
3. **Make your changes** following our code style
4. **Test** in multiple browsers
5. **Submit a PR** with a clear description

### Documentation

Improvements to documentation are always welcome:
- Clearer explanations
- Additional examples
- Translations
- Typo fixes

### Design

If you have design skills:
- Accessibility improvements
- Mobile experience enhancements
- Visual refinements that maintain the calming aesthetic

## Code Style

### JavaScript

- Use vanilla JavaScript (no frameworks)
- Use ES modules (`import`/`export`)
- Prefer `const` over `let`
- Use meaningful variable names
- Add comments for non-obvious logic

### CSS

- Use CSS custom properties for theming
- Mobile-first responsive design
- Minimum 44px touch targets
- WCAG 2.1 AA color contrast
- Support `prefers-reduced-motion`

### HTML

- Semantic elements (`<main>`, `<section>`, `<button>`)
- ARIA labels where needed
- Proper heading hierarchy

## Testing

Before submitting a PR:

1. Test in Chrome, Firefox, and Safari (if available)
2. Test on mobile viewport
3. Test keyboard navigation
4. Test with a screen reader if possible
5. Test the happy path end-to-end

## Commit Messages

Write clear commit messages:

```
Fix: Timer not resetting when changing steps

The timer would continue running when navigating between steps,
causing confusion about time remaining.
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Request review from a maintainer
4. Address feedback promptly
5. Squash commits if requested

## Code of Conduct

Be kind. Remember that:
- Many users of this tool are struggling
- Contributors have different experience levels
- Text lacks tone - assume good intent

## Questions?

Open an issue or reach out to the maintainers. We're happy to help!

---

*Thank you for helping people get unstuck.*
