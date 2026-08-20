import React from 'react';
import Downshift, { type StateChangeOptions } from 'downshift';

interface WzrdDropdownOption {
	/** Option value written back through `onChange`. */
	value: string;
	/** Visible label. */
	label: string;
}

interface WzrdDropdownProps {
	/** Selectable items. */
	options: WzrdDropdownOption[];
	/** Currently selected option value. */
	value: string;
	/** Called with the new option value. */
	onChange: (value: string) => void;
	/** When true, the control does not open. */
	disabled?: boolean;
	/** Inline styles for the wrapper. */
	style?: React.CSSProperties;
	/** Inline styles for the toggle button. */
	buttonStyle?: React.CSSProperties;
	/** Closed-state label; defaults to the selected item. */
	buttonLabel?: string;
}

/**
 * Single-select dropdown built on Downshift, styled for host-page injection.
 * The open menu marks the current value (color + check) even before hover.
 */
export function WzrdDropdown({
	options,
	value,
	onChange,
	disabled = false,
	style,
	buttonStyle,
	buttonLabel,
}: WzrdDropdownProps) {
	const selectedIndex = options.findIndex((option) => option.value === value);

	/**
	 * Puts keyboard/hover highlight on the current value when the menu opens.
	 *
	 * @param state - Downshift state before this change.
	 * @param changes - Proposed state patch.
	 */
	const stateReducer = (
		state: { isOpen: boolean },
		changes: StateChangeOptions<WzrdDropdownOption>,
	) => {
		if (changes.isOpen === true && !state.isOpen && selectedIndex >= 0) {
			return { ...changes, highlightedIndex: selectedIndex };
		}
		return changes;
	};

	return (
		<Downshift
			selectedItem={options.find((option) => option.value === value) || null}
			onChange={(selection) => selection && onChange(selection.value)}
			itemToString={(item) => (item ? item.label : '')}
			stateReducer={stateReducer}
		>
			{({
				getItemProps,
				getToggleButtonProps,
				getMenuProps,
				isOpen,
				highlightedIndex,
				selectedItem,
			}) => (
				<div
					style={{
						position: 'relative',
						display: 'inline-flex',
						...style,
					}}
				>
					<button
						type="button"
						{...getToggleButtonProps()}
						disabled={disabled}
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
							transition: 'all 0.2s ease',
							boxShadow: isOpen ? '0 0 0 2px rgba(38,132,255,0.2)' : 'none',
							outline: 'none',
							position: 'relative',
							paddingRight: '0',
							height: '40px',
							fontWeight: 'bold',
							display: 'flex',
							alignItems: 'center',
							...buttonStyle,
						}}
					>
						<span style={{ paddingRight: '6px' }}>
							{buttonLabel ? buttonLabel : selectedItem ? selectedItem.label : 'Select...'}
						</span>
						<div
							style={{
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								padding: '0 6px',
							}}
						>
							<span
								style={{
									transform: `rotate(${isOpen ? '180deg' : '0deg'})`,
									transition: 'transform 0.2s ease',
									borderStyle: 'solid',
									borderWidth: '5px 5px 0 5px',
									borderColor: '#666 transparent transparent transparent',
									display: 'inline-block',
									marginTop: isOpen ? '-2px' : '2px',
								}}
							/>
						</div>
					</button>
					<ul
						{...getMenuProps()}
						style={{
							position: 'absolute',
							top: '100%',
							left: 0,
							backgroundColor: 'white',
							border: isOpen ? '1px solid #e0e0e0' : 'none',
							borderRadius: '8px',
							listStyle: 'none',
							padding: '4px 0',
							margin: '4px 0 0 0',
							zIndex: 1000,
							display: isOpen ? 'block' : 'none',
							maxHeight: '250px',
							overflowY: 'auto',
							boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
							minWidth: '100%',
							whiteSpace: 'nowrap',
						}}
					>
						{isOpen &&
							options.map((item, index) => {
								const isSelected = selectedItem?.value === item.value;
								const isHighlighted = highlightedIndex === index;
								return (
									<li
										key={item.value}
										{...getItemProps({
											item,
											index,
										})}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											gap: '12px',
											fontWeight: isSelected ? 700 : isHighlighted ? 600 : 400,
											padding: '8px 12px',
											backgroundColor: isHighlighted
												? '#e6f1fe'
												: isSelected
													? '#f0f7ff'
													: 'white',
											cursor: 'pointer',
											fontSize: '16px',
											color: isSelected ? '#006FEE' : '#333',
											transition: 'background-color 0.2s ease',
											whiteSpace: 'nowrap',
										}}
									>
										<span>{item.label}</span>
										{isSelected && (
											<span aria-hidden style={{ fontSize: '14px', fontWeight: 700 }}>
												✓
											</span>
										)}
									</li>
								);
							})}
					</ul>
				</div>
			)}
		</Downshift>
	);
}
