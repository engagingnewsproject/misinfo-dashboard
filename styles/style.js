/**
 * Material Tailwind theme overrides (deep-merged with MT defaults in ThemeProvider).
 * Only put values here that differ from the library defaults.
 *
 * We treat MT's "blue" color channel as brand (#2E3B4E) for Button, IconButton, and Switch.
 */
const brandButtonVariants = {
	filled: {
		blue: {
			background: 'bg-brand',
			color: 'text-white',
			shadow: 'shadow-md shadow-brand/20',
			hover: 'hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/40',
			focus: 'focus:opacity-[0.85] focus:shadow-none',
			active: 'active:opacity-[0.85] active:shadow-none',
		},
	},
	outlined: {
		blue: {
			border: 'border border-brand',
			color: 'text-brand',
			hover: 'hover:opacity-75',
			focus: 'focus:ring focus:ring-brand/20',
			active: 'active:opacity-[0.85]',
		},
	},
	text: {
		blue: {
			color: 'text-brand',
			hover: 'hover:bg-brand/10',
			active: 'active:bg-brand/20',
		},
	},
}

const roundedMdSizes = {
	sm: { borderRadius: 'rounded-md' },
	md: { borderRadius: 'rounded-md' },
	lg: { borderRadius: 'rounded-md' },
}

const style = {
	typography: {
		defaultProps: {
			// Body copy (paragraph/small/etc). Brand headings use color="blue".
			// Variant color classes lose to MT's color prop via twMerge, so set
			// the default color channel here instead of on the paragraph variant.
			color: 'gray',
		},
		styles: {
			variants: {
				paragraph: {
					fontWeight: 'font-normal',
					letterSpacing: 'tracking-normal',
				},
				small: {
					fontSize: 'text-xs',
					fontWeight: 'font-normal',
					letterSpacing: 'tracking-wide',
					lineHeight: 'leading-normal',
				},
				h1: {
					fontSize: 'text-2xl',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-8',
				},
				h2: {
					fontSize: 'text-xl',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-7',
					margin: 'mt-6 mb-2',
				},
				h3: {
					fontSize: 'text-lg',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-7',
					margin: 'mt-4 mb-2',
				},
				h4: {
					fontSize: 'text-base',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-6',
					margin: 'mt-3 mb-1',
				},
				h5: {
					fontSize: 'text-sm',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-5',
					margin: 'mt-3 mb-1',
				},
				h6: {
					fontSize: 'text-sm',
					fontWeight: 'font-extrabold',
					letterSpacing: 'tracking-wider',
					lineHeight: 'leading-5',
					margin: 'mt-2 mb-1',
				},
			},
			colors: {
				blue: {
					color: 'text-brand',
					gradient: 'bg-gradient-to-tr from-brand to-brand-hover',
				},
				gray: {
					color: 'text-gray-800',
					gradient: 'bg-gradient-to-tr from-gray-600 to-gray-400',
				},
			},
		},
	},
	button: {
		defaultProps: {
			// MT default color is "gray"; we treat "blue" as the brand channel.
			color: 'blue',
		},
		styles: {
			base: {
				initial: {
					textTransform: 'none',
					fontWeight: 'font-normal',
					letterSpacing: 'tracking-wide',
				},
			},
			// Size styles override base for the same keys (and deep-merge keeps MT
			// defaults if omitted) — set radius here so all sizes stay in sync.
			sizes: roundedMdSizes,
			variants: brandButtonVariants,
		},
	},
	// IconButton keeps its own theme key; share brand variants with Button.
	iconButton: {
		defaultProps: {
			color: 'blue',
		},
		styles: {
			sizes: roundedMdSizes,
			variants: brandButtonVariants,
		},
	},
	// Switch reads theme.switch (the package exports this key as switchButton).
	// Hide @tailwindcss/forms checked ✓ — Switch is a checkbox under the hood;
	// forms paints a white checkmark onto the track. Checkboxes keep their icon.
	switch: {
		defaultProps: {
			color: 'blue',
		},
		styles: {
			base: {
				input: {
					// All colors (blue, red, …) — not only the brand override below
					backgroundImage: 'checked:[background-image:none]',
				},
			},
			colors: {
				blue: {
					input:
						'checked:bg-brand checked:[background-image:none]',
					circle: 'peer-checked:border-brand',
					before: 'peer-checked:before:bg-brand',
				},
				red: {
					input: 'checked:bg-red-500 checked:[background-image:none]',
					circle: 'peer-checked:border-red-500',
					before: 'peer-checked:before:bg-red-500',
				},
			},
		},
	},
	// Align panel radius with app containers (rounded-md). MT defaults:
	// Dialog container → rounded-lg; Card → rounded-xl.
	// Size tiers: replace MT % widths with w-full + hard max-w so wide
	// viewports don't stretch lg/xl panels. xxl stays fullscreen (unused).
	dialog: {
		styles: {
			base: {
				container: {
					borderRadius: 'rounded-md',
				},
			},
			sizes: {
				xs: {
					width: 'w-full',
					minWidth: 'min-w-0',
					maxWidth: 'max-w-md',
				},
				sm: {
					width: 'w-full',
					minWidth: 'min-w-0',
					maxWidth: 'max-w-lg',
				},
				md: {
					width: 'w-full',
					minWidth: 'min-w-0',
					maxWidth: 'max-w-xl',
				},
				lg: {
					width: 'w-full',
					minWidth: 'min-w-0',
					maxWidth: 'max-w-3xl',
				},
				xl: {
					width: 'w-full',
					minWidth: 'min-w-0',
					maxWidth: 'max-w-5xl',
				},
			},
		},
	},
	card: {
		styles: {
			base: {
				initial: {
					borderRadius: 'rounded-md',
				},
			},
		},
	},
	// MT default text-blue-gray-500 is ~4.13:1 on white (fails WCAG AA for normal text).
	// blue-gray-600 is ~5.1:1 and keeps the same muted body tone.
	dialogBody: {
		styles: {
			base: {
				initial: {
					color: 'text-blue-gray-600',
				},
			},
		},
	},
}

export default style
