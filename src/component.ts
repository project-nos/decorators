/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Component extends HTMLElement {
    mountCallback(): void;
}

export interface ComponentConstructor {
    new (...args: any[]): Component;
}
