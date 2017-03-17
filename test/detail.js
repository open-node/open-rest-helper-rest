var assert      = require('assert')
  , rest        = require('open-rest')
  , om          = require('open-rest-with-mysql')(rest)
  , Sequelize   = rest.Sequelize
  , helper      = require('../')(rest);

var sequelize = new Sequelize();
var User = sequelize.define('book', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING(100)
});

describe("open-rest-helper-rest", function() {

  describe("validate argument", function() {

    it("hook is null", function(done) {
      assert.throws(function() {
        helper.detail();
      }, function(err) {
        return err instanceof Error && err.message === 'Geted instance will hook on req.hooks[hook], so `hook` must be a string';
      });

      done();
    });

    it("hook type error", function(done) {
      assert.throws(function() {
        helper.detail({hi: 'world'});
      }, function(err) {
        return err instanceof Error && err.message === 'Geted instance will hook on req.hooks[hook], so `hook` must be a string';
      });

      done();
    });

    it("attrs type error", function(done) {
      assert.throws(function() {
        helper.detail('user', 'string');
      }, function(err) {
        return err instanceof Error && err.message === 'Attach other data dict. key => value, value is req\'s path';
      });

      done();
    });

    it("attrs check error", function(done) {
      assert.throws(function() {
        helper.detail('user', {string: []});
      }, function(err) {
        return err instanceof Error && err.message === 'The attachs structure is key = > value, value must be a string';
      });

      done();
    });

    it("statusCode type error, String", function(done) {
      assert.throws(function() {
        helper.detail('user', null, 'hello');
      }, function(err) {
        return err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200';
      });

      done();
    });

    it("statusCode type error, Array", function(done) {
      assert.throws(function() {
        helper.detail('user', null, ['hello']);
      }, function(err) {
        return err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200';
      });

      done();
    });

  });

  describe('argument all right', function() {

    it('only hook', function(done) {
      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone'
          }
        },
        params: {
        }
      };

      var res = {
        send: function(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual({id: 1, name: 'Redstone'}, json);
        }
      };

      helper.detail('user')(req, res, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('attachs statusCode = 201, allowAttrs = true', function(done) {
      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36
          },
          address: '北京市昌平区'
        },
        params: {
          attrs: 'id,name,address',
        }
      };

      var res = {
        send: function(statusCode, json) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone',
            address: '北京市昌平区'
          }, json);
        }
      };

      var detail = helper.detail('user', {address: 'hooks.address'}, 201, true);
      detail(req, res, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('data is array', function(done) {
      var req = {
        hooks: {
          users: [{
            id: 1,
            name: 'Redstone',
            age: 36
          }],
          address: '北京市昌平区'
        },
        params: {
          attrs: 'id,name',
        }
      };

      var res = {
        send: function(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual([{
            id: 1,
            name: 'Redstone',
          }], json);
        }
      };

      var detail = helper.detail('users', null, null, true);
      detail(req, res, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('data exists JSON method', function(done) {
      var req = {
        hooks: {
          user: {
            toJSON: function() {
              return {
                id: 1,
                name: 'Redstone',
                age: 36
              };
            }
          },
          address: '北京市昌平区'
        },
        params: {
          attrs: 'id,name',
        }
      };

      var res = {
        send: function(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone',
          }, json);
        }
      };

      var detail = helper.detail('user', null, null, true);
      detail(req, res, function(error) {
        assert.equal(null, error);
        done();
      });
    });

  });

});


