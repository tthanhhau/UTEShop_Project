# UTEShop BE - Auth + Mailer Cleanup Notes

Date: 2026-05-19

## What was changed
- Standardized auth to a single controller and routes file in UTEShop_BE.
- Switched AuthController to use the canonical mailer module.
- Standardized mailer to prefer Mailjet when configured, with SMTP fallback.
- Loaded .env in the mailer module to avoid missing Mailjet credentials on import.
- Removed duplicate/legacy auth controller and auth route files.
- Removed duplicate mailer variants to keep one canonical mailer.

## Files kept (canonical)
- src/controllers/AuthController.js
- src/routes/authRoutes.js
- src/config/mailer.js

## Files removed
- src/controllers/AuthController_fixed.js
- src/controllers/AuthController_admin_based.js
- src/routes/authRoutes_fixed.js
- src/routes/authRoutes_admin_based.js
- src/config/mailer_admin_based.js
- src/config/mailer_fixed.js
- src/config/mailer_resend.js

## Why
- Avoid duplicate controllers and mailers that caused confusion.
- Use Mailjet (if configured in .env) as the primary email provider.
- Keep UTEShop_BE admin (NestJS) mailer untouched in UTEShop_BE_Admin.
