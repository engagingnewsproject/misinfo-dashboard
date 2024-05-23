const withMT = require("@material-tailwind/react/utils/withMT")

module.exports = withMT({
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
  theme: {
		fontFamily: {
			sans: ["Helvetica", "Arial", "sans-serif"],
    },
		extend: {
			colors: {
				blue: {
					500: "#2563eb", // Override the default blue-600 color
					600: "#2563eb", // Override the default blue-600 color
					700: "#173ead",
					// Add more shades as needed
				},
				sky: {
					100: "#e0f2fe",
				},
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
})
