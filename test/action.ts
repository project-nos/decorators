/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect, fixture, html } from '@open-wc/testing';
import { action } from '../src/action.js';

describe('actionable', () => {
    class ActionableTest extends HTMLElement {
        fooCallCount = 0;
        barCallCount = 0;

        @action()
        foo() {
            this.fooCallCount += 1;
        }

        @action()
        bar() {
            this.barCallCount += 1;
        }
    }

    window.customElements.define('actionable-test', ActionableTest);

    let instance: ActionableTest;
    beforeEach(async () => {
        instance = await fixture(
            html` <actionable-test actionable-test-action="foo#foo">
                    <div id="el1" actionable-test-action="click#foo"></div>
                    <div id="el2" actionable-test-action="custom:event#foo click#foo"></div>
                    <div id="el3" actionable-test-action="click#baz focus#foo submit#foo"></div>
                    <div id="el4" actionable-test-action="click#foo click#bar"></div>
                </actionable-test>
                <div id="el5" actionable-test-action="click#foo"></div>`,
        );
    });

    it('add events on elements based on their action attribute', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el1')!.click();
        expect(instance.fooCallCount).to.be.equal(1);
    });

    it('allows for the presence of `:` in an event name', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el2')!.dispatchEvent(new CustomEvent('custom:event'));
        expect(instance.fooCallCount).to.be.equal(1);
    });

    it('binds events on the component itself', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.dispatchEvent(new CustomEvent('foo'));
        expect(instance.fooCallCount).to.be.equal(1);
    });

    it('does not bind elements whose closest selector is not this component', () => {
        instance.ownerDocument.querySelector<HTMLElement>('#el5')!.click();
        expect(instance.fooCallCount).to.be.equal(0);
    });

    it('does not bind methods that dont exist', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el3')!.click();
        expect(instance.fooCallCount).to.be.equal(0);
    });

    it('can bind multiple event types', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('focus'));
        expect(instance.fooCallCount).to.be.equal(1);
        instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('submit'));
        expect(instance.fooCallCount).to.be.equal(2);
    });

    it('can bind multiple actions separated by line feed', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el4')!.dispatchEvent(new CustomEvent('click'));
        expect(instance.fooCallCount).to.be.equal(1);
        expect(instance.barCallCount).to.be.equal(1);
    });

    it('can bind multiple elements to the same event', () => {
        expect(instance.fooCallCount).to.be.equal(0);
        instance.querySelector<HTMLElement>('#el1')!.click();
        expect(instance.fooCallCount).to.be.equal(1);
        instance.querySelector<HTMLElement>('#el4')!.click();
        expect(instance.fooCallCount).to.be.equal(2);
    });
});
