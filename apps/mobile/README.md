# Mobile App Workspace

This is the Expo-based React Native workspace for LinguaChat mobile.

Useful commands from the repository root:

```bash
npm --prefix apps/mobile install
npm run dev:mobile
npm run android:mobile
npm run ios:mobile
```

Environment setup:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Then update the backend URLs to point at your API and Socket.IO server.

The mobile app shares contracts from `packages/shared` and is intended to talk to the existing backend in `apps/api`.
