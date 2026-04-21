/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        pill: '999px'
                },
                colors: {
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
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        brand: {
                                obsidian: {
                                        DEFAULT: 'var(--brand-obsidian)',
                                        soft:    'var(--brand-obsidian-soft)'
                                },
                                parchment: {
                                        DEFAULT: 'var(--brand-parchment)',
                                        soft:    'var(--brand-parchment-soft)'
                                },
                                gold: {
                                        DEFAULT: 'var(--brand-gold)',
                                        deep:    'var(--brand-gold-deep)'
                                },
                                bone: 'var(--brand-bone)',
                                husk: 'var(--brand-husk)',
                                ink:  'var(--brand-ink)'
                        },
                        ink: {
                                DEFAULT: 'var(--text-primary)',
                                muted: 'var(--text-muted)'
                        }
                },
                fontFamily: {
                        display: ['var(--font-display)'],
                        body:    ['var(--font-body)'],
                        accent:  ['var(--font-accent)'],
                        sans:    ['var(--font-body)']
                },
                fontSize: {
                        'h1': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.01em' }],
                        'h2': ['2.75rem', { lineHeight: '3.25rem', letterSpacing: '-0.005em' }],
                        'h3': ['2rem',    { lineHeight: '2.5rem' }],
                        'h4': ['1.5rem',  { lineHeight: '2rem' }],
                        'body-lg': ['1rem', { lineHeight: '1.625rem' }],
                        'small':  ['0.875rem', { lineHeight: '1.375rem' }]
                },
                spacing: {
                        '4.5': '1.125rem',
                        '18': '4.5rem',
                        '22': '5.5rem',
                        '30': '7.5rem'
                },
                boxShadow: {
                        soft:     '0 2px 10px -4px rgba(11, 8, 6, 0.18)',
                        card:     '0 12px 28px -14px rgba(11, 8, 6, 0.32)',
                        elevated: '0 28px 60px -24px rgba(11, 8, 6, 0.44)',
                        gold:     '0 0 0 1px rgba(232, 168, 74, 0.28), 0 18px 40px -16px rgba(232, 168, 74, 0.48)'
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to:   { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to:   { height: '0' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up':   'accordion-up 0.2s ease-out'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
