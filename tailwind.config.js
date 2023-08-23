module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      darkSelector: '.dark',
      colors: {
        // Light mode colors
        transparent: 'transparent',
        current: 'currentColor',
        white: '#ffffff',
        black: '#000000',
        gray: {
          100: '#f7fafc',
          // ... other shades of gray
        },
        // Define more colors here...

        // Dark mode colors
        dark: {
          white: '#0f172a',
          black: '#fff',
          gray: {
            100: '#f7fafc',
            // ... other shades of gray for dark mode
          },
          sky: {
            100: '#0f172a',
          },
          blue: {
            600: '#8ea6db',
          }
          // Define more colors for dark mode...
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
