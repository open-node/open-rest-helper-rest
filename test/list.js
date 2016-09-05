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
  name: Sequelize.STRING(100)
});

describe("open-rest-helper-rest", function() {

  describe("list", function() {

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.list({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("opt argument type error", function(done) {
      assert.throws(function() {
        helper.list(Model, {});
      }, function(err) {
        return err instanceof Error && err.message === "FindAll option hooks's name, so `opt` must be a string"
      });
      done();
    });

    it("allowAttrs type error", function(done) {
      assert.throws(function() {
        helper.list(Model, null, 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow return attrs's name array";
      });
      done();
    });

    it("allowAttrs item type error", function(done) {
      assert.throws(function() {
        helper.list(Model, null, [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in allowAttrs must be a string.';
      });
      done();
    });

    it("allowAttrs item non-exists error", function(done) {
      assert.throws(function() {
        helper.list(Model, null, ['price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

    it("All arguments validate pass", function(done) {
      var list = helper.list(Model);
      var req = {
        params: {
          id: 1
        }
      };
      var res = {
        send: function(ls) {
          assert.deepEqual([], ls);
        },
        header: function(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(2, value);
        }
      };
      Model.findAll = function(option) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve([]);
          }, 100);
        });
      };
      Model.count = function(option) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve(2);
          }, 100);
        });
      };
      list(req, res, function(error) {
        assert.equal(null, error);
        done();
      });
    });

  });

});
