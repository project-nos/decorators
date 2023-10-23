/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect, fixture, html } from '@open-wc/testing';
import { target, targets } from '../src/target.js';

describe('target', () => {
    class TargetTest extends HTMLElement {
        @target()
        accessor foo!: HTMLElement;

        accessor bar = 'hello';

        @target()
        accessor baz!: Element;

        @target()
        accessor bing!: Element;
    }

    window.customElements.define('target-test', TargetTest);

    let instance: TargetTest;
    beforeEach(async () => {
        instance = await fixture(
            html`<target-test>
                <div id="el1" target-test-target="foo"></div>
                <div id="el2" target-test-target="baz"></div>
                <div id="el3" target-test-target="bar bing"></div>
            </target-test>`,
        );
    });

    it('returns the first element where closest tag is the component', async () => {
        expect(instance).to.have.property('foo').exist.with.attribute('id', 'el1');
    });

    it('does not assign to non-target decorated properties', async () => {
        expect(instance).to.have.property('bar', 'hello');
    });

    it('returns the first element that has the exact target name', async () => {
        expect(instance).to.have.property('baz').exist.with.attribute('id', 'el2');
    });

    it('returns target when there are multiple target values', async () => {
        expect(instance).to.have.property('bing').exist.with.attribute('id', 'el3');
    });
});

describe('targets', () => {
    class TargetsTest extends HTMLElement {
        @targets()
        accessor foos!: HTMLElement[];

        accessor bars = 'hello';

        @targets()
        accessor bazs!: Element[];
    }

    window.customElements.define('targets-test', TargetsTest);

    let instance: TargetsTest;
    beforeEach(async () => {
        instance = await fixture(
            html`<targets-test>
                <div id="el1" targets-test-targets="foos"></div>
                <div id="el2" targets-test-targets="foos bazs"></div>
            </targets-test>`,
        );
    });

    it('returns the all elements where closest tag is the component', async () => {
        expect(instance).to.have.property('foos').with.lengthOf(2);
        expect(instance).to.have.nested.property('foos[0]').with.attribute('id', 'el1');
        expect(instance).to.have.nested.property('foos[1]').with.attribute('id', 'el2');

        expect(instance).to.have.property('bazs').with.lengthOf(1);
        expect(instance).to.have.nested.property('bazs[0]').with.attribute('id', 'el2');
    });

    it('does not assign to non-target decorated properties', async () => {
        expect(instance).to.have.property('bars', 'hello');
    });
});
