// SPDX-License-Identifier: Apache-2.0

export default class FeeAssessmentMethod {
    /**
     * @hideconstructor
     * @internal
     * @param {boolean} value
     */
    constructor(value) {
        /** @readonly */
        this._value = value;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case FeeAssessmentMethod.Inclusive:
                return "INCLUSIVE";
            case FeeAssessmentMethod.Exclusive:
                return "EXCLUSIVE";
            default:
                return `UNKNOWN (${this._value.toString()})`;
        }
    }

    /**
     * @internal
     * @param {boolean} value
     * @returns {FeeAssessmentMethod}
     */
    static _fromValue(value) {
        switch (value) {
            case false:
                return FeeAssessmentMethod.Inclusive;
            case true:
                return FeeAssessmentMethod.Exclusive;
        }
    }

    /**
     * @returns {boolean}
     */
    valueOf() {
        return this._value;
    }
}

FeeAssessmentMethod.Inclusive = new FeeAssessmentMethod(false);
FeeAssessmentMethod.Exclusive = new FeeAssessmentMethod(true);
