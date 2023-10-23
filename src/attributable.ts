/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mustParameterize } from './parameterize.js';

type TypeHint = StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor;

const attributeMediator = <T extends HTMLElement, V>(name: string, type: TypeHint) => {
    const parameterized = mustParameterize(name);

    return {
        hasAttribute(element: T): boolean {
            return element.hasAttribute(parameterized);
        },
        fromAttribute(element: T): V {
            let value: V;
            switch (type) {
                case Boolean:
                    value = element.hasAttribute(parameterized) as V;
                    break;
                case Number:
                    value = Number(element.getAttribute(parameterized) || 0) as V;
                    break;
                case String:
                    value = String(element.getAttribute(parameterized) || 0) as V;
                    break;
                case Array:
                    value = JSON.parse(element.getAttribute(parameterized) || '[]');
                    if (value === null || typeof value !== 'object' || !Array.isArray(value)) {
                        throw new TypeError(`Expected value of type "array" but instead got value "${value}"`);
                    }
                    break;
                case Object:
                    value = JSON.parse(element.getAttribute(parameterized) || '{}');

                    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                        throw new TypeError(`Expected value of type "object" but instead got value "${value}"`);
                    }

                    break;
                default:
                    throw new TypeError(`Type "${type.name}" is not supported`);
            }

            return value;
        },
        toAttribute(element: T, value: V) {
            switch (type) {
                case Boolean:
                    element.toggleAttribute(parameterized, Boolean(value));
                    break;
                case Number:
                case String:
                    element.setAttribute(parameterized, String(value));
                    break;
                case Array:
                    element.setAttribute(parameterized, JSON.stringify(value || []));
                    break;
                case Object:
                    element.setAttribute(parameterized, JSON.stringify(value || {}));
                    break;
            }
        },
    };
};

type AttributeOptions = {
    readonly type: TypeHint;
};

type AttributeDecorator<T, V> = {
    (
        target: ClassAccessorDecoratorTarget<T, V>,
        context: ClassAccessorDecoratorContext<T, V>,
    ): ClassAccessorDecoratorResult<T, V>;
};

export const attribute = <T extends HTMLElement, V>(options: AttributeOptions): AttributeDecorator<T, V> => {
    return (_, context) => {
        const { kind, name } = context;

        if (kind !== 'accessor') {
            throw new TypeError('The @attribute decorator is for use on accessors only.');
        }

        const mediator = attributeMediator<T, V>(name.toString(), options.type);

        return {
            get(this: T) {
                return mediator.fromAttribute(this);
            },
            set(this: T, value: V) {
                return mediator.toAttribute(this, value);
            },
            init(this: T, value: V): V {
                if (value !== undefined && !mediator.hasAttribute(this)) {
                    mediator.toAttribute(this, value);
                }

                return value;
            },
        };
    };
};
