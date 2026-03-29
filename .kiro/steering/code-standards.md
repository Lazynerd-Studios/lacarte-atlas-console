---
inclusion: auto
---

# Code Standards

## Vue 3 Composition API

- Use `<script setup>` syntax for all Vue components
- Use `definePageMeta()` for page-level configuration (layouts, middleware)
- Use `defineEmits<>()` with TypeScript generics for type-safe event emissions
- Prefer `reactive()` for form objects and `ref()` for primitive values
- Use `onMounted()` for initialization logic that requires DOM or API calls

## TypeScript

- Use explicit TypeScript types for function parameters and return values
- Use generics for API response types: `api.get<ResponseType>('/endpoint')`
- Define interfaces for complex data structures (Customer, Truck, Driver, etc.)
- Use `Record<string, unknown>` for flexible object types in emit handlers

## Styling

- Use inline styles with template literals for dynamic styling
- Follow the established color palette:
  - Primary: `#ffb400` (yellow/gold)
  - Background: `white`
  - Border: `#e5e7eb`, `#ececec`
  - Text: `#111`, `#1a1a1a` (dark), `#6b7280` (muted)
  - Success: `#22c55e`, Error: `#ef4444`, Info: `#3b82f6`
- Use `border-radius: 16px` for cards and containers, `20px` for buttons
- Font family: `'Manrope', sans-serif`
- Button heights: `40px` standard, `42px` for select inputs

## Component Structure

- Modals should emit `close` and `submit` events
- Use validation functions that populate an `errors` reactive object
- Implement focus/blur handlers for input border color changes
- Use `@click.self` on modal overlays to close on backdrop click
- Position close buttons absolutely in top-right corner

## Naming Conventions

- Components: PascalCase (e.g., `AddDriverModal.vue`)
- Composables: camelCase with `use` prefix (e.g., `useApi.ts`, `useMockData.ts`)
- Pages: kebab-case (e.g., `drivers/index.vue`, `drivers/[id].vue`)
- Variables: camelCase
- Constants: camelCase for objects, SCREAMING_SNAKE_CASE for primitives

## File Organization

- Pages: `app/pages/` (auto-routed by Nuxt)
- Components: `app/components/` (auto-imported)
- Composables: `app/composables/` (auto-imported)
- Stores: `app/stores/` (Pinia)
- Layouts: `app/layouts/`
- Assets: `app/assets/css/`
