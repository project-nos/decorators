/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { attributeKey, meta } from './meta.js';
import { mustParameterize } from './parameterize.js';

export const initializeAttributable = (component: Component): void => {
    const proto = Object.getPrototypeOf(component);
    const attributes = meta(proto, attributeKey);
    for (const [name, value] of attributes) {
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
            throw new TypeError(`The type of the provided default value "${value} is not supported`);
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

export function attributable(...args: any[]): any {
    const [component, context] = args as [ComponentConstructor, ClassDecoratorContext];

    if (context.kind !== 'class') {
        throw new TypeError('The @attributable decorator is for use on classes only.');
    }

    return class extends component {
        mountCallback() {
            initializeAttributable(this);
            super.mountCallback();
        }
    };
}

export function attribute(...args: any[]): any {
    const [_, context] = args as [unknown, ClassFieldDecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @attribute decorator is for use on properties only.');
    }

    return function (value: any) {
        if (value === undefined) {
            throw new Error(`Field "${String(context.name)}" needs to have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), attributeKey).set(context.name.toString(), value);
    };
}
