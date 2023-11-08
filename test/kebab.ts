/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from '@open-wc/testing';
import { kebabCase } from '../src/kebab.js';

describe('kebabCase', () => {
    const cases: Array<[string, string]> = [
        ['json', 'json'],
        ['fooBar', 'foo-bar'],
        ['FooBar', 'foo-bar'],
        ['autofocusWhenReady', 'autofocus-when-ready'],
        ['URLBar', 'url-bar'],
        ['ClipX', 'clip-x'],
        ['helloWorld', 'hello-world'],
    ];

    cases.map(([input, output]) =>
        it(`transforms ${String(input)} to ${output}`, () => expect(kebabCase(input)).to.equal(output)),
    );
});
