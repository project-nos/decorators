/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';

const parseActionAttribute = (element: Element): { component: string; event: string; method: string }[] => {
    const attributeName = element.getAttributeNames().find((name) => name.endsWith('-action'));

    if (!attributeName) {
        return [];
    }

    const component = attributeName.slice(0, attributeName.lastIndexOf('-action'));
    const attributeValue = element.getAttribute(attributeName) || '';

    const actions = [];
    for (const action of attributeValue.trim().split(/\s+/)) {
        const separatorPosition = Math.max(0, action.lastIndexOf('#')) || action.length;

        actions.push({
            component: component,
            event: action.slice(0, separatorPosition),
            method: action.slice(separatorPosition + 1) || 'handleEvent',
        });
    }

    return actions;
};

const bindActions = (component: Component, element: Element) => {
    for (const action of parseActionAttribute(element)) {
        if (action.component !== component.tagName.toLowerCase()) {
            continue;
        }

        element.addEventListener(action.event, handleEvent);
    }
};

const handleEvent = (event: Event) => {
    const element = event.currentTarget as Element;
    for (const action of parseActionAttribute(element)) {
        if (action.event !== event.type) {
            continue;
        }

        type EventDispatcher = Component & Record<string, (ev: Event) => unknown>;
        const component = element.closest<EventDispatcher>(action.component);
        if (!component || typeof component[action.method] !== 'function') {
            continue;
        }

        component[action.method](event);
    }
};

const bindElements = (component: Component, root: Element) => {
    const componentTagName = component.tagName.toLowerCase();
    for (const element of root.querySelectorAll(`[${componentTagName}-action]`)) {
        bindActions(component, element);
    }

    if (root instanceof Element && root.hasAttribute(`${componentTagName}-action`)) {
        bindActions(component, root);
    }
};

const observeElements = (component: Component) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                bindElements(component, mutation.target);
            } else if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof Element) {
                        bindElements(component, node);
                    }
                }
            }
        }
    });

    observer.observe(component, {
        childList: true,
        subtree: true,
        attributeFilter: [`${component.tagName.toLowerCase()}-action`],
    });
};

type ActionableDecorator = {
    (target: ComponentConstructor, context: ClassDecoratorContext): any;
};

export const actionable = (): ActionableDecorator => {
    return (target) => {
        return class extends target {
            constructor(...args: any[]) {
                super(args);
                bindElements(this, this);
            }

            connectedCallback() {
                super.connectedCallback?.();
                observeElements(this);
            }
        };
    };
};
