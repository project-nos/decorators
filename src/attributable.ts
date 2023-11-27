/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { Accessor, defineProperties, getAccessor, mustKebabCase } from './util.js';

type Converter<T = any> = {
    normalize: (value: string | null) => T;
    denormalize: (value: T) => string | boolean;
};

const numberConverter: Converter<number> = {
    normalize: (value) => Number(value || 0),
    denormalize: (value) => String(value),
};

const stringConverter: Converter<string> = {
    normalize: (value) => String(value || ''),
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

export type AttributeOptions = {
    type: TypeHint;
};

type AttributeDefinition = {
    name: string;
    kind: 'accessor' | 'setter';
    accessor: Accessor;
    options: AttributeOptions;
};

const attributeDefinitionsMap = new WeakMap<object, Map<PropertyKey, AttributeDefinition>>();

const readAttribute = (component: Component, definition: AttributeDefinition) => {
    const { options, name } = definition;

    if (options.type === Boolean) {
        return component.hasAttribute(name);
    }

    return getConverter(options.type).normalize(component.getAttribute(name));
};

const writeAttribute = (component: Component, definition: AttributeDefinition, value: any) => {
    const { options, name } = definition;

    if (options.type === Boolean) {
        component.toggleAttribute(name, value);
    } else {
        component.setAttribute(name, getConverter(options.type).denormalize(value) as string);
    }
};

export const initializeAttributable = (component: Component, metadata: object): void => {
    const attributeDefinitions = attributeDefinitionsMap.get(metadata);
    if (attributeDefinitions === undefined) {
        return;
    }

    for (const [key, definition] of attributeDefinitions) {
        const { name, kind, accessor } = definition;
        const descriptor = {
            get(this: Component) {
                if (kind === 'setter') {
                    return accessor.getter.call(this);
                }

                return readAttribute(this, definition);
            },
            set(this: Component, value: any) {
                if (kind === 'setter') {
                    accessor.setter.call(this, value);
                }

                writeAttribute(this, definition, value);
            },
        };

        defineProperties(component, key, descriptor);

        const hasAttribute = component.hasAttribute(name);
        if (hasAttribute && kind === 'setter') {
            accessor.setter.call(component, readAttribute(component, definition));
        }

        if (!hasAttribute) {
            const initialPropertyValue = accessor.getter.call(component);
            if (initialPropertyValue !== undefined) {
                writeAttribute(component, definition, initialPropertyValue);
            }
        }
    }
};

export const observeAttributable = (component: Component, metadata: object) => {
    const definitions = attributeDefinitionsMap.get(metadata);
    if (definitions === undefined) {
        return;
    }

    const filter = [...definitions.values()]
        .filter((definition) => definition.kind === 'setter')
        .map((definition) => definition.name);

    if (!filter.length) {
        return;
    }

    const handleMutation = (component: Component, mutation: MutationRecord) => {
        const { type, attributeName } = mutation;

        if (type !== 'attributes') {
            return;
        }

        const definition = [...definitions.values()].find((definition) => definition.name === attributeName);

        if (definition === undefined) {
            return;
        }

        definition.accessor.setter.call(component, readAttribute(component, definition));
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            handleMutation(component, mutation);
        }
    });

    observer.observe(component, {
        attributeFilter: filter,
    });
};

export type AttributableDecoratorContext<C extends ComponentConstructor> = ClassDecoratorContext<C> & {
    metadata: object;
};

type AttributableDecorator<C extends ComponentConstructor> = {
    (target: ComponentConstructor, context: AttributableDecoratorContext<C>): any;
};

export const attributable = <C extends ComponentConstructor>(): AttributableDecorator<C> => {
    return (target, context) => {
        const { metadata } = context;

        return class extends target {
            constructor(...args: any[]) {
                super(args);
                initializeAttributable(this, metadata);
            }

            connectedCallback() {
                super.connectedCallback?.();
                observeAttributable(this, metadata);
            }
        };
    };
};

export type AttributeDecoratorContext<C, V> = (
    | ClassAccessorDecoratorContext<C, V>
    | ClassSetterDecoratorContext<C, V>
) & {
    metadata: object;
};

type AttributeDecorator<C extends Component, V> = (
    target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
    context: AttributeDecoratorContext<C, V>,
) => void;

export const attribute = <C extends Component, V>(options: AttributeOptions): AttributeDecorator<C, V> => {
    return (_, context) => {
        initializeAttribute(context, options);
    };
};

export const initializeAttribute = <C extends Component, V>(
    context: AttributeDecoratorContext<C, V>,
    options: AttributeOptions,
) => {
    const { kind, addInitializer, metadata, name } = context;

    if (kind !== 'accessor' && kind !== 'setter') {
        throw new Error('The @attribute decorator is for use on accessors and setters only.');
    }

    addInitializer(function (this: C) {
        let definitions = attributeDefinitionsMap.get(metadata);
        if (definitions === undefined) {
            attributeDefinitionsMap.set(metadata, (definitions = new Map()));
        }

        definitions.set(name, {
            name: mustKebabCase(name.toString()),
            kind: kind,
            accessor: getAccessor(this, name),
            options: options,
        });
    });
};
