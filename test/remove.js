var assert      = require('assert')
  , rest        = require('open-rest')
  , helper      = require('../')(rest);

describe("open-rest-helper-rest-remove", function() {

  describe("Argument check", function() {

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.remove.hook([]).exec();
      }, function(error) {
        return error instanceof Error && error.message == 'Remove instance hook on req.hooks[hook], so `hook` must be a string';
      });

      done();
    });

  });

  describe("Argument all right", function() {

    it("isDelete non-exists", function(done) {
      var model = {
        destroy: function() {
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              resolve();
            }, 100);
          });
        }
      };

      var req = {
        hooks: {
          user: model
        }
      };

      var res = {
        send: function(statusCode) {
          assert.equal(204, statusCode);
        }
      }

      helper.remove('user')(req, res, function(error) {
        assert.equal(null, error);
        done();
      });

    });

    it("isDelete exists", function(done) {
      var model = {
        isDelete: 'no',
        save: function() {
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              resolve();
            }, 100);
          });
        }
      };

      var req = {
        hooks: {
          user: model
        }
      };

      var res = {
        send: function(statusCode) {
          assert.equal(204, statusCode);
        }
      }

      helper.remove('user')(req, res, function(error) {
        assert.equal(null, error);
        assert.equal('yes', req.hooks.user.isDelete);
        done();
      });

    });

    it("only save isDelete when delete process", function(done) {
      var model = {
        isDelete: 'no',
        save: function(opts) {
          assert.deepEqual(opts, {
            fields: ['isDelete'],
            validate: false,
          });
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              resolve();
            }, 100);
          });
        }
      };

      var req = {
        hooks: {
          user: model
        }
      };

      var res = {
        send: function(statusCode) {
          assert.equal(204, statusCode);
        }
      }

      helper.remove('user')(req, res, function(error) {
        assert.equal(null, error);
        assert.equal('yes', req.hooks.user.isDelete);
        done();
      });

    });

  });

});
