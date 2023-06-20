import { CustomElement, CustomElementConstructor } from './element';
import { DecoratorContext } from './decorator';

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

const bindActions = (clazz: CustomElement, element: Element) => {
    for (const action of parseActionAttribute(element)) {
        if (action.component !== clazz.tagName.toLowerCase()) {
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

        type EventDispatcher = HTMLElement & Record<string, (ev: Event) => unknown>;
        const component = element.closest<EventDispatcher>(action.component);
        if (!component || typeof component[action.method] !== 'function') {
            continue;
        }

        component[action.method](event);
    }
};

const bindElements = (clazz: CustomElement, root: Element) => {
    for (const element of root.querySelectorAll(`[${clazz.tagName.toLowerCase()}-action]`)) {
        bindActions(clazz, element);
    }

    if (root instanceof Element && root.hasAttribute(`${clazz.tagName.toLowerCase()}-action`)) {
        bindActions(clazz, root);
    }
};

const initializeActionable = (clazz: CustomElement): void => {
    bindElements(clazz, clazz);
    observeElements(clazz);
};

const observeElements = (clazz: CustomElement) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                bindElements(clazz, mutation.target);
            } else if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof Element) {
                        bindElements(clazz, node);
                    }
                }
            }
        }
    });

    observer.observe(clazz, {
        childList: true,
        subtree: true,
        attributeFilter: [`${clazz.tagName.toLowerCase()}-action`],
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function actionable(...args: any[]): any {
    const [clazz, context] = args as [CustomElementConstructor, DecoratorContext];

    if (typeof clazz !== 'function' || context.kind !== 'class') {
        throw new TypeError('The @actionable decorator is for use on classes only.');
    }

    return class extends clazz {
        mountCallback() {
            initializeActionable(this);
            super.mountCallback();
        }
    };
}
