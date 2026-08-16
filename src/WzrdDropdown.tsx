import React from 'react';
import Downshift from 'downshift';

interface WzrdDropdownOption {
	value: string;
	label: string;
}

interface WzrdDropdownProps {
	options: WzrdDropdownOption[];
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	style?: React.CSSProperties;
	buttonStyle?: React.CSSProperties;
	buttonLabel?: string;
}

export function WzrdDropdown({
	options,
	value,
	onChange,
	disabled = false,
	style,
	buttonStyle,
	buttonLabel,
}: WzrdDropdownProps) {
	return (
		<Downshift
			selectedItem={options.find((option) => option.value === value) || null}
			onChange={(selection) => selection && onChange(selection.value)}
			itemToString={(item) => (item ? item.label : '')}
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
							options.map((item, index) => (
								<li
									key={item.value}
									{...getItemProps({ item, index })}
									style={{
										fontWeight: highlightedIndex === index ? 'bold' : 'normal',
										padding: '8px 12px',
										backgroundColor: highlightedIndex === index ? '#f0f7ff' : 'white',
										cursor: 'pointer',
										fontSize: '16px',
										color: '#333',
										transition: 'background-color 0.2s ease',
										whiteSpace: 'nowrap',
									}}
								>
									{item.label}
								</li>
							))}
					</ul>
				</div>
			)}
		</Downshift>
	);
}
