# Campaigns Module

Campaigns provides the module shell for donation campaigns and support workflows.

This is Phase 1 of 6 for Campaigns extraction. Phase 1 only registers the module manifest and documents the current legacy boundaries.

## Module metadata

- Feature flag key: `campaigns`
- Existing route prefixes:
  - `/campaigns`
  - `/support`
- Events:
  - `donation.created`
  - `donation.verified`
- Capabilities:
  - `notifications`
  - `storage`
- Labels:
  - Arabic: الحملات
  - English: Campaigns
  - French: Campagnes

## Current boundaries

Actions, data helpers, components, and pages are still in legacy locations and will be moved in later phases.

Payment verification and donation submission behavior must not be changed casually. Later extraction phases should preserve the existing payment and donation flows unless a specific behavior change is explicitly approved.
