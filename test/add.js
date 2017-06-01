const assert = require('assert');
const rest = require('open-rest');
const _ = require('lodash');

const Sequelize = rest.Sequelize;
const helper = require('../')(rest);

const sequelize = new Sequelize();
const Model = sequelize.define('book', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  age: Sequelize.INTEGER.UNSIGNED,
});

describe('open-rest-helper-rest-add', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.add();
      }, (err) => (
        err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      ));
      done();
    });

    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.add({});
      }, (err) => (
        err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      ));
      done();
    });

    it("cols type error", function(done) {
      assert.throws(function() {
        helper.add(Model, 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow writed attrs's name array"
      });
      done();
    });

    it("cols item type error", function(done) {
      assert.throws(function() {
        helper.add(Model, [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in cols must be a string.';
      });
      done();
    });

    it('cols item non-exists error', function(done) {
      assert.throws(function() {
        helper.add(Model, ['id', 'price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.add(Model, null, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Added instance will hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

    it("attrs type error", function(done) {
      assert.throws(function() {
        helper.add(Model, null, null, 'string');
      }, function(err) {
        return err instanceof Error && err.message === 'Attach other data dict. key => value, value is req\'s path';
      });

      done();
    });

    it("attrs check error", function(done) {
      assert.throws(function() {
        helper.add(Model, null, null, {string: []});
      }, function(err) {
        return err instanceof Error && err.message === 'The attachs structure is key = > value, value must be a string';
      });

      done();
    });

  });

  describe("All aguments validate passed", function() {

    it("normal cols set, hook set", function(done) {

      var add = helper.add(Model, ['name', 'age'], 'user', {address: 'hooks.address'});

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
        send: function(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            address: '北京市昌平区'
          }, data);
        }
      };

      Model.build = function(attrs) {
        return _.extend({}, attrs, {
          save: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(_.extend({}, attrs, {
                  id: 1,
                }));
              }, 10);
            });
          }
        });
      };

      add(req, res, function(error) {
        try {
          assert.equal(null, error);

          done();
        } catch (e) {
          done(e);
        }
      });

    });

    it("normal cols set, hook unset", function(done) {

      var add = helper.add(Model, ['name', 'age'], null, {address: 'hooks.address'});

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
        send: function(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            address: '北京市昌平区'
          }, data);
        }
      };

      Model.build = function(attrs) {
        return _.extend({}, attrs, {
          save: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(_.extend({}, attrs, {
                  id: 1,
                }));
              }, 10);
            });
          }
        });
      };

      add(req, res, function(error) {
        try {
          assert.equal(null, error);

          done();
        } catch (e) {
          done(e);
        }
      });

    });

    it("Has error when beforeAdd", function(done) {

      var add = helper.add(Model, ['name', 'age'], null, {address: 'hooks.address'});

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
        send: function(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            address: '北京市昌平区'
          }, data);
        }
      };

      Model.build = function(attrs) {
        return _.extend({}, attrs, {
          save: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                reject(Error('Hello world'));
              }, 10);
            });
          }
        });
      };

      add(req, res, function(error) {
        try {
          assert.equal('Hello world', error.message);
          assert.ok(error instanceof Error);

          done();
        } catch (e) {
          done(e);
        }
      });

    });

  });

});
