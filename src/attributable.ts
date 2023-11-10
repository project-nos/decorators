/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { getAccessor, mustKebabCase } from './util.js';

type Converter<T = any> = {
    normalize: (value: string | null) => T;
    denormalize: (value: T) => string | boolean;
};

const numberConverter: Converter<number> = {
    normalize: (value) => Number(value || 0),
    denormalize: (value) => String(value),
};

const stringConverter: Converter<string> = {
    normalize: (value) => String(value),
    denormalize: (value) => String(value),
};

const arrayConverter: Converter<any[]> = {
    normalize: (value) => {
        value = JSON.parse(value || '[]');

        if (value === null || typeof value !== 'object' || !Array.isArray(value)) {
            throw new TypeError(`Expected value of type "array" but instead got value "${value}"`);
        }

        return value;
    },
    denormalize: (value) => JSON.stringify(value || []),
};

const objectConverter: Converter<object> = {
    normalize: (value) => {
        value = JSON.parse(value || '{}');

        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
        }

        return value;
    },
    denormalize: (value) => JSON.stringify(value || {}),
};

type TypeHint = NumberConstructor | BooleanConstructor | StringConstructor | ArrayConstructor | ObjectConstructor;

const converters = new Map<TypeHint, Converter>([
    [Number, numberConverter],
    [String, stringConverter],
    [Array, arrayConverter],
    [Object, objectConverter],
]);

const getConverter = (type: TypeHint): Converter => converters.get(type) ?? stringConverter;

export const initializeAttributable = (component: Component): void => {
    const attributeOptions = attributeOptionsMap.get(component);
    if (attributeOptions === undefined) {
        return;
    }

    for (const [name, options] of attributeOptions) {
        const kebab = mustKebabCase(name);
        const accessor = getAccessor(component, name);
        const converter = getConverter(options.type);

        const descriptor = {
            get(this: Component) {
                accessor.getter.call(this);

                if (options.type === Boolean) {
                    return this.hasAttribute(kebab);
                }

                return converter.normalize(this.getAttribute(kebab));
            },
            set(this: Component, fresh: any) {
                accessor.setter.call(this, fresh);
                if (options.type === Boolean) {
                    this.toggleAttribute(kebab, fresh);
                } else {
                    this.setAttribute(kebab, converter.denormalize(fresh) as string);
                }
            },
        };

        Object.defineProperty(component, name, { configurable: true, enumerable: true, ...descriptor });

        const initialValue = accessor.getter.call(component);
        if (initialValue !== undefined && !component.hasAttribute(kebab)) {
            if (options.type === Boolean) {
                component.toggleAttribute(kebab, initialValue);
            } else {
                component.setAttribute(kebab, converter.denormalize(initialValue) as string);
            }
        }
    }
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
    type: TypeHint;
};

type AttributeDecorator<C extends Component, V> = (
    target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
    context: ClassAccessorDecoratorContext<C, V> | ClassSetterDecoratorContext<C, V>,
) => void;

const attributeOptionsMap = new WeakMap<Component, Map<string, AttributeOptions>>();

export const attribute = <C extends Component, V>(options: AttributeOptions): AttributeDecorator<C, V> => {
    return (_, context) => {
        const { kind, addInitializer, name } = context;
        if (kind !== 'accessor' && kind !== 'setter') {
            throw new Error('The @attribute decorator is for use on accessors and setters only.');
        }

        addInitializer(function (this: C) {
            let attributeOptions = attributeOptionsMap.get(this);
            if (attributeOptions === undefined) {
                attributeOptionsMap.set(this, (attributeOptions = new Map()));
            }

            attributeOptions.set(name.toString(), options);
        });
    };
};
