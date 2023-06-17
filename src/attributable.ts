import { CustomElement, CustomElementConstructor } from './element';
import { DecoratorContext } from './decorator';
import { attributeKey, meta } from './meta';
import { mustParameterize, parameterize } from './parameterize';

const attributeChangedCallback = Symbol();
const serializeAttributeName = Symbol();

export interface Attributable {
    [key: PropertyKey]: unknown;

    [serializeAttributeName](name: PropertyKey): string;

    [attributeChangedCallback](changed: Map<PropertyKey, unknown>): void;
}

const initialized = new WeakSet<CustomElement>();

export const initializeAttributes = (clazz: CustomElement & Attributable): void => {
    if (initialized.has(clazz)) {
        return;
    }

    initialized.add(clazz);

    const proto = Object.getPrototypeOf(clazz);
    const attributes = meta(proto, attributeKey);
    for (const [name, value] of attributes) {
        const parameterized = mustParameterize(name);

        let descriptor: PropertyDescriptor;
        switch (typeof value) {
            case 'number':
                descriptor = {
                    configurable: true,
                    get: function (this: CustomElement): number {
                        return Number(this.getAttribute(parameterized) || 0);
                    },
                    set: function (this: CustomElement, fresh: string) {
                        this.setAttribute(parameterized, fresh);
                    },
                };

                break;
            case 'boolean':
                descriptor = {
                    configurable: true,
                    get: function (this: CustomElement): boolean {
                        return this.hasAttribute(parameterized);
                    },
                    set: function (this: CustomElement, fresh: boolean) {
                        this.toggleAttribute(parameterized, fresh);
                    },
                };

                break;
            default:
                descriptor = {
                    configurable: true,
                    get: function (this: CustomElement): string {
                        return this.getAttribute(parameterized) || '';
                    },
                    set: function (this: CustomElement, fresh: string) {
                        this.setAttribute(parameterized, fresh || '');
                    },
                };
        }

        Object.defineProperty(clazz, name, descriptor);
        if (name in clazz && !clazz.hasAttribute(parameterized)) {
            descriptor.set!.call(clazz, value);
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attributable(...args: any[]): any {
    const [clazz, context] = args as [CustomElementConstructor, DecoratorContext];

    if (typeof clazz !== 'function' || context.kind !== 'class') {
        throw new TypeError('The @attributable decorator is for use on classes only.');
    }

    return class extends clazz implements Attributable {
        [key: PropertyKey]: unknown;

        mountCallback() {
            initializeAttributes(this);
            super.mountCallback();
        }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attribute(...args: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, context] = args as [unknown, DecoratorContext];

    if (context.kind !== 'field') {
        throw new TypeError('The @attribute decorator is for use on properties only.');
    }

    return function (value: string | boolean | number) {
        if (value === undefined) {
            throw new Error(`Field "${String(context.name)}" needs to have an initial value.`);
        }

        meta(Object.getPrototypeOf(this), attributeKey).set(context.name.toString(), value);
    };
}
