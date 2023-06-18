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

const initializeActionable = (clazz: CustomElement): void => {
    for (const element of clazz.querySelectorAll(`[${clazz.tagName.toLowerCase()}-action]`)) {
        bindActions(clazz, element);
    }
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
