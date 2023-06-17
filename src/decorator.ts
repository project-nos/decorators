export interface Access {
    get?(): unknown;
    set?(value: unknown): void;
}
export interface DecoratorContext {
    kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor';
    name: string | symbol;
    access: Access;
    private?: boolean;
    static?: boolean;
    addInitializer?(initializer: () => void): void;
}
