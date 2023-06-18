import { CustomElement } from '../src/element';
import { actionable } from '../src';
import { expect, fixture, html } from '@open-wc/testing';
import { fake } from 'sinon';

describe('actionable', () => {
    @actionable
    class ActionableTest extends HTMLElement implements CustomElement {
        foo = fake();

        bar = fake();

        handleEvent = fake();

        mountCallback(): void {}
    }

    window.customElements.define('actionable-test', ActionableTest);

    let instance: ActionableTest;
    beforeEach(async () => {
        instance = await fixture(html` <actionable-test actionable-test-action="foo#foo">
                <div id="el1" actionable-test-action="click#foo"></div>
                <div id="el2" actionable-test-action="custom:event#foo click#foo"></div>
                <div id="el3" actionable-test-action="click#baz focus#foo submit#foo"></div>
                <div id="el4" actionable-test-action="handle other"></div>
                <div id="el5" actionable-test-action="click#foo click#bar"></div>
            </actionable-test>
            <div id="el6" actionable-test-action="click#foo"></div>`);
        instance.mountCallback();
    });

    it('add events on elements based on their action attribute', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el1')!.click();
        expect(instance.foo).to.have.callCount(1);
    });

    it('allows for the presence of `:` in an event name', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el2')!.dispatchEvent(new CustomEvent('custom:event'));
        expect(instance.foo).to.have.callCount(1);
    });

    it('binds events on the component itself', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.dispatchEvent(new CustomEvent('foo'));
        expect(instance.foo).to.have.callCount(1);
    });

    it('does not bind elements whose closest selector is not this component', () => {
        instance.ownerDocument.querySelector<HTMLElement>('#el6')!.click();
        expect(instance.foo).to.have.callCount(0);
    });

    it('does not bind methods that dont exist', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el3')!.click();
        expect(instance.foo).to.have.callCount(0);
    });

    it('can bind multiple event types', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('focus'));
        expect(instance.foo).to.have.callCount(1);
        instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('submit'));
        expect(instance.foo).to.have.callCount(2);
        expect(instance.foo.getCall(0).args[0].type).to.equal('focus');
        expect(instance.foo.getCall(1).args[0].type).to.equal('submit');
    });

    it('binds to `handleEvent` is function name is omitted', () => {
        expect(instance.handleEvent).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el4')!.dispatchEvent(new CustomEvent('handle'));
        expect(instance.handleEvent).to.have.callCount(1);
        instance.querySelector<HTMLElement>('#el4')!.dispatchEvent(new CustomEvent('other'));
        expect(instance.handleEvent).to.have.callCount(2);
        expect(instance.handleEvent.getCall(0).args[0].type).to.equal('handle');
        expect(instance.handleEvent.getCall(1).args[0].type).to.equal('other');
    });

    it('can bind multiple actions separated by line feed', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el5')!.dispatchEvent(new CustomEvent('click'));
        expect(instance.foo).to.have.callCount(1);
        expect(instance.bar).to.have.callCount(1);
        expect(instance.foo.getCall(0).args[0].type).to.equal('click');
        expect(instance.bar.getCall(0).args[0].type).to.equal('click');
    });

    it('can bind multiple elements to the same event', () => {
        expect(instance.foo).to.have.callCount(0);
        instance.querySelector<HTMLElement>('#el1')!.click();
        expect(instance.foo).to.have.callCount(1);
        instance.querySelector<HTMLElement>('#el5')!.click();
        expect(instance.foo).to.have.callCount(2);
        expect(instance.foo.getCall(0).args[0].target.id).to.equal('el1');
        expect(instance.foo.getCall(1).args[0].target.id).to.equal('el5');
    });
});
