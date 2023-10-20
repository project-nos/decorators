/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { mustParameterize } from './parameterize.js';

type TypeHint = StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor;

const attributeMetadata = new WeakMap<DecoratorMetadataObject, Map<string, TypeHint>>();

const findPropertyDescriptor = (instance: unknown, key: PropertyKey): PropertyDescriptor | undefined => {
    while (instance) {
        const descriptor = Object.getOwnPropertyDescriptor(instance, key);
        if (descriptor) {
            return descriptor;
        }

        instance = Object.getPrototypeOf(instance);
    }
};

type GetCallback = () => unknown;
type SetCallback = (v: unknown) => void;

const initializeAttributable = (component: Component, metadata: DecoratorMetadataObject) => {
    for (const [name, type] of attributeMetadata.get(metadata) || []) {
        const access = findPropertyDescriptor(component, name) || {
            value: void 0,
            configurable: true,
            writable: true,
            enumerable: true,
        };

        let value: unknown;
        if (access.get) {
            value = access.get.call(component);
        } else if ('value' in access) {
            value = access.value;
        }

        const getCallback: GetCallback = access.get || (() => value);
        const setCallback: SetCallback = access.set || ((v: unknown) => v);
        const parameterized = mustParameterize(name);

        let descriptor: PropertyDescriptor;
        switch (type) {
            case Number:
                descriptor = numberDescriptor(parameterized, getCallback, setCallback);
                break;
            case Boolean:
                descriptor = booleanDescriptor(parameterized, getCallback, setCallback);
                break;
            case String:
                descriptor = stringDescriptor(parameterized, getCallback, setCallback);
                break;
            case Array:
                descriptor = arrayDescriptor(parameterized, getCallback, setCallback);
                break;
            case Object:
                descriptor = objectDescriptor(parameterized, getCallback, setCallback);
                break;
            default:
                throw new TypeError(`Type "${type.name} is not supported`);
        }

        Object.defineProperty(component, name, Object.assign({ configurable: true, enumerable: true }, descriptor));
        if (value !== undefined && name in component && !component.hasAttribute(parameterized)) {
            descriptor.set!.call(component, value);
        }
    }
};

const numberDescriptor = (name: string, getCallback: GetCallback, setCallback: SetCallback): PropertyDescriptor => {
    return {
        get: function (this: Component): number {
            if (!this.hasAttribute(name)) {
                return Number(getCallback.call(this) || 0);
            }

            return Number(this.getAttribute(name) || 0);
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(name, fresh);

            if (!Object.is(Number(getCallback.call(this) || 0), fresh)) {
                setCallback.call(this, fresh);
            }
        },
    };
};

const booleanDescriptor = (name: string, getCallback: GetCallback, setCallback: SetCallback): PropertyDescriptor => {
    return {
        get: function (this: Component): boolean {
            return this.hasAttribute(name);
        },
        set: function (this: Component, fresh: boolean) {
            this.toggleAttribute(name, fresh);

            if (!Object.is(Boolean(getCallback.call(this) || false), fresh)) {
                setCallback.call(this, fresh);
            }
        },
    };
};

const stringDescriptor = (name: string, getCallback: GetCallback, setCallback: SetCallback): PropertyDescriptor => {
    return {
        get: function (this: Component): string {
            if (!this.hasAttribute(name)) {
                return String(getCallback.call(this) || '');
            }

            return String(this.getAttribute(name) || '');
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(name, fresh);

            if (!Object.is(String(getCallback.call(this) || ''), fresh)) {
                setCallback.call(this, fresh);
            }
        },
    };
};

const arrayDescriptor = (name: string, getCallback: GetCallback, setCallback: SetCallback): PropertyDescriptor => {
    return {
        get: function (this: Component): object {
            if (!this.hasAttribute(name)) {
                return Array(getCallback.call(this) || []);
            }

            const value = JSON.parse(this.getAttribute(name) || '[]');

            if (value === null || typeof value !== 'object' || !Array.isArray(value)) {
                throw new TypeError(`Expected value of type "array" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(name, JSON.stringify(fresh || []));

            if (!Object.is(Array(getCallback.call(this) || []), fresh)) {
                setCallback.call(this, fresh);
            }
        },
    };
};

const objectDescriptor = (name: string, getCallback: GetCallback, setCallback: SetCallback): PropertyDescriptor => {
    return {
        get: function (this: Component): object {
            if (!this.hasAttribute(name)) {
                return Object(getCallback.call(this) || {});
            }

            const value = JSON.parse(this.getAttribute(name) || '{}');

            if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(name, JSON.stringify(fresh || {}));

            if (!Object.is(Object(getCallback.call(this) || {}), fresh)) {
                setCallback.call(this, fresh);
            }
        },
    };
};

type AttributableContext = ClassDecoratorContext & {
    metadata: DecoratorMetadataObject;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attributable = (): any => {
    return (constructor: ComponentConstructor, context: AttributableContext) => {
        const { kind, metadata } = context;

        if (kind !== 'class') {
            throw new TypeError('The @attributable decorator is for use on classes only.');
        }

        return class extends constructor {
            mountCallback() {
                initializeAttributable(this, metadata);
                super.mountCallback();
            }
        };
    };
};

interface AttributeOptions {
    readonly type: TypeHint;
}

type AttributeContext<T, V> = (ClassFieldDecoratorContext<T, V> | ClassSetterDecoratorContext<T, V>) & {
    metadata: DecoratorMetadataObject;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attribute = <T extends Component, V>(options: AttributeOptions): any => {
    return (_: undefined, context: AttributeContext<T, V>) => {
        const { kind, name, metadata } = context;

        if (kind !== 'field' && kind !== 'setter') {
            throw new TypeError('The @attribute decorator is for use on fields and setters only.');
        }

        let attributes = attributeMetadata.get(metadata);
        if (attributes === undefined) {
            attributeMetadata.set(metadata, (attributes = new Map()));
        }

        attributes.set(name.toString(), options.type);
    };
};
