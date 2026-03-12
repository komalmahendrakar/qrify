# **App Name**: QRify

## Core Features:

- URL Input and QR Code Generation: Users can input any URL and generate a corresponding QR code image in real-time.
- QR Code Display: The generated QR code is visually displayed on the home page for immediate review.
- Multiple Download Options: Users can download the generated QR code in popular image formats: PNG, JPG, and SVG.
- User-Specific QR Code Storage: Authenticated users can save their generated QR codes and the associated URLs securely in Firestore.
- User Dashboard: Authenticated users have a personalized dashboard to view and manage their history of generated and saved QR codes.
- Admin Dashboard: An administrative interface allowing for global oversight and management of all generated QR codes and users within the system, powered by Firestore.

## Style Guidelines:

- Light color scheme to convey cleanliness and professionalism. Primary actions and important text use a deep, authoritative blue (#1F1FAD). The background is a very light, almost off-white with a subtle blue tint (#F0F0F4), providing an airy canvas. An accent color of bright, cool blue (#4799EB) is used for highlights and interactive elements, ensuring good contrast and visual pop.
- All text uses 'Inter' (sans-serif) for its modern, clean, and highly legible appearance, suitable for a functional and objective user experience across various content lengths.
- Use a consistent set of minimal, outline-style icons to maintain a clean and modern aesthetic. Icons should clearly communicate their function without cluttering the interface.
- Implement a responsive, single-column dominant layout with generous whitespace to ensure readability and focus. Key actions are centrally aligned on the homepage, while the dashboard features a clear, organized grid structure.
- Subtle and functional animations are applied, such as smooth transitions for QR code generation or element highlighting on hover, enhancing user feedback without distraction.