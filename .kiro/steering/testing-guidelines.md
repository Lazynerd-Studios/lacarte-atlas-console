---
inclusion: manual
---

# Testing Guidelines

## Manual Testing Checklist

### Authentication Flow
- [ ] Sign in with valid credentials redirects to dashboard
- [ ] Sign in with invalid credentials shows error message
- [ ] Unauthenticated access to protected routes redirects to `/login`
- [ ] 401 responses trigger automatic logout and redirect
- [ ] Token persists across browser sessions when "Remember Me" is checked

### Form Validation
- [ ] Required fields show error when empty
- [ ] Email validation rejects invalid formats
- [ ] Phone number validation accepts various formats
- [ ] Date fields reject past dates when future dates are required
- [ ] Pattern validation (VIN, plate numbers, truck IDs) works correctly
- [ ] Error messages clear when field is corrected
- [ ] Submit button disabled during API calls

### API Integration
- [ ] List endpoints load data correctly
- [ ] Pagination controls work (next/previous page)
- [ ] Search and filter parameters update results
- [ ] Create operations add new records
- [ ] Detail pages load individual records
- [ ] API errors display user-friendly messages
- [ ] Loading states show during data fetching

### Modal Behavior
- [ ] Modals open and close correctly
- [ ] Clicking backdrop closes modal
- [ ] Close button works
- [ ] Form submission closes modal on success
- [ ] Modal stays open on validation errors
- [ ] Modal stays open on API errors

### Data Refresh
- [ ] List refreshes after successful create
- [ ] List refreshes after successful update
- [ ] List refreshes after successful delete
- [ ] Pagination resets to page 1 after filter changes

## Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Responsive Testing

Test at breakpoints:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

## Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Color contrast meets WCAG AA standards
- [ ] Interactive elements have appropriate ARIA labels

## Performance Testing

- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second
- [ ] No memory leaks in long-running sessions
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size reasonable (< 500KB gzipped)

## Security Testing

- [ ] Auth tokens not exposed in console or network tab
- [ ] XSS protection in user-generated content
- [ ] CSRF protection on state-changing operations
- [ ] Sensitive data not logged to console
- [ ] API endpoints require authentication

## Common Issues to Check

- [ ] No console errors or warnings
- [ ] No broken images or icons
- [ ] No layout shifts during loading
- [ ] No infinite loops or excessive re-renders
- [ ] No race conditions in async operations
- [ ] No memory leaks from event listeners
