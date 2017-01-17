/* jshint node: true */

var CoreObject = require('core-object');
var Promise = require('ember-cli/lib/ext/promise');

module.exports = CoreObject.extend({
  init: function (options, lib) {
    var mysqlOptions = {};
    var mysqlLib = lib;

    if (options.url) {
      mysqlOptions = options.url;
    }
    else {
      mysqlOptions = {
        user: options.user,
        password: options.password,
        database: options.database
      };

      // defaults to 'localhost'
      if (options.host) {
        mysqlOptions.host = options.host;
      }

      // defaults to 3306
      if (options.port) {
        mysqlOptions.port = options.port;
      }

      // host and port are ignored if this is passed
      if (options.socketPath) {
        mysqlOptions.socketPath = options.socketPath;
      }
    }

    if (!mysqlLib) {
      mysqlLib = require('./psql.js');
    }

    // This is, unfortunately, a promise.
    this._client = mysqlLib.createConnection(mysqlOptions);

    this._maxRecentUploads = options.maxRecentUploads;
    this._allowOverwrite = !!options.allowOverwrite;
  },

  upload: function (/*tableName, revisionKey, value*/) {
    var args = Array.prototype.slice.call(arguments);

    var tableName = args.shift();
    var value = args.pop();
    var revisionKey = args[0] || 'default';

    var maxEntries = this._maxRecentUploads;

    return Promise.resolve()
      .then(this._createIfTableDoesNotExist.bind(this, tableName))
      .then(this._uploadIfKeyDoesNotExist.bind(this, tableName, revisionKey, value))
      .then(this._listRevisions.bind(this, tableName))
      .then(this._trimRecentUploadsList.bind(this, tableName, maxEntries))
      .then(function () {
        return [tableName, revisionKey];
      });
  },

  activate: function (tableName, revisionKey) {
    return Promise.resolve()
      .then(this._validateRevisionKey.bind(this, tableName, revisionKey))
      .then(this._activateRevisionKey.bind(this, tableName, revisionKey));
  },

  activeRevisionKey: function (tableName) {
    return this._getRevisionKey(tableName, 'current');
  },

  fetchRevisions: function (tableName) {
    return Promise.resolve()
      .then(this.activeRevisionKey.bind(this, tableName))
      .then(this._listRevisions.bind(this, tableName));
  },

  _listRevisions: function (tableName, currentRevisionKey) {
    return this._client
      .then(function (conn) {
        var sql =
          "SELECT key, gitsha, deployer, extract(epoch from created_at) AS created_at " +
          "FROM $1^ WHERE key NOT LIKE 'current' ORDER BY id DESC";

        return conn.query(sql, [tableName]);
      })
      .then(function (rows) {
        return rows.map(function (row) {
          return {
            revision: row['key'],
            //version: row['gitsha'], // TODO
            timestamp: row['created_at'] * 1000,
            //deployer: row['deployer'], // TODO
            active: row['key'] === currentRevisionKey
          };
        });
      });
  },

  _validateRevisionKey: function (tableName, revisionKey) {
    return this._getRevisionKey(tableName, revisionKey)
      .catch(function () {
        return Promise.reject('`' + revisionKey + '` is not a valid revision key');
      });
  },

  _activateRevisionKey: function (tableName, revisionKey) {
    return this._setRevisionKey(tableName, 'current', revisionKey);
  },

  _getRevisionKey: function (tableName, revisionKey) {
    return this._client
      .then(function (conn) {
        var sql =
          "SELECT value FROM $1^ WHERE key LIKE $2";

        return conn.query(sql, [tableName, revisionKey]);
      })
      .then(function (rows) {
        if (rows.length > 0) {
          return rows[0]['value'];
        }
      });
  },

  _setRevisionKey: function (tableName, revisionKey, value) {
    return this._client.then(function (conn) {
      var sql = "WITH upsert AS(UPDATE $1^ SET value=$2 where key=$3 RETURNING *)" +
                "INSERT INTO $1^ (key, value, gitsha, deployer) SELECT $3, $2, NULL, NULL WHERE NOT EXISTS (SELECT * FROM upsert)"

      return conn.query(sql, [tableName, value, revisionKey]);
    });
  },

  _uploadIfKeyDoesNotExist: function (tableName, revisionKey, value) {
    var allowOverwrite = this._allowOverwrite;

    return Promise.resolve()
      .then(this._getRevisionKey.bind(this, tableName, revisionKey))
      .then(function (oldValue) {
        if (oldValue && !allowOverwrite) {
          return Promise.reject('Value already exists in `' + tableName + '`: ' + revisionKey);
        }
      })
      .then(this._setRevisionKey.bind(this, tableName, revisionKey, value));
  },

  _trimRecentUploadsList: function (tableName, maxEntries, revisions) {
    if (revisions.length <= maxEntries) {
      return Promise.resolve();
    }

    // Remove the entries that we're keeping!
    revisions.splice(0, maxEntries);

    return this._client.then(function (conn) {
      return Promise.all(revisions.map(function (revision) {
        var sql =
          "DELETE FROM " + conn.escapeId(tableName) + " " +
          "WHERE key LIKE " + conn.escape(revision.key);

        return conn.query(sql);
      }));
    });
  },

  _createIfTableDoesNotExist: function (tableName) {
    return this._client.then(function (conn) {
      var sql =
        "CREATE TABLE IF NOT EXISTS " + conn.escapeId(tableName) + " (" +
          "id SERIAL, " +
          "key varchar(255) NOT NULL, " +
          "value text NOT NULL, " +
          "gitsha bytea, " +
          "deployer varchar(255), " +
          "created_at timestamp DEFAULT CURRENT_TIMESTAMP, " +
          "PRIMARY KEY (id), " +
          "UNIQUE (key)" +
        ")";

      // TODO: Add functionality to update schema if table exists and is invalid.
      return conn.query(sql);
    });
  }
});
