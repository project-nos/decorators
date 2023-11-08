/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Converts a string to kebab-case and throws an error if no hyphens are present.
 *
 * @param {string} key - The input string to be converted to kebab-case.
 * @returns {string} The kebab-case representation of the input string.
 * @throws {DOMException} Throws a SyntaxError if the resulting string doesn't contain any hyphens.
 */
export const mustKebabCase = (key: string): string => {
    const transformed = kebabCase(key);

    if (!transformed.includes('-')) {
        throw new DOMException(`${key} is not a valid name`, 'SyntaxError');
    }

    return transformed;
};

/**
 * Converts a string to kebab-case.
 *
 * @param {string} key - The input string to be converted to kebab-case.
 * @returns {string} The kebab-case representation of the input string.
 */
export const kebabCase = (key: string): string => {
    return key
        .replace(/([A-Z]($|[a-z]))/g, '-$1')
        .replace(/--/g, '-')
        .replace(/^-|-$/, '')
        .toLowerCase();
};
