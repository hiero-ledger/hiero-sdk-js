export default class Key {
    /**
     * Keep concrete key overrides visible in generated type declarations.
     * @returns {string}
     */
    toString() {
        return Object.prototype.toString.call(this);
    }
}
