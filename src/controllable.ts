/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentConstructor } from './component.js';
import { initializeActionable, observeActionable } from './actionable.js';
import { initializeAttributable, observeAttributable } from './attributable.js';
import { initializeTargetable } from './targetable.js';

type ControllableDecoratorContext = ClassDecoratorContext & { metadata: object };

type ControllableDecorator = {
    (target: ComponentConstructor, context: ControllableDecoratorContext): any;
};

export const controllable = (): ControllableDecorator => {
    return (target, context) => {
        const { metadata } = context;

        return class extends target {
            constructor(...args: any[]) {
                super(args);
                initializeActionable(this, this);
                initializeAttributable(this, metadata);
                initializeTargetable(this, metadata);
            }

            connectedCallback() {
                super.connectedCallback?.();
                observeActionable(this);
                observeAttributable(this, metadata);
            }
        };
    };
};
