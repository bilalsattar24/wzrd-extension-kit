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
 * Creates a React root on `element` and renders `Component` with QueryClient and an error boundary.
 *
 * @param Component - Root component type.
 * @param element - Host mount node.
 * @param props - Props passed to `Component`.
 * @returns Handle with `update` and `unmount`.
 * @throws When `element` is missing.
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
 * Mounts (or remounts) a React tree on a stable element id.
 * Stores the unmount handle on the node so content-script HMR can remount.
 *
 * @param Component - Root component type.
 * @param rootId - `id` of the host node.
 * @param props - Props passed to `Component`.
 * @param insertNewElement - Called when the node does not exist yet.
 * @returns Handle with `update` and `unmount`.
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

/**
 * Unmounts a tree created by {@link remountReactComponentById} and removes the node.
 *
 * @param rootId - `id` of the host node.
 */
export function unmountReactComponentById(rootId: string): void {
	const el = document.getElementById(rootId) as MountHostElement | null;
	el?.__wzrdReactUnmount?.();
	el?.remove();
}
