var assert      = require('assert')
  , rest        = require('open-rest')
  , om          = require('open-rest-with-mysql')(rest)
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

describe("open-rest-helper-rest-modify", function() {

  describe("Argument validate error", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.modify();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.modify({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.modify(Model, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

    it("cols type error", function(done) {
      assert.throws(function() {
        helper.modify(Model, 'user', 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow modify attrs's name array"
      });
      done();
    });

    it("cols item type error", function(done) {
      assert.throws(function() {
        helper.modify(Model, 'user', [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in cols must be a string.';
      });
      done();
    });

    it("cols item non-exists error", function(done) {
      assert.throws(function() {
        helper.modify(Model, 'user', ['id', 'price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

  });

  describe("All aguments validate passed", function() {

    it("normal changed", function(done) {

      var modify = helper.modify(Model, 'user', ['name']);

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

      modify(req, res, function(error) {
        assert.equal(null, error);

        done();
      });

    });

    it("normal unchanged", function(done) {

      var modify = helper.modify(Model, 'user');

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

      modify(req, res, function(error) {
        assert.equal(null, error);

        done();
      });

    });

    it("Has error when save", function(done) {

      var modify = helper.modify(Model, 'user');

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

      modify(req, res, function(error) {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });

    });

    it("Has error when beforeModify", function(done) {

      var modify = helper.modify(Model, 'user', ['name', 'age']);

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed: function() {
              return ['name'];
            }
          }
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

      modify(req, res, function(error) {
        assert.ok(error instanceof Error);
        assert.equal("Cannot read property 'hasOwnProperty' of undefined", error.message);

        done();
      });
    });

  });

});


