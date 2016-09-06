var assert      = require('assert')
  , rest        = require('open-rest')
  , Sequelize   = rest.Sequelize
  , helper      = require('../')(rest);

var sequelize = new Sequelize();
var Model = sequelize.define('book', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING(100),
  age: Sequelize.INTEGER.UNSIGNED
});

describe("open-rest-helper-rest-save", function() {

  describe("Argument validate error", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.save();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.save(Model, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

  });

  describe("All aguments validate passed", function() {

    it("normal changed", function(done) {

      var save = helper.save(Model, 'user');

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed: function() {
              return ['name'];
            },
            save: function(option) {
              assert.deepEqual({
                fields: ['name']
              }, option);
              return new Promise(function(resolve, reject) {
                setTimeout(function() {
                  resolve({
                    id: 1,
                    name: 'Redstone Zhao',
                    age: 36
                  });
                }, 20);
              });
            }
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao'
        }
      };

      var res = {
        send: function(data) {
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            age: 36
          }, data);
        }
      };

      save(req, res, function(error) {
        assert.equal(null, error);

        done();
      });

    });

    it("normal unchanged", function(done) {

      var save = helper.save(Model, 'user');

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed: function() {
              return false;
            }
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao'
        }
      };

      var res = {
        send: function(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header: function(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        }
      };

      save(req, res, function(error) {
        assert.equal(null, error);

        done();
      });

    });

    it("Has error when save", function(done) {

      var save = helper.save(Model, 'user');

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed: function() {
              return ['name'];
            },
            save: function(option) {
              assert.deepEqual({
                fields: ['name']
              }, option);
              return new Promise(function(resolve, reject) {
                setTimeout(function() {
                  reject(Error('Hello world'));
                }, 20);
              });
            }
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao'
        }
      };

      var res = {
        send: function(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header: function(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        }
      };

      save(req, res, function(error) {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });

    });

  });

});


