module.exports = {
  ...require('../../.releaserc.js'),
  ghPages: {
    branch: 'gh-pages',
    from: 'target/docs',
    fo: 'lcov-utils'
  }
}
