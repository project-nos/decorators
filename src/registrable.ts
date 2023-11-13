/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentConstructor } from './component.js';
import { mustKebabCase } from './util.js';

type RegistrableDecorator<C extends ComponentConstructor> = {
    (target: ComponentConstructor, context: ClassDecoratorContext<C>): any;
};

export const initializeRegistrable = (addInitializer: (initializer: (this: ComponentConstructor) => void) => void) => {
    addInitializer(function (this) {
        try {
            customElements.define(mustKebabCase(this.name), this);
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === 'NotSupportedError') {
                return;
            }

            throw error;
        }
    });
};

export const registrable = <C extends ComponentConstructor>(): RegistrableDecorator<C> => {
    return (_, context) => {
        const { addInitializer } = context;

        initializeRegistrable(addInitializer);
    };
};
