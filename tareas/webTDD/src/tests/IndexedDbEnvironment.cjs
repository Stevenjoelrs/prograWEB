const { TestEnvironment } = require('jest-environment-jsdom')

module.exports = class IndexedDbEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context)
    // jsdom no expone structuredClone, que fake-indexeddb necesita.
    this.global.structuredClone = structuredClone
  }
}
