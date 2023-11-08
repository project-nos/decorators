/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { mustKebabCase } from './kebab.js';

const initializeAttributable = (component: Component): void => {
    for (const [name, definition] of attributeDefinitionsMap.get(component) || []) {
        const value = definition.value();
        const kebab = mustKebabCase(name);
        let descriptor: PropertyDescriptor | undefined;

        switch (definition.options.type) {
            case Number:
                descriptor = numberDescriptor(kebab);
                break;
            case Boolean:
                descriptor = booleanDescriptor(kebab);
                break;
            case String:
                descriptor = stringDescriptor(kebab);
                break;
            case Array:
                descriptor = arrayDescriptor(kebab);
                break;
            case Object:
                descriptor = objectDescriptor(kebab);
                break;
            default:
                throw new TypeError(`The provided type "${definition.options.type.toString()} is not supported`);
        }

        Object.defineProperty(component, name, Object.assign({ configurable: true, enumerable: true }, descriptor));
        if (value !== undefined && !component.hasAttribute(kebab)) {
            descriptor.set!.call(component, value);
        }
    }
};

const numberDescriptor = (name: string): PropertyDescriptor => {
    return {
        get: function (this: Component): number {
            return Number(this.getAttribute(name) || 0);
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(name, fresh);
        },
    };
};

const booleanDescriptor = (name: string): PropertyDescriptor => {
    return {
        get: function (this: Component): boolean {
            return this.hasAttribute(name);
        },
        set: function (this: Component, fresh: boolean) {
            this.toggleAttribute(name, fresh);
        },
    };
};

const stringDescriptor = (name: string): PropertyDescriptor => {
    return {
        get: function (this: Component): string {
            return this.getAttribute(name) || '';
        },
        set: function (this: Component, fresh: string) {
            this.setAttribute(name, fresh || '');
        },
    };
};

const arrayDescriptor = (name: string): PropertyDescriptor => {
    return {
        get: function (this: Component): object {
            const value = JSON.parse(this.getAttribute(name) || '[]');

            if (value === null || typeof value !== 'object' || !Array.isArray(value)) {
                throw new TypeError(`Expected value of type "array" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(name, JSON.stringify(fresh || []));
        },
    };
};

const objectDescriptor = (kebab: string): PropertyDescriptor => {
    return {
        get: function (this: Component): object {
            const value = JSON.parse(this.getAttribute(kebab) || '{}');

            if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
            }

            return value;
        },
        set: function (this: Component, fresh: object) {
            this.setAttribute(kebab, JSON.stringify(fresh || {}));
        },
    };
};

type AttributableDecorator = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target: ComponentConstructor, context: ClassDecoratorContext): any;
};

export const attributable = (): AttributableDecorator => {
    return (target) => {
        return class extends target {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(...args: any[]) {
                super(args);
                initializeAttributable(this);
            }
        };
    };
};

type AttributeOptions = {
    type: NumberConstructor | BooleanConstructor | StringConstructor | ArrayConstructor | ObjectConstructor;
};

type AttributeDecorator<C extends Component, V> = {
    (
        target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
        context: ClassAccessorDecoratorContext<C, V> | ClassSetterDecoratorContext<C, V>,
    ): void;
};

type AttributeDefinition = {
    options: AttributeOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value(): any;
};

const attributeDefinitionsMap = new WeakMap<Component, Map<string, AttributeDefinition>>();

export const attribute = <C extends Component, V>(options: AttributeOptions): AttributeDecorator<C, V> => {
    return (_, context) => {
        const { kind, addInitializer, name } = context;
        if (kind !== 'accessor' && kind !== 'setter') {
            throw new Error('The @attribute decorator is for use on accessors and setters only.');
        }

        addInitializer(function (this: C) {
            let attributeDefinitions = attributeDefinitionsMap.get(this);
            if (attributeDefinitions === undefined) {
                attributeDefinitionsMap.set(this, (attributeDefinitions = new Map()));
            }

            attributeDefinitions.set(name.toString(), {
                options: options,
                value: () => this[name as keyof C],
            });
        });
    };
};
