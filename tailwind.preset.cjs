/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'wz-',
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			colors: {
				'wzrd-primary': '#006FEE',
				'wzrd-primary-hover': '#005bc4',
				'wzrd-primary-soft': '#e6f1fe',
				'wzrd-secondary': '#9353d3',
				'wzrd-surface': '#ffffff',
				'wzrd-surface-muted': '#f0f3f5',
				'wzrd-border': '#e5e7eb',
				'wzrd-text': '#1f2937',
				'wzrd-text-muted': '#6b7280',
				'wzrd-success': '#16a34a',
				'wzrd-warning': '#ca8a04',
				'wzrd-danger': '#dc2626',
				'wzrd-login': '#006FEE',
				'wzrd-login-hover': '#005bc4',
			},
			boxShadow: {
				wzrd: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.06)',
				'wzrd-lg': '0 8px 24px rgba(15, 23, 42, 0.12)',
			},
			borderRadius: {
				wzrd: '0.625rem',
				'wzrd-lg': '0.875rem',
			},
			keyframes: {
				'wzrd-fade-in': {
					'0%': { opacity: '0', transform: 'translateY(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'wzrd-fade-in': 'wzrd-fade-in 220ms ease-out',
			},
		},
	},
};
