/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { mustParameterize } from './parameterize.js';

const initializeAttributable = (component: Component): void => {
    for (const [name, definition] of attributeDefinitionsMap.get(component) || []) {
        const value = definition.value();
        const parameterized = mustParameterize(name);
        let descriptor: PropertyDescriptor | undefined;

        switch (definition.options.type) {
            case Number:
                descriptor = numberDescriptor(parameterized);
                break;
            case Boolean:
                descriptor = booleanDescriptor(parameterized);
                break;
            case String:
                descriptor = stringDescriptor(parameterized);
                break;
            case Array:
                descriptor = arrayDescriptor(parameterized);
                break;
            case Object:
                descriptor = objectDescriptor(parameterized);
                break;
            default:
                throw new TypeError(`The provided type "${definition.options.type.toString()} is not supported`);
        }

        Object.defineProperty(component, name, Object.assign({ configurable: true, enumerable: true }, descriptor));
        if (value !== undefined && !component.hasAttribute(parameterized)) {
            descriptor.set!.call(component, value);
        }
    }
};

const numberDescriptor = (parameterized: string): PropertyDescriptor => {
    return {
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

type AttributableDecorator = {
    (target: ComponentConstructor, context: ClassDecoratorContext): any;
};

export const attributable = (): AttributableDecorator => {
    return (target) => {
        return class extends target {
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
