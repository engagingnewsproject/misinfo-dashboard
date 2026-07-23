const withMT = require("@material-tailwind/react/utils/withMT")

module.exports = withMT({
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./styles/**/*.{js,ts,jsx,tsx}",
	],
  theme: {
		fontFamily: {
			sans: ["var(--font-inter)", "system-ui", "sans-serif"],
		},
		extend: {
			colors: {
				brand: {
					DEFAULT: '#2E3B4E',
					hover: '#1f2734', // pick a darker shade
				},
				surface: {
					DEFAULT: '#D3D3D3',
					muted: '#ebebeb',
				},
				// MT "blue" channel → brand. Switches/buttons that still emit
				// blue-500/600 (e.g. Switch checked track) pick this up.
				blue: {
					500: '#2E3B4E',
					600: '#2E3B4E',
					700: '#1f2734',
				},
				sky: {
					100: '#e0f2fe',
				},
			},
			fontSize: {
				base: [
					'14px', 
					{ lineHeight: '1.5' }
				],
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
})
