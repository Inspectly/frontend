/** @type {import('tailwindcss').Config} */
import aspectRatio from "@tailwindcss/aspect-ratio";
import scrollbar from 'tailwind-scrollbar';

export default {
	darkMode: ["class", "class"], // Enable dark mode with a class instead of media query
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			keyframes: {
				slideInFromBottomAndFade: {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				bounceFluid: {
					'0%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					},
					'100%': {
						transform: 'translateY(0)'
					}
				},
				bounceInSequence: {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-20px)'
					}
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				slideInFromBottomAndFade: 'slideInFromBottomAndFade 1s ease-out forwards',
				bounceFluid: 'bounceFluid 2s ease-out infinite',
				slideInThenBounce: 'slideInFromBottomAndFade 1s ease-out forwards, bounceFluid 2s ease-out infinite 1s',
				bounceInSequence: 'bounceInSequence 0.3s ease-in-out forwards',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				// Brand gold color (rgb 212, 160, 23)
				gold: {
					DEFAULT: 'rgb(212, 160, 23)',
					50: 'rgb(212, 160, 23, 0.05)',
					100: 'rgb(212, 160, 23, 0.10)',
					200: 'rgb(212, 160, 23, 0.16)',
					300: 'rgb(212, 160, 23, 0.25)',
					400: 'rgb(212, 160, 23, 0.40)',
					500: 'rgb(212, 160, 23)',
					600: 'rgb(180, 136, 20)',
					700: 'rgb(150, 113, 16)',
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				gold: {
					DEFAULT: 'hsl(var(--gold))',
					light: 'hsl(var(--gold-light))',
					dark: 'hsl(var(--gold-dark))',
					muted: 'hsl(var(--gold-muted))'
				},
				/* Issue / Property status tokens */
			'issue-open': {
				DEFAULT: 'var(--issue-open-bg)',
				foreground: 'var(--issue-open-foreground)',
			},
			'issue-resolved': 'var(--issue-resolved-color)',
			'issue-pending': 'var(--issue-pending-color)',
			chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				display: ['"Outfit"', 'system-ui', 'sans-serif'],
				sans: ['"Outfit"', 'system-ui', 'sans-serif'],
				serif: ['"Playfair Display"', 'Georgia', 'serif'],
				mono: ['"JetBrains Mono"', 'monospace'],
			},
		}
	},
	plugins: [aspectRatio, scrollbar, require("tailwindcss-animate")],
};
