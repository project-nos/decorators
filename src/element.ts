/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface CustomElement extends HTMLElement {
    mountCallback(): void;
}

export interface CustomElementConstructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: any[]): CustomElement;
}
