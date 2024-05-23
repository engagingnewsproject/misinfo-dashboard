const style = {
  typography: {
    styles: {
      variants: {
        h1: {},
        h2: {},
        h3: {},
        h4: {},
        h5: {},
        h6: {},
        lead: {},
        paragraph: {
          fontWeight: 'font-normal',
          letterSpacing: 'tracking-wide',
        },
        small: {},
      },
    },
  },
  button: {
    defaultProps: {
      variant: 'filled',
      size: 'md',
      color: 'blue',
    },
    valid: {
      variants: ['filled', 'outlined', 'gradient', 'text'],
      sizes: ['sm', 'md', 'lg'],
      colors: [
        'white',
        'blue',
      ],
    },
    styles: {
      base: {
        initial: {
          textTransform: 'none',
          fontWeight: 'font-normal',
          letterSpacing: 'tracking-wide',
          fontSize: 'text-lg',
        },
        fullwidth: {
          color: 'text-white',
        },
      },
      sizes: {
        md: {
          fontSize: 'text-sm',
          py: 'py-2',
          px: 'px-6',
          borderRadius: 'rounded-lg',
        },
      },
      variants: {
        filled: {
          blue: {
            hover: 'hover:shadow-lg hover:shadow-blue-500/40',
            focus: 'focus:opacity-[0.85] focus:shadow-none',
            active: 'active:opacity-[0.85] active:shadow-none',
          },
        },
        outlined: {
          blue: {
            hover: 'hover:shadow-lg hover:shadow-blue-500/40',
          },
        },
      },
    },
  },
};

export default style;
