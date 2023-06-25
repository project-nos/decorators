/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { attributeKey, meta } from './meta.js';
import { mustParameterize, parameterize } from './parameterize.js';

const attributeChangedCallback = Symbol();
const serializeAttributeName = Symbol();

export interface Attributable {
    [key: PropertyKey]: unknown;

    [serializeAttributeName](name: PropertyKey): string;

    [attributeChangedCallback](changed: Map<PropertyKey, unknown>): void;
}

export const initializeAttributable = (component: Component & Attributable): void => {
    const proto = Object.getPrototypeOf(component);
    const attributes = meta(proto, attributeKey);
    for (const [name, value] of attributes) {
        const parameterized = mustParameterize(name);

        let descriptor: PropertyDescriptor;
        switch (typeof value) {
            case 'number':
                descriptor = {
                    configurable: true,
                    get: function (this: Component): number {
                        return Number(this.getAttribute(parameterized) || 0);
                    },
                    set: function (this: Component, fresh: string) {
                        this.setAttribute(parameterized, fresh);
                    },
                };

                break;
            case 'boolean':
                descriptor = {
                    configurable: true,
                    get: function (this: Component): boolean {
                        return this.hasAttribute(parameterized);
                    },
                    set: function (this: Component, fresh: boolean) {
                        this.toggleAttribute(parameterized, fresh);
                    },
                };

                break;
            default:
                descriptor = {
                    configurable: true,
                    get: function (this: Component): string {
                        return this.getAttribute(parameterized) || '';
                    },
                    set: function (this: Component, fresh: string) {
                        this.setAttribute(parameterized, fresh || '');
                    },
                };
        }

        Object.defineProperty(component, name, descriptor);
        if (name in component && !component.hasAttribute(parameterized)) {
            descriptor.set!.call(component, value);
        }
    }
};
export function attributable(...args: any[]): any {
    const [component, context] = args as [ComponentConstructor, ClassDecoratorContext];

    if (context.kind !== 'class') {
        throw new TypeError('The @attributable decorator is for use on classes only.');
    }

    return class extends component implements Attributable {
        mountCallback() {
            initializeAttributable(this);
            super.mountCallback();
        }

        [key: PropertyKey]: unknown;

        [serializeAttributeName](name: PropertyKey) {
            return parameterize(name);
        }

        [attributeChangedCallback](changed: Map<PropertyKey, unknown>) {
            for (const [name, value] of changed) {
                if (typeof value === 'boolean') {
                    this.toggleAttribute(this[serializeAttributeName](name), value);
                } else {
                    this.setAttribute(this[serializeAttributeName](name), String(value));
                }
            }
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
