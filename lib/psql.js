var pg = require('pg-promise')();
var Promise = require('ember-cli/lib/ext/promise');

module.exports = {
  createConnection: function (opts) {
    this.db = pg(opts);
    return Promise.resolve(this);
  },
  query: function() {
    return this.db.query.apply(this.db, arguments);
  },
  escapeId: function(val) {
    return val;
  },
  escape: function(val) {
    return "'" + val + "'";
  }
}