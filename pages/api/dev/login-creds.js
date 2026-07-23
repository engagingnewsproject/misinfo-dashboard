/**
 * Local-dev only: return email/password for a `.env.login` alias.
 * GET /api/dev/login-creds?alias=admin|agency|public
 *
 * Hard-gated: production always 404s before loading any cred helpers.
 * Development also requires a localhost Host header.
 */

export default function handler(req, res) {
	// Keep this check first and sync so production never loads `.env.login` helpers.
	if (process.env.NODE_ENV !== 'development') {
		return res.status(404).end()
	}

	// Dynamic require so production builds don't need this module at runtime.
	// eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
	const {
		isLocalDevRequest,
		readDevLoginCreds,
	} = require('../../../utils/dev-login-creds')

	if (!isLocalDevRequest(req)) {
		return res.status(404).end()
	}

	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET')
		return res.status(405).json({ error: 'Method not allowed' })
	}

	const alias = typeof req.query.alias === 'string' ? req.query.alias : ''

	try {
		const creds = readDevLoginCreds(alias)
		res.setHeader('Cache-Control', 'no-store')
		return res.status(200).json(creds)
	} catch (error) {
		const status = error?.statusCode || 500
		return res.status(status).json({
			error: error?.message || 'Failed to load login creds',
		})
	}
}
