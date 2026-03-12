
# QRify - AI-Powered QR Code Generator

This is a Next.js 15 application designed for high-performance QR code generation and dynamic redirection.

## Deployment Instructions

For Next.js apps with dynamic routing, you have two primary options:

### Option 1: Firebase App Hosting (Recommended)
This is the most modern way to host Next.js on Firebase.
1. Push your code to a GitHub repository.
2. Go to the [Firebase Console](https://console.firebase.google.com/).
3. Navigate to **App Hosting** and connect your repository.
4. Firebase will automatically manage the build and deployment.

### Option 2: Framework-Aware Firebase Hosting
If you prefer using the CLI:
1. Ensure you have the latest Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize (if not done): `firebase init hosting` (Choose "Yes" to use a web framework)
4. Deploy: `firebase deploy`

The updated `firebase.json` is now configured to use `"source": "."`, which enables the CLI to detect Next.js 15 and deploy the server-side components automatically.
