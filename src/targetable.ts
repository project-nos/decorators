/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { meta, targetKey, targetsKey } from './meta.js';
import { Component, ComponentConstructor } from './component.js';

const findTargetElement = (component: Component, name: string): Element | undefined => {
    const customElementTag = component.tagName.toLowerCase();

    for (const element of component.querySelectorAll(`[${customElementTag}-target~="${name}"]`)) {
        if (element.closest(customElementTag) === component) {
            return element;
        }
    }
};

const findTargetElements = (component: Component, name: string): Element[] => {
    const customElementTag = component.tagName.toLowerCase();
    const elements = [];

    for (const element of component.querySelectorAll(`[${customElementTag}-targets~="${name}"]`)) {
        if (element.closest(customElementTag) === component) {
            elements.push(element);
        }
    }

    return elements;
};

const initializeTargetable = (component: Component): void => {
    const proto = Object.getPrototypeOf(component);
    const target = meta(proto, targetKey);
    for (const [name] of target) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element | undefined {
                return findTargetElement(component, name);
            },
        });
    }

    const targets = meta(proto, targetsKey);
    for (const [name] of targets) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element[] {
                return findTargetElements(component, name);
            },
        });
    }
};

export const targetable = (): any => (component: ComponentConstructor, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
        throw new TypeError('The @targetable decorator is for use on classes only.');
    }

    return class extends component {
        mountCallback() {
            initializeTargetable(this);
            super.mountCallback();
        }
    };
};

export function target(...args: any[]): any {
    const [_, context] = args as [unknown, ClassFieldDecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @target decorator is for use on properties only.');
    }

    return function (value: any) {
        if (value !== undefined) {
            throw new Error(`Field "${String(context.name)}" cannot have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), targetKey).set(context.name.toString(), undefined);
    };
}

export function targets(...args: any[]): any {
    const [_, context] = args as [unknown, ClassFieldDecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @targets decorator is for use on properties only.');
    }

    return function (value: any) {
        if (value !== undefined) {
            throw new Error(`Field "${String(context.name)}" cannot have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), targetsKey).set(context.name.toString(), undefined);
    };
}
