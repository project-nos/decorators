/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { targetRegistry, targetsRegistry } from './registry.js';

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

const initializeTargetable = (component: Component, metadata: DecoratorMetadataObject): void => {
    for (const name of targetRegistry(metadata).all()) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element | undefined {
                return findTargetElement(component, name);
            },
        });
    }

    for (const name of targetsRegistry(metadata).all()) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element[] {
                return findTargetElements(component, name);
            },
        });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const targetable = (): any => (constructor: ComponentConstructor, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
        throw new TypeError('The @targetable decorator is for use on classes only.');
    }

    return class extends constructor {
        mountCallback() {
            initializeTargetable(this, context.metadata!);
            super.mountCallback();
        }
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const target = (): any => (_: unknown, context: ClassFieldDecoratorContext) => {
    if (context.kind !== 'field') {
        throw new TypeError('The @target decorator is for use on properties only.');
    }

    return () => {
        targetRegistry(context.metadata!).push(context.name.toString());
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const targets = (): any => (_: unknown, context: ClassFieldDecoratorContext) => {
    if (context.kind !== 'field') {
        throw new TypeError('The @targets decorator is for use on properties only.');
    }

    return () => {
        targetsRegistry(context.metadata!).push(context.name.toString());
    };
};
