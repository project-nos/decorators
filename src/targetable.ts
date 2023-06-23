/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DecoratorContext } from './decorator.js';
import { meta, targetKey, targetsKey } from './meta.js';
import { CustomElement, CustomElementConstructor } from './element.js';

const targetChangedCallback = Symbol();
const targetsChangedCallback = Symbol();

export interface Targetable {
    [targetChangedCallback](key: PropertyKey, target: Element): void;
    [targetsChangedCallback](key: PropertyKey, targets: Element[]): void;
}

const findTargetElement = (clazz: CustomElement, name: string): Element | undefined => {
    const customElementTag = clazz.tagName.toLowerCase();

    for (const element of clazz.querySelectorAll(`[${customElementTag}-target~="${name}"]`)) {
        if (element.closest(customElementTag) === clazz) {
            return element;
        }
    }
};

const findTargetElements = (clazz: CustomElement, name: string): Element[] => {
    const customElementTag = clazz.tagName.toLowerCase();
    const elements = [];

    for (const element of clazz.querySelectorAll(`[${customElementTag}-targets~="${name}"]`)) {
        if (element.closest(customElementTag) === clazz) {
            elements.push(element);
        }
    }

    return elements;
};

const initializeTargetable = (clazz: CustomElement & Targetable): void => {
    const proto = Object.getPrototypeOf(clazz);
    const target = meta(proto, targetKey);
    for (const [name] of target) {
        Object.defineProperty(clazz, name, {
            configurable: true,
            get: function (): Element | undefined {
                return findTargetElement(clazz, name);
            },
        });
    }

    const targets = meta(proto, targetsKey);
    for (const [name] of targets) {
        Object.defineProperty(clazz, name, {
            configurable: true,
            get: function (): Element[] {
                return findTargetElements(clazz, name);
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

        [targetChangedCallback]() {
            return;
        }

        [targetsChangedCallback]() {
            return;
        }
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
