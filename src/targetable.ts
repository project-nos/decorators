/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';

const targetRegistry = new WeakMap<DecoratorMetadataObject, string[]>();
const targetsRegistry = new WeakMap<DecoratorMetadataObject, string[]>();

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

const initializeTargetable = (component: Component, context: ClassDecoratorContext): void => {
    const target = targetRegistry.get(context.metadata!);
    if (target !== undefined) {
        for (const name of target) {
            Object.defineProperty(component, name, {
                configurable: true,
                get: function (): Element | undefined {
                    return findTargetElement(component, name);
                },
            });
        }
    }

    const targets = targetsRegistry.get(context.metadata!);
    if (targets !== undefined) {
        for (const name of targets) {
            Object.defineProperty(component, name, {
                configurable: true,
                get: function (): Element[] {
                    return findTargetElements(component, name);
                },
            });
        }
    }
};

export const targetable = (): any => (constructor: ComponentConstructor, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
        throw new TypeError('The @targetable decorator is for use on classes only.');
    }

    return class extends constructor {
        mountCallback() {
            initializeTargetable(this, context);
            super.mountCallback();
        }
    };
};

export const target = (): any => (_: unknown, context: ClassFieldDecoratorContext) => {
    if (context.kind !== 'field') {
        throw new TypeError('The @target decorator is for use on properties only.');
    }

    return () => {
        let target = targetRegistry.get(context.metadata!);
        if (target === undefined) {
            targetRegistry.set(context.metadata!, (target = []));
        }

        target.push(context.name.toString());
    };
};

export const targets = (): any => (_: unknown, context: ClassFieldDecoratorContext) => {
    if (context.kind !== 'field') {
        throw new TypeError('The @targets decorator is for use on properties only.');
    }

    return () => {
        let targets = targetsRegistry.get(context.metadata!);
        if (targets === undefined) {
            targetsRegistry.set(context.metadata!, (targets = []));
        }

        targets.push(context.name.toString());
    };
};
