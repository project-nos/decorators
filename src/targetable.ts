/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

const targetMetadata = new WeakMap<DecoratorMetadataObject, Set<string>>();
const targetsMetadata = new WeakMap<DecoratorMetadataObject, Set<string>>();

const initializeTargetable = (component: Component, metadata: DecoratorMetadataObject): void => {
    for (const name of targetMetadata.get(metadata) || []) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element | undefined {
                return findTargetElement(component, name);
            },
        });
    }

    for (const name of targetsMetadata.get(metadata) || []) {
        Object.defineProperty(component, name, {
            configurable: true,
            get: function (): Element[] {
                return findTargetElements(component, name);
            },
        });
    }
};

type TargetableContext = ClassDecoratorContext & {
    metadata: DecoratorMetadataObject;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const targetable = (): any => {
    return (constructor: ComponentConstructor, context: TargetableContext) => {
        const { kind, metadata } = context;

        if (kind !== 'class') {
            throw new TypeError('The @targetable decorator is for use on classes only.');
        }

        return class extends constructor {
            mountCallback() {
                initializeTargetable(this, metadata);
                super.mountCallback();
            }
        };
    };
};

type TargetContext<T, V> = ClassFieldDecoratorContext<T, V> & {
    metadata: DecoratorMetadataObject;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const target = <T extends Component, V>(): any => {
    return (_: unknown, context: TargetContext<T, V>) => {
        const { kind, name, metadata } = context;

        if (kind !== 'field') {
            throw new TypeError('The @target decorator is for use on fields only.');
        }

        let targets = targetMetadata.get(metadata);
        if (targets === undefined) {
            targetMetadata.set(metadata, (targets = new Set()));
        }

        targets.add(name.toString());
    };
};

type TargetsContext<T, V> = ClassFieldDecoratorContext<T, V> & {
    metadata: DecoratorMetadataObject;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const targets = <T extends Component, V>(): any => {
    return (_: unknown, context: TargetsContext<T, V>) => {
        const { kind, name, metadata } = context;

        if (kind !== 'field') {
            throw new TypeError('The @targets decorator is for use on fields only.');
        }

        let targets = targetsMetadata.get(metadata);
        if (targets === undefined) {
            targetsMetadata.set(metadata, (targets = new Set()));
        }

        targets.add(name.toString());
    };
};
