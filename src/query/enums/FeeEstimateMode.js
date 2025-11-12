const FeeEstimateMode = Object.freeze({
    STATE: 0, // Default: uses latest known state
    INTRINSIC: 1, // Ignores state-dependent factors
});

export default FeeEstimateMode;
