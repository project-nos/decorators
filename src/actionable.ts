/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const parseEvents = (element: HTMLElement, dispatcher: Element, name: string): Set<string> => {
    const actions = new Set<string>();
    const definition = dispatcher.getAttribute(`${element.tagName.toLowerCase()}-action`) || '';
    for (const action of definition.trim().split(/\s+/)) {
        if (!action.includes('#')) {
            throw new Error(`Invalid action syntax "${action}"`);
        }

        const [event, method] = action.split('#');

        if (!event || !method) {
            throw new Error(`Invalid action syntax "${action}"`);
        }

        if (method !== name) {
            continue;
        }

        actions.add(event);
    }

    return actions;
};

const bindListeners = (element: HTMLElement, dispatchers: Element[], methodName: string) => {
    for (const dispatcher of dispatchers) {
        const events = parseEvents(element, dispatcher, methodName);
        for (const event of events) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const listener = element[methodName as keyof HTMLElement] as (this: HTMLElement, ...args: any) => any;
            if (typeof listener !== 'function') {
                continue;
            }

            dispatcher.addEventListener(event, listener.bind(element));
        }
    }
};

const dispatchersMap = new WeakMap<Element, Element[]>();

const locateDispatcher = (element: HTMLElement): Element[] => {
    const selector = `[${element.tagName.toLowerCase()}-action]`;
    const dispatchers = [];

    for (const candidate of element.querySelectorAll(selector)) {
        if (!element.isSameNode(candidate.closest(element.tagName.toLowerCase()))) {
            continue;
        }

        dispatchers.push(candidate);
    }

    if (element instanceof Element && element.matches(selector)) {
        dispatchers.push(element);
    }

    return dispatchers;
};

type ActionDecorator<T, V> = {
    (value: V, context: ClassMethodDecoratorContext<T>): void;
};

export const action = <T extends HTMLElement, V>(): ActionDecorator<T, V> => {
    return (_, context) => {
        const { kind, name } = context;

        if (kind !== 'method') {
            throw new TypeError('The @action decorator is for use on methods only.');
        }

        context.addInitializer(function (this: T) {
            let dispatchers = dispatchersMap.get(this);
            if (dispatchers === undefined) {
                dispatchersMap.set(this, (dispatchers = locateDispatcher(this)));
            }

            bindListeners(this, dispatchers, name.toString());
        });
    };
};
