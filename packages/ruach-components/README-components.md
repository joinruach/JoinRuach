# Ruach Components Bundle

This zip contains the React components we built (UI, layout, media/courses, discussion, giving, toasts, auth helpers).

## Where to drop

Copy `src/components/ruach` and `src/components/layout` into your Next.js app. These components expect:

- Tailwind CSS
- NextAuth (for ProfileMenu/ProtectedRoute)
- Simple helpers living in `src/utils` (`analytics`, `cn`, `strapi`, `progress`)

Adjust import paths if your aliases differ.

## Notes

- Some components call API routes (e.g., `/api/reports`) which you should include from the main project we outlined earlier.
- `DonationForm` opens your external processor (Givebutter by default) in a new tab.
- `LessonPlayer` posts progress every 15s and on ended; wire `/api/progress/complete` on the server.
