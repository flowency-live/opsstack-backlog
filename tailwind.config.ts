import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			// Flowency Brand Colors
  			flowency: {
  				purple: {
  					DEFAULT: 'hsl(262, 83%, 58%)',
  					light: 'hsl(262, 83%, 68%)',
  					dark: 'hsl(262, 83%, 48%)',
  					50: 'hsl(262, 83%, 97%)',
  					100: 'hsl(262, 83%, 94%)',
  					200: 'hsl(262, 83%, 88%)',
  					300: 'hsl(262, 83%, 78%)',
  					400: 'hsl(262, 83%, 68%)',
  					500: 'hsl(262, 83%, 58%)',
  					600: 'hsl(262, 83%, 48%)',
  					700: 'hsl(262, 83%, 38%)',
  					800: 'hsl(262, 83%, 28%)',
  					900: 'hsl(262, 83%, 18%)',
  				},
  				navy: {
  					DEFAULT: 'hsl(225, 71%, 8%)',
  					light: 'hsl(225, 50%, 15%)',
  					lighter: 'hsl(225, 50%, 20%)',
  				},
  				gold: {
  					DEFAULT: 'hsl(38, 92%, 50%)',
  					light: 'hsl(38, 92%, 60%)',
  					dark: 'hsl(38, 92%, 40%)',
  				},
  			},
  			primary: {
  				'50': 'hsl(262, 83%, 97%)',
  				'100': 'hsl(262, 83%, 94%)',
  				'200': 'hsl(262, 83%, 88%)',
  				'300': 'hsl(262, 83%, 78%)',
  				'400': 'hsl(262, 83%, 68%)',
  				'500': 'hsl(262, 83%, 58%)',
  				'600': 'hsl(262, 83%, 48%)',
  				'700': 'hsl(262, 83%, 38%)',
  				'800': 'hsl(262, 83%, 28%)',
  				'900': 'hsl(262, 83%, 18%)',
  				'950': 'hsl(262, 83%, 10%)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			success: '#10b981',
  			warning: '#f59e0b',
  			danger: '#ef4444',
  			feature: 'hsl(262, 83%, 58%)',
  			bug: '#ef4444',
  			tweak: '#f59e0b',
  			idea: 'hsl(38, 92%, 50%)',
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
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
