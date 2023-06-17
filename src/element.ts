export interface CustomElement extends HTMLElement {
    mountCallback(): void;
}

export interface CustomElementConstructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: any[]): CustomElement;
}
