module.exports = {
  ...require('../../.releaserc.cjs'),
  ghPages: {
    branch: 'gh-pages',
    from: 'target/docs',
    fo: 'lcov-utils'
  }
}
