/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { getAccessor, mustKebabCase } from './util.js';

type Converter = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    normalize: (value: string | null) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    denormalize: (value: any) => string | boolean;
};

const numberConverter: Converter = {
    normalize: (value) => {
        return Number(value || 0);
    },
    denormalize: (value) => {
        return String(value);
    },
};

const stringConverter: Converter = {
    normalize: (value) => {
        return String(value);
    },
    denormalize: (value) => {
        return String(value);
    },
};

const arrayConverter: Converter = {
    normalize: (value) => {
        const normalizedValue = JSON.parse(value || '[]');

        if (normalizedValue === null || typeof normalizedValue !== 'object' || !Array.isArray(normalizedValue)) {
            throw new TypeError(`Expected value of type "array" but instead got value "${normalizedValue}"`);
        }

        return normalizedValue;
    },
    denormalize: (value) => {
        return JSON.stringify(value || []);
    },
};

const objectConverter: Converter = {
    normalize: (value) => {
        value = JSON.parse(value || '{}');

        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
        }

        return value;
    },
    denormalize: (value) => {
        return JSON.stringify(value || {});
    },
};

type TypeHint = NumberConstructor | BooleanConstructor | StringConstructor | ArrayConstructor | ObjectConstructor;

const getConverter = (type: TypeHint): Converter => {
    switch (type) {
        case Number:
            return numberConverter;
        case Array:
            return arrayConverter;
        case Object:
            return objectConverter;
        default:
            return stringConverter;
    }
};

export const initializeAttributable = (component: Component): void => {
    for (const [name, options] of attributeOptionsMap.get(component) || []) {
        const kebab = mustKebabCase(name);
        const accessor = getAccessor(component, name);
        const converter = getConverter(options.type);

        const descriptor = {
            get: function (this: Component) {
                accessor.getter.call(this);

                if (options.type === Boolean) {
                    return this.hasAttribute(kebab);
                }

                return converter.normalize(this.getAttribute(kebab));
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            set: function (this: Component, fresh: any) {
                accessor.setter.call(this, fresh);
                if (options.type === Boolean) {
                    this.toggleAttribute(kebab, fresh);
                } else {
                    this.setAttribute(kebab, converter.denormalize(fresh) as string);
                }
            },
        };

        Object.defineProperty(component, name, Object.assign({ configurable: true, enumerable: true }, descriptor));

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
    type: TypeHint;
};

type AttributeDecorator<C extends Component, V> = {
    (
        target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
        context: ClassAccessorDecoratorContext<C, V> | ClassSetterDecoratorContext<C, V>,
    ): void;
};

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
