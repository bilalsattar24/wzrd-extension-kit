import React, { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WzrdErrorBoundary } from '../WzrdErrorBoundary';
import { getKitConfig } from '../configure';

const queryClient = new QueryClient();

type MountHandle<T extends object> = {
	update: (newProps: T) => void;
	unmount: () => void;
};

type MountHostElement = HTMLElement & {
	__wzrdReactUnmount?: () => void;
};

/**
 * Create a React root for a DOM `element` and attach the given `Component`.
 */
export function attachReactComponentToDomElement<T extends object>(
	Component: ComponentType<T>,
	element: Element,
	props: T,
): MountHandle<T> {
	if (!element) {
		throw new Error(`No element provided`);
	}
	const productName = (() => {
		try {
			return getKitConfig().productName;
		} catch {
			return 'WZRD';
		}
	})();
	const root = createRoot(element);
	root.render(
		<QueryClientProvider client={queryClient}>
			<WzrdErrorBoundary
				label={Component.displayName || Component.name}
				productName={productName}
			>
				<Component {...props} />
			</WzrdErrorBoundary>
		</QueryClientProvider>,
	);

	return {
		update: (newProps: T) => {
			root.render(
				<QueryClientProvider client={queryClient}>
					<WzrdErrorBoundary
						label={Component.displayName || Component.name}
						productName={productName}
					>
						<Component {...newProps} />
					</WzrdErrorBoundary>
				</QueryClientProvider>,
			);
		},
		unmount: () => {
			root.unmount();
		},
	};
}

/**
 * Mount (or remount) a React component into a stable DOM node id.
 */
export function remountReactComponentById<T extends object>(
	Component: ComponentType<T>,
	rootId: string,
	props: T,
	insertNewElement: (el: HTMLElement) => void,
): MountHandle<T> {
	let el = document.getElementById(rootId) as MountHostElement | null;
	el?.__wzrdReactUnmount?.();
	delete el?.__wzrdReactUnmount;

	if (!el) {
		el = document.createElement('div') as MountHostElement;
		el.id = rootId;
		insertNewElement(el);
	}

	const attachment = attachReactComponentToDomElement(Component, el, props);
	const handle: MountHandle<T> = {
		update: attachment.update,
		unmount: () => {
			attachment.unmount();
			if (el?.__wzrdReactUnmount === handle.unmount) {
				delete el.__wzrdReactUnmount;
			}
		},
	};
	el.__wzrdReactUnmount = handle.unmount;
	return handle;
}

/** Tear down a previously remounted root and remove its DOM node. */
export function unmountReactComponentById(rootId: string): void {
	const el = document.getElementById(rootId) as MountHostElement | null;
	el?.__wzrdReactUnmount?.();
	el?.remove();
}
