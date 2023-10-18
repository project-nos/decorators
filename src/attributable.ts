/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { mustParameterize } from './parameterize.js';

const attributeRegistry = new WeakMap<DecoratorMetadataObject, Map<string, string | number | boolean | object>>();

const initializeAttributable = (component: Component, context: ClassDecoratorContext): void => {
    const attribute = attributeRegistry.get(context.metadata!);
    if (attribute === undefined) {
        return;
    }

    for (const [name, value] of attribute) {
        const parameterized = mustParameterize(name);
        let descriptor: PropertyDescriptor | undefined;

        if (typeof value === 'number') {
            descriptor = numberDescriptor(parameterized);
        } else if (typeof value === 'boolean') {
            descriptor = booleanDescriptor(parameterized);
        } else if (typeof value === 'string') {
            descriptor = stringDescriptor(parameterized);
        } else if (typeof value === 'object' && Array.isArray(value)) {
            descriptor = arrayDescriptor(parameterized);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            descriptor = objectDescriptor(parameterized);
        }

        if (descriptor === undefined) {
            throw new TypeError(`The type for "${value} is not supported`);
        }

        Object.defineProperty(component, name, descriptor);
        if (name in component && !component.hasAttribute(parameterized)) {
            descriptor.set!.call(component, value);
        }
    }
};

const numberDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
        configurable: true,
        get: function (this: Component): number {
            return Number(this.getAttribute(parameterized) || 0);
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(parameterized, fresh);
        },
    };
};

const booleanDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
        configurable: true,
        get: function (this: Component): boolean {
            return this.hasAttribute(parameterized);
        },
        set: function (this: Component, fresh: boolean) {
            this.toggleAttribute(parameterized, fresh);
        },
    };
};

const stringDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
        configurable: true,
        get: function (this: Component): string {
            return this.getAttribute(parameterized) || '';
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(parameterized, fresh || '');
        },
    };
};

const arrayDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
        configurable: true,
        get: function (this: Component): object {
            const value = JSON.parse(this.getAttribute(parameterized) || '[]');

            if (value === null || typeof value !== 'object' || !Array.isArray(value)) {
                throw new TypeError(`Expected value of type "array" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(parameterized, JSON.stringify(fresh || []));
        },
    };
};

const objectDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
        configurable: true,
        get: function (this: Component): object {
            const value = JSON.parse(this.getAttribute(parameterized) || '{}');

            if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(parameterized, JSON.stringify(fresh || {}));
        },
    };
};

export const attributable = (): any => (constructor: ComponentConstructor, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
        throw new TypeError('The @attributable decorator is for use on classes only.');
    }

    return class extends constructor {
        mountCallback() {
            initializeAttributable(this, context);
            super.mountCallback();
        }
    };
};

export const attribute =
    (options: {
        readonly type:
            | StringConstructor
            | NumberConstructor
            | BooleanConstructor
            | ArrayConstructor
            | ObjectConstructor;
    }): any =>
    (_: unknown, context: ClassFieldDecoratorContext) => {
        if (context.kind !== 'field') {
            throw new TypeError('The @attribute decorator is for use on properties only.');
        }

        return (value: any) => {
            if (value !== undefined && value.constructor !== options.type) {
                throw new TypeError('The initial value of the attribute does not match the declared type.');
            }

            let attribute = attributeRegistry.get(context.metadata!);
            if (attribute === undefined) {
                attributeRegistry.set(context.metadata!, (attribute = new Map()));
            }

            attribute.set(context.name.toString(), value ?? new options.type().valueOf());
        };
    };
