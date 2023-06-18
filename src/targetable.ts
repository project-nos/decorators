import { DecoratorContext } from './decorator';
import { meta, targetKey, targetsKey } from './meta';
import { CustomElement, CustomElementConstructor } from './element';

const targetChangedCallback = Symbol();
const targetsChangedCallback = Symbol();

export interface Targetable {
    [targetChangedCallback](key: PropertyKey, target: Element): void;
    [targetsChangedCallback](key: PropertyKey, targets: Element[]): void;
}

const findTargetElement = (clazz: CustomElement, name: string): Element | undefined => {
    const customElementTag = clazz.tagName.toLowerCase();
    for (const element of clazz.querySelectorAll(`[nos-${customElementTag}-target="${name}"]`)) {
        if (element.closest(customElementTag) === clazz) {
            return element;
        }
    }
};

const findTargetElements = (clazz: CustomElement, name: string): Element[] => {
    const customElementTag = clazz.tagName.toLowerCase();
    const elements = [];

    for (const element of clazz.querySelectorAll(`[nos-${customElementTag}-targets="${name}"]`)) {
        if (element.closest(customElementTag) === clazz) {
            elements.push(element);
        }
    }

    return elements;
};

const initialized = new WeakSet<CustomElement>();

const initializeTargetable = (clazz: CustomElement & Targetable): void => {
    if (initialized.has(clazz)) {
        return;
    }

    initialized.add(clazz);

    const proto = Object.getPrototypeOf(clazz);
    const target = meta(proto, targetKey);
    for (const [name] of target) {
        const element = findTargetElement(clazz, name);

        if (element === undefined) {
            continue;
        }

        Object.defineProperty(clazz, name, {
            configurable: true,
            get: function (): Element {
                return element;
            },
        });
    }

    const targets = meta(proto, targetsKey);
    for (const [name] of targets) {
        const elements = findTargetElements(clazz, name);

        if (!elements.length) {
            continue;
        }

        Object.defineProperty(clazz, name, {
            configurable: true,
            get: function (): Element[] {
                return elements;
            },
        });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function targetable(...args: any[]): any {
    const [clazz, context] = args as [CustomElementConstructor, DecoratorContext];

    if (typeof clazz !== 'function' || context.kind !== 'class') {
        throw new TypeError('The @targetable decorator is for use on classes only.');
    }

    return class extends clazz implements Targetable {
        mountCallback() {
            initializeTargetable(this);
            super.mountCallback();
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [targetChangedCallback]() {}

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [targetsChangedCallback]() {}
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function target(...args: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, context] = args as [unknown, DecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @target decorator is for use on properties only.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (value: any) {
        if (value !== undefined) {
            throw new Error(`Field "${String(context.name)}" cannot have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), targetKey).set(context.name.toString(), undefined);
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function targets(...args: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, context] = args as [unknown, DecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @targets decorator is for use on properties only.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (value: any) {
        if (value !== undefined) {
            throw new Error(`Field "${String(context.name)}" cannot have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), targetsKey).set(context.name.toString(), undefined);
    };
}
