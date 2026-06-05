# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Stripe test checkout

The Civox demo uses Stripe Checkout in test mode only. Configure the following environment variables before launching the app:

- `VITE_API_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY` if you later wire Stripe.js in the browser

Use the test card details below when Checkout opens:

- `4242 4242 4242 4242`
- any future expiry date
- any CVC

The hosted Checkout success and cancel pages are:

- `/stripe/success`
- `/stripe/cancel`

The demo pages subscribe to the backend SSE streams so SaaS and payment screens update without a refresh after the webhook confirms payment.
