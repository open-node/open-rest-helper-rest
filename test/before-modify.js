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

describe("open-rest-helper-rest-beforeModify", function() {

  describe("Argument validate error", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.beforeModify();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.beforeModify({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.beforeModify(Model, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

    it("cols type error", function(done) {
      assert.throws(function() {
        helper.beforeModify(Model, 'user', 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow modify attrs's name array"
      });
      done();
    });

    it("cols item type error", function(done) {
      assert.throws(function() {
        helper.beforeModify(Model, 'user', [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in cols must be a string.';
      });
      done();
    });

    it("cols item non-exists error", function(done) {
      assert.throws(function() {
        helper.beforeModify(Model, 'user', ['id', 'price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

  });

  describe("All aguments validate passed", function() {

    it("normal cols set", function(done) {

      var beforeModify = helper.beforeModify(Model, 'user', ['name']);

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao'
        }
      };

      var res = {
      };

      beforeModify(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36
        }, req.hooks.user);

        done();
      });

    });

    it("cols unset, editableCols exists", function(done) {

      var beforeModify = helper.beforeModify(Model, 'user');

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
      };

      Model.editableCols = ['name', 'age'];

      beforeModify(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36
        }, req.hooks.user);

        done();
      });

    });

    it("cols unset, editableCols non-exists, writableCols exists", function(done) {

      var beforeModify = helper.beforeModify(Model, 'user');

      var req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36
          }
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
      };

      Model.editableCols = null;
      Model.writableCols = ['name', 'age'];

      beforeModify(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36
        }, req.hooks.user);

        done();
      });
    });
  });

});

