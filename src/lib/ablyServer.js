import Ably from "ably";

// Server-only REST client used to mint scoped, short-lived tokens for browsers.
// The raw API key must never reach the client — see /api/ably-token.
export const ablyRest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
