import React, { useEffect, useMemo, useRef, useState } from 'react';

export type MultiSelectOption = {
	value: string;
	label: string;
};

/** Beat host-page CSS (esp. ESPN) that hides native checkboxes. */
export const WZRD_CHECKBOX_STYLE: React.CSSProperties = {
	appearance: 'auto',
	WebkitAppearance: 'checkbox',
	MozAppearance: 'checkbox',
	display: 'inline-block',
	width: '16px',
	height: '16px',
	minWidth: '16px',
	minHeight: '16px',
	margin: 0,
	opacity: 1,
	visibility: 'visible',
	position: 'static',
	flexShrink: 0,
	cursor: 'pointer',
	accentColor: '#006FEE',
};

/** Decorative box inside a clickable menu row — the row owns the click. */
export const WZRD_CHECKBOX_DISPLAY_STYLE: React.CSSProperties = {
	...WZRD_CHECKBOX_STYLE,
	pointerEvents: 'none',
};

type WzrdMultiSelectDropdownProps = {
	options: MultiSelectOption[];
	values: string[];
	onChange: (values: string[]) => void;
	disabled?: boolean;
	/** Shown on the closed button when nothing is selected. */
	emptyLabel?: string;
	/** Optional special row that selects/clears every option. */
	showAllOption?: boolean;
	showAllLabel?: string;
	checkboxClassName?: string;
};

/**
 * Multi-select dropdown with checkboxes (combobox-style closed control).
 */
export function WzrdMultiSelectDropdown({
	options,
	values,
	onChange,
	disabled = false,
	emptyLabel = 'Summary',
	showAllOption = true,
	showAllLabel = 'Show all',
	checkboxClassName,
}: WzrdMultiSelectDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const selected = useMemo(() => new Set(values), [values]);
	const allSelected = options.length > 0 && options.every((option) => selected.has(option.value));

	useEffect(() => {
		if (!isOpen) return;
		const onPointerDown = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', onPointerDown);
		return () => document.removeEventListener('mousedown', onPointerDown);
	}, [isOpen]);

	const buttonLabel = (() => {
		if (values.length === 0) return emptyLabel;
		if (allSelected) return showAllLabel;
		const labels = options.filter((option) => selected.has(option.value)).map((o) => o.label);
		if (labels.length <= 2) return labels.join(', ');
		return `${labels.length} groups`;
	})();

	const toggleValue = (value: string) => {
		const next = new Set(selected);
		if (next.has(value)) {
			next.delete(value);
		} else {
			next.add(value);
		}
		onChange([...next]);
	};

	const toggleShowAll = () => {
		if (allSelected) {
			onChange([]);
		} else {
			onChange(options.map((option) => option.value));
		}
	};

	return (
		<div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen((open) => !open)}
				style={{
					padding: '6px 12px',
					border: `1px solid ${disabled ? '#ddd' : isOpen ? '#2684FF' : '#ccc'}`,
					borderRadius: '6px',
					backgroundColor: disabled ? '#f5f5f5' : 'white',
					cursor: disabled ? 'not-allowed' : 'pointer',
					minWidth: 'fit-content',
					textAlign: 'left',
					opacity: disabled ? 0.7 : 1,
					fontSize: '14px',
					color: disabled ? '#666' : '#333',
					height: '40px',
					fontWeight: 'bold',
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
				}}
			>
				<span>{buttonLabel}</span>
				<span
					style={{
						transform: `rotate(${isOpen ? '180deg' : '0deg'})`,
						transition: 'transform 0.2s ease',
						borderStyle: 'solid',
						borderWidth: '5px 5px 0 5px',
						borderColor: '#666 transparent transparent transparent',
						display: 'inline-block',
					}}
				/>
			</button>
			{isOpen && (
				<ul
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						margin: '4px 0 0 0',
						padding: '4px 0',
						listStyle: 'none',
						backgroundColor: 'white',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						zIndex: 10000,
						minWidth: '100%',
						whiteSpace: 'nowrap',
						userSelect: 'none',
					}}
				>
					{showAllOption && (
						<li
							role="option"
							aria-selected={allSelected}
							style={{
								padding: '8px 12px',
								cursor: disabled ? 'not-allowed' : 'pointer',
								fontSize: '14px',
								borderBottom: '1px solid #eee',
								fontWeight: 600,
							}}
							onMouseDown={(event) => event.preventDefault()}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								if (!disabled) toggleShowAll();
							}}
						>
							<span
								style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'inherit' }}
							>
								<input
									type="checkbox"
									className={checkboxClassName}
									style={WZRD_CHECKBOX_DISPLAY_STYLE}
									checked={allSelected}
									readOnly
									tabIndex={-1}
									disabled={disabled}
									aria-hidden
								/>
								{showAllLabel}
							</span>
						</li>
					)}
					{options.map((option) => {
						const checked = selected.has(option.value);
						return (
							<li
								key={option.value}
								role="option"
								aria-selected={checked}
								style={{
									padding: '8px 12px',
									cursor: disabled ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									backgroundColor: checked ? '#f0f7ff' : 'white',
								}}
								onMouseDown={(event) => event.preventDefault()}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									if (!disabled) toggleValue(option.value);
								}}
							>
								<span
									style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'inherit' }}
								>
									<input
										type="checkbox"
										className={checkboxClassName}
										style={WZRD_CHECKBOX_DISPLAY_STYLE}
										checked={checked}
										readOnly
										tabIndex={-1}
										disabled={disabled}
										aria-hidden
									/>
									{option.label}
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
