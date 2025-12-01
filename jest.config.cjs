module.exports = {
    testEnvironment: 'node',
    // Jest 30 exports the runner via "jest-circus/runner"; the old
    // "jest-circus/build/runner.js" path is blocked by package exports.
    testRunner: 'jest-circus/runner'
};
