---
inclusion: auto
---

# LaCarte Waste Management Project Context

## Project Overview

LaCarte is a waste management admin dashboard built with Nuxt 3, Vue 3, and TypeScript. It manages customers, drivers, trucks, pickups, billing, and operations for a waste collection service.

## Tech Stack

- Nuxt 3.4+ (Vue 3 framework)
- Vue 3.5+ (Composition API with `<script setup>`)
- TypeScript
- Nuxt UI 4.5+ (component library)
- Pinia (state management)
- pinia-plugin-persistedstate (auth persistence)

## Key Business Entities

### Customer
- Residential or commercial waste collection clients
- Fields: id, userId, phoneNumber, noBins, status, address, city, user, customerType, zone
- Subscription-based or pay-as-you-go billing

### Driver
- Personnel who operate trucks and collect waste
- Fields: id (UUID), user, phoneNumber, licenseNumber, licenseExpiry, zone, status, assignedTruck, totalTrips
- Tracked by earnings, completed pickups, and performance

### Truck
- Fleet vehicles used for waste collection
- Fields: id (UUID), truckId (display ID), plateNumber, vinNumber, make, model, year, capacity, status, assignedDriver
- Tracked by GPS, maintenance, and assignments

### Zone
- Geographic service areas
- Fields: id, name, color
- Used for routing and driver assignments

### Pickup
- Scheduled waste collection tasks
- Assigned to drivers and tracked by status

## Application Structure

### Pages
- `/` - Dashboard home
- `/login` - Authentication
- `/customers` - Customer management
- `/drivers` - Driver management
- `/trucks` - Fleet management
- `/pickups` - Pickup scheduling
- `/billing` - Invoice and payment tracking
- `/tracking` - Real-time GPS tracking
- `/shop` - Product/service catalog
- `/reports` - Analytics and reporting
- `/management` - System configuration (zones, rates, subscriptions)
- `/team` - Staff management
- `/settings` - User preferences

### Layouts
- `dashboard` - Main authenticated layout with sidebar and header

### Key Composables
- `useApi()` - HTTP client with auth token injection
- `useMockData()` - Shared reference data (zones, trucks, customer types)
- `useCurrency()` - Currency formatting (GHS)

### Stores
- `auth` - User authentication state and token management

## Design System

### Colors
- Primary: `#ffb400` (yellow/gold)
- Success: `#22c55e` (green)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)
- Warning: `#f97316` (orange)
- Background: `white`, `#f8f9fa`, `#f3f4f6`
- Border: `#e5e7eb`, `#ececec`
- Text: `#111`, `#1a1a1a`, `#6b7280`

### Typography
- Font: Manrope (sans-serif)
- Headings: 32px (h1), 20px (modal titles), 16px (card titles)
- Body: 14px (standard), 12px (small/muted)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- Container padding: 24px
- Card gap: 16px
- Button gap: 8px
- Section gap: 32px

### Border Radius
- Cards/containers: 16px
- Buttons: 20px
- Badges: 14px
- Avatars: 9999px (full circle)

## Current Development Phase

The project is transitioning from mock data to real API integration. Key focus areas:

1. Authentication via Better Auth
2. Customer, driver, and truck CRUD operations
3. Auth middleware for route protection
4. Field name alignment with API schema
5. Pagination and filtering for list views
6. Error handling and loading states

## API Reference Files

- `api-1.json` - API schema documentation
- `api-2.json` - Additional API endpoints
- `api-1(3).yaml` - OpenAPI specification

## Environment Variables

- `NUXT_PUBLIC_API_BASE` - Backend API base URL (default: `https://lacarte.lazynerdstudios.com/api`)
