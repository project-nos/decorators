/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentConstructor } from './component.js';
import { initializeActionable, observeActionable } from './actionable.js';
import { initializeAttributable } from './attributable.js';
import { initializeTargetable } from './targetable.js';

type ControllableDecorator = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target: ComponentConstructor, context: ClassDecoratorContext): any;
};

export const controllable = (): ControllableDecorator => {
    return (target) => {
        return class extends target {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(...args: any[]) {
                super(args);
                initializeActionable(this, this);
                initializeAttributable(this);
                initializeTargetable(this);
            }

            connectedCallback() {
                super.connectedCallback?.();
                observeActionable(this);
            }
        };
    };
};
