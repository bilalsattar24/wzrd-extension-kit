const MODAL_CONTENT_CLASS = 'ReactModal__Content';

let lockCount = 0;
let savedHtmlOverflow = '';
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';
let savedHtmlOverscroll = '';
let savedBodyOverscroll = '';
let listenersAttached = false;

/**
 * Reports whether an element can scroll vertically.
 *
 * @param el - Element to inspect.
 * @returns `true` when overflow-y is scrollable and content is taller than the box.
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
 * Reports whether a wheel delta would leave the scrollable range of a container.
 * Used so the host ESPN/Yahoo page does not move when the dialog is already at an edge.
 *
 * @param deltaY - Wheel delta; negative is up.
 * @param scrollTop - Current scroll offset of the container.
 * @param scrollHeight - Full scrollable height of the container.
 * @param clientHeight - Visible height of the container.
 * @returns `true` when the event should be prevented so it does not leak to the page.
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
 * Finds the nearest vertically scrollable ancestor that still lives inside a react-modal content node.
 *
 * @param event - Wheel or touch event whose composed path is searched.
 * @returns The scrollable element, or `null` if none exists inside the dialog.
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
 * Reports whether an event originated inside a react-modal dialog (not only the dim overlay).
 *
 * @param event - Event whose composed path is inspected.
 * @returns `true` when a `ReactModal__Content` node is on the path.
 */
function isInsideModalContent(event: Event): boolean {
	return event
		.composedPath()
		.some((node) => node instanceof HTMLElement && node.classList.contains(MODAL_CONTENT_CLASS));
}

/**
 * Prevents the host page from scrolling on wheel unless the user is scrolling inside the dialog.
 *
 * @param event - Capture-phase wheel event.
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
 * Prevents overlay touch-drag from moving ESPN/Yahoo; allows drag inside the dialog.
 *
 * @param event - Capture-phase touchmove event.
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

/**
 * Applies overflow and overscroll locks on `html`/`body`, compensating for scrollbar width.
 */
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

/**
 * Restores `html`/`body` overflow styles saved by {@link applyDocumentLock}.
 */
function releaseDocumentLock(): void {
	const html = document.documentElement;
	const { body } = document;
	html.style.overflow = savedHtmlOverflow;
	body.style.overflow = savedBodyOverflow;
	body.style.paddingRight = savedBodyPaddingRight;
	html.style.overscrollBehavior = savedHtmlOverscroll;
	body.style.overscrollBehavior = savedBodyOverscroll;
}

/**
 * Attaches capture-phase wheel and touchmove listeners once for the active lock.
 */
function attachListeners(): void {
	if (listenersAttached) return;
	listenersAttached = true;
	window.addEventListener('wheel', onWheel, { capture: true, passive: false });
	window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
}

/**
 * Removes the capture-phase wheel and touchmove listeners.
 */
function detachListeners(): void {
	if (!listenersAttached) return;
	listenersAttached = false;
	window.removeEventListener('wheel', onWheel, true);
	window.removeEventListener('touchmove', onTouchMove, true);
}

/**
 * Locks the host page while a WZRD modal is open.
 * Nested modals share one lock via a refcount. Call the returned function on close.
 *
 * @returns A disposer that decrements the lock; the document unlocks when the count hits zero.
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
