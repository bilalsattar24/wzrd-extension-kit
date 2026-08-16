import React, { useLayoutEffect } from 'react';
import Modal, { Props as ReactModalProps } from 'react-modal';
import { lockPageScroll } from './lockPageScroll';

const ESPN_LARGEST_Z_INDEX = 1000009;

type WzrdModalProps = ReactModalProps & {
	children: React.ReactNode;
	preventScroll?: boolean;
	width?: string;
	height?: string;
	minWidth?: string;
	maxWidth?: string;
	minHeight?: string;
	maxHeight?: string;
};

/**
 * Full-screen overlay dialog. Locks ESPN/Yahoo page scroll while open
 * (`react-modal`'s `preventScroll` only affects focus, not the document).
 */
export const WzrdModal = ({
	children,
	preventScroll = true,
	isOpen = false,
	width,
	height,
	minWidth,
	minHeight,
	maxWidth,
	maxHeight,
	...rest
}: WzrdModalProps) => {
	const modalStyles: ReactModal.Styles = {
		content: {
			top: '50%',
			left: '50%',
			right: 'auto',
			bottom: 'auto',
			transform: 'translate(-50%, -50%)',
			padding: '0',
			border: 'none',
			borderRadius: '0',
			boxShadow: 'none',
			background: 'transparent',
			height: height,
			width: width,
			minHeight: minHeight,
			maxHeight: maxHeight,
			maxWidth: maxWidth,
			minWidth: minWidth,
			overflow: 'auto',
			overscrollBehavior: 'contain',
		},
		overlay: {
			...Modal.defaultStyles.overlay,
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			zIndex: ESPN_LARGEST_Z_INDEX + 1,
			overflow: 'hidden',
			overscrollBehavior: 'none',
		},
	};

	useLayoutEffect(() => {
		if (!isOpen) return undefined;
		return lockPageScroll();
	}, [isOpen]);

	return (
		<Modal style={modalStyles} isOpen={isOpen} preventScroll={preventScroll} {...rest}>
			{children}
		</Modal>
	);
};
