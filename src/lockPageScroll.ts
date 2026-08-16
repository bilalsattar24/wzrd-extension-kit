const MODAL_CONTENT_CLASS = 'ReactModal__Content';

let lockCount = 0;
let savedHtmlOverflow = '';
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';
let savedHtmlOverscroll = '';
let savedBodyOverscroll = '';
let listenersAttached = false;

/**
 * True when `el` can scroll vertically (overflow auto/scroll and content taller than the box).
 */
export function isVerticallyScrollable(el: HTMLElement): boolean {
	const style = window.getComputedStyle(el);
	const overflowY = style.overflowY;
	if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
		return false;
	}
	return el.scrollHeight > el.clientHeight + 1;
}

/**
 * Whether a wheel delta would scroll past the start or end of a container.
 * At the edges the event would otherwise leak to the page behind the modal.
 */
export function wheelWouldEscapeScrollable(
	deltaY: number,
	scrollTop: number,
	scrollHeight: number,
	clientHeight: number,
): boolean {
	if (deltaY < 0 && scrollTop <= 0) return true;
	if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1) return true;
	return false;
}

/**
 * Nearest vertically scrollable ancestor that still lives inside a react-modal content node.
 */
function scrollableModalAncestor(event: Event): HTMLElement | null {
	const path = event.composedPath();
	for (const node of path) {
		if (!(node instanceof HTMLElement)) continue;
		if (node.classList.contains(MODAL_CONTENT_CLASS) || isVerticallyScrollable(node)) {
			if (isVerticallyScrollable(node)) return node;
		}
	}
	return null;
}

/**
 * True when the event originated inside a react-modal dialog (not just the dim overlay).
 */
function isInsideModalContent(event: Event): boolean {
	return event
		.composedPath()
		.some((node) => node instanceof HTMLElement && node.classList.contains(MODAL_CONTENT_CLASS));
}

/**
 * Stops background scroll unless the user is scrolling a nested region inside the dialog.
 */
function onWheel(event: WheelEvent): void {
	if (!isInsideModalContent(event)) {
		event.preventDefault();
		return;
	}
	const scrollable = scrollableModalAncestor(event);
	if (!scrollable) {
		event.preventDefault();
		return;
	}
	if (
		wheelWouldEscapeScrollable(
			event.deltaY,
			scrollable.scrollTop,
			scrollable.scrollHeight,
			scrollable.clientHeight,
		)
	) {
		event.preventDefault();
	}
}

/**
 * Blocks touch-drag on the overlay from moving ESPN/Yahoo; allows drag inside the dialog.
 */
function onTouchMove(event: TouchEvent): void {
	if (!isInsideModalContent(event)) {
		event.preventDefault();
		return;
	}
	const scrollable = scrollableModalAncestor(event);
	if (!scrollable) {
		event.preventDefault();
	}
}

function applyDocumentLock(): void {
	const html = document.documentElement;
	const { body } = document;
	const scrollbarWidth = window.innerWidth - html.clientWidth;

	savedHtmlOverflow = html.style.overflow;
	savedBodyOverflow = body.style.overflow;
	savedBodyPaddingRight = body.style.paddingRight;
	savedHtmlOverscroll = html.style.overscrollBehavior;
	savedBodyOverscroll = body.style.overscrollBehavior;

	html.style.overflow = 'hidden';
	body.style.overflow = 'hidden';
	html.style.overscrollBehavior = 'none';
	body.style.overscrollBehavior = 'none';
	if (scrollbarWidth > 0) {
		body.style.paddingRight = `${scrollbarWidth}px`;
	}
}

function releaseDocumentLock(): void {
	const html = document.documentElement;
	const { body } = document;
	html.style.overflow = savedHtmlOverflow;
	body.style.overflow = savedBodyOverflow;
	body.style.paddingRight = savedBodyPaddingRight;
	html.style.overscrollBehavior = savedHtmlOverscroll;
	body.style.overscrollBehavior = savedBodyOverscroll;
}

function attachListeners(): void {
	if (listenersAttached) return;
	listenersAttached = true;
	window.addEventListener('wheel', onWheel, { capture: true, passive: false });
	window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
}

function detachListeners(): void {
	if (!listenersAttached) return;
	listenersAttached = false;
	window.removeEventListener('wheel', onWheel, true);
	window.removeEventListener('touchmove', onTouchMove, true);
}

/**
 * Locks the host page while a WZRD modal is open. Nested modals share one lock
 * (refcount). Call the returned function on close.
 */
export function lockPageScroll(): () => void {
	lockCount += 1;
	if (lockCount === 1) {
		applyDocumentLock();
		attachListeners();
	}

	return () => {
		lockCount = Math.max(0, lockCount - 1);
		if (lockCount === 0) {
			detachListeners();
			releaseDocumentLock();
		}
	};
}
