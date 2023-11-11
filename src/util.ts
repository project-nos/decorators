/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from './component.js';

/**
 * Converts a string to kebab-case and throws an error if no hyphens are present.
 *
 * @param {string} key - The input string to be converted to kebab-case.
 * @returns {string} The kebab-case representation of the input string.
 * @throws {DOMException} Throws a SyntaxError if the resulting string doesn't contain any hyphens.
 */
export const mustKebabCase = (key: string): string => {
    const kebabCase = toKebabCase(key);

    if (!kebabCase.includes('-')) {
        throw new DOMException(`${key} is not a valid name`, 'SyntaxError');
    }

    return kebabCase;
};

/**
 * Converts a string to kebab-case.
 *
 * @param {string} key - The input string to be converted to kebab-case.
 * @returns {string} The kebab-case representation of the input string.
 */
export const toKebabCase = (key: string): string => {
    return key
        .replace(/([A-Z]($|[a-z]))/g, '-$1')
        .replace(/--/g, '-')
        .replace(/^-|-$/, '')
        .toLowerCase();
};

export type Accessor = {
    getter: () => any;
    setter: (value: any) => void;
};

/**
 * Retrieves the property descriptor for the specified key in the prototype chain of the given instance.
 *
 * @param {unknown} instance - The object instance to search for the property.
 * @param {PropertyKey} key - The key of the property to retrieve the descriptor for.
 * @returns {PropertyDescriptor} The property descriptor if found, or a default descriptor if not found.
 */
export const getAccessor = (instance: unknown, key: PropertyKey): Accessor => {
    let descriptor: PropertyDescriptor | undefined;
    while (instance) {
        descriptor = Object.getOwnPropertyDescriptor(instance, key);

        if (descriptor) {
            break;
        }

        instance = Object.getPrototypeOf(instance);
    }

    return {
        getter: (descriptor && descriptor.get) || (() => undefined),
        setter: (descriptor && descriptor.set) || (() => undefined),
    };
};

/**
 * Defines a property on a component and ensures it is configurable and enumerable.
 *
 * @template C - The type of the component.
 * @param {C} component - The component on which property is defined.
 * @param {PropertyKey} key - The key of the property to define.
 * @param {PropertyDescriptor} descriptor - The descriptor for the property.
 */
export const defineProperties = <C extends Component>(
    component: C,
    key: PropertyKey,
    descriptor: PropertyDescriptor,
) => {
    Object.defineProperty(component, key, { configurable: true, enumerable: true, ...descriptor });
};
