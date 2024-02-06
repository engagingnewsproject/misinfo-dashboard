// service-worker.js
import { skipWaiting, clientsClaim } from "workbox-core"
import { precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { StaleWhileRevalidate } from "workbox-strategies"

skipWaiting()
clientsClaim()

// Precache all assets defined in the webpack configuration's output property
precacheAndRoute(self.__WB_MANIFEST)

// Cache Google Fonts
registerRoute(
	({ url }) =>
		url.origin === "https://fonts.googleapis.com" ||
		url.origin === "https://fonts.gstatic.com",
	new StaleWhileRevalidate()
)
