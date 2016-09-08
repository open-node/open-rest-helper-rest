var assert      = require('assert')
  , rest        = require('open-rest')
  , _           = require('lodash')
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

describe("open-rest-helper-rest-beforeAdd", function() {

  describe("Argument validate error", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.beforeAdd();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.beforeAdd({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("cols type error", function(done) {
      assert.throws(function() {
        helper.beforeAdd(Model, 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow writed attrs's name array"
      });
      done();
    });

    it("cols item type error", function(done) {
      assert.throws(function() {
        helper.beforeAdd(Model, [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in cols must be a string.';
      });
      done();
    });

    it("cols item non-exists error", function(done) {
      assert.throws(function() {
        helper.beforeAdd(Model, ['id', 'price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.beforeAdd(Model, null, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Added instance will hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });


  });

  describe("All aguments validate passed", function() {

    it("normal cols set, hook set", function(done) {

      var beforeAdd = helper.beforeAdd(Model, ['name', 'age'], 'user');

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
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

      beforeAdd(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36
        }, req.hooks.user);

        done();
      });

    });

    it("normal cols unset, hook set, creatorId, clientIp", function(done) {

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        },
        user: {
          id: 99999,
          name: '赵雄飞'
        },
        headers: {
          'x-forwarded-for': '192.168.199.199'
        }
      };

      var res = {
      };

      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
      });

      var beforeAdd = helper.beforeAdd(Model, null, 'user');

      Model.writableCols = ['name', 'age'];

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

      beforeAdd(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36,
          creatorId: 99999,
          clientIp: '192.168.199.199'
        }, req.hooks.user);

        done();
      });

    });

    it("Has error when save", function(done) {

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        },
        user: {
          id: 99999,
          name: '赵雄飞'
        },
        headers: {
          'x-forwarded-for': '192.168.199.199'
        }
      };

      var res = {
      };

      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
      });

      var beforeAdd = helper.beforeAdd(Model, null, 'user');

      Model.writableCols = ['name', 'age'];

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

      beforeAdd(req, res, function(error) {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });

    });

    it("set unique isDelete non-exists", function(done) {

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          email: '13740080@qq.com',
          age: 36
        },
        user: {
          id: 99999,
          name: '赵雄飞'
        },
        headers: {
          'x-forwarded-for': '192.168.199.199'
        }
      };

      var res = {
      };

      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING(100),
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });

      var beforeAdd = helper.beforeAdd(Model, null, 'user');

      Model.writableCols = ['name', 'age', 'email'];
      Model.unique = ['name', 'email'];

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

      Model.findOne = function(option) {
        assert.deepEqual({
          name: 'Redstone Zhao',
          email: '13740080@qq.com'
        }, option.where);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve();
          }, 10);
        });
      };

      beforeAdd(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          email: '13740080@qq.com',
          age: 36,
          creatorId: 99999,
          clientIp: '192.168.199.199'
        }, req.hooks.user);

        done();
      });

    });

    it("set unique isDelete exists, isDelete=no", function(done) {

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          email: '13740080@qq.com',
          age: 36
        },
        user: {
          id: 99999,
          name: '赵雄飞'
        },
        headers: {
          'x-forwarded-for': '192.168.199.199'
        }
      };

      var res = {
      };

      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING(100),
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });

      var beforeAdd = helper.beforeAdd(Model, null, 'user');

      Model.writableCols = ['name', 'age', 'email'];
      Model.unique = ['name', 'email'];

      Model.build = function(attrs) {
        return _.extend({}, attrs, {
        });
      };

      Model.findOne = function(option) {
        assert.deepEqual({
          name: 'Redstone Zhao',
          email: '13740080@qq.com'
        }, option.where);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({
              id: 1,
              name: 'Redstone Zhao',
              email: '13740080@qq.com',
              age: 35,
              creatorId: 99999,
              clientIp: '192.168.199.199',
              isDelete: 'no',
              save: function() {
                return new Promise(function(resolve, reject) {
                  setTimeout(function() {
                    resolve({
                      id: 1,
                      name: 'Redstone Zhao',
                      email: '13740080@qq.com',
                      age: 36,
                      creatorId: 99999,
                      clientIp: '192.168.199.199',
                      isDelete: 'no'
                    });
                  }, 10);
                });
              }
            });
          }, 10);
        });
      };

      beforeAdd(req, res, function(error) {
        try {
          assert.deepEqual([{
            message: 'Resource exists.',
            path: 'name'
          }], error.message);
          assert.ok(error instanceof Error);
          done();
        } catch (e) {
          done(e);
        }
      });

    });

    it("set unique isDelete exists, isDelete=yes", function(done) {

      var req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Redstone Zhao',
          email: '13740080@qq.com',
          age: 36
        },
        user: {
          id: 99999,
          name: '赵雄飞'
        },
        headers: {
          'x-forwarded-for': '192.168.199.199'
        }
      };

      var res = {
      };

      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING(100),
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });

      var beforeAdd = helper.beforeAdd(Model, null, 'user');

      Model.writableCols = ['name', 'age', 'email'];
      Model.unique = ['name', 'email'];

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

      Model.findOne = function(option) {
        assert.deepEqual({
          name: 'Redstone Zhao',
          email: '13740080@qq.com'
        }, option.where);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({
              id: 1,
              name: 'Redstone Zhao',
              email: '13740080@qq.com',
              age: 36,
              creatorId: 99999,
              clientIp: '192.168.199.199',
              isDelete: 'yes',
              save: function() {
                return new Promise(function(resolve, reject) {
                  setTimeout(function() {
                    resolve({
                      id: 1,
                      name: 'Redstone Zhao',
                      email: '13740080@qq.com',
                      age: 36,
                      creatorId: 99999,
                      clientIp: '192.168.199.199',
                      isDelete: 'no'
                    });
                  }, 10);
                });
              }
            });
          }, 10);
        });
      };

      beforeAdd(req, res, function(error) {
        try {
          assert.equal(null, error);
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            email: '13740080@qq.com',
            age: 36,
            creatorId: 99999,
            isDelete: 'no',
            clientIp: '192.168.199.199'
          }, req.hooks.user);
          done();
        } catch (e) {
          done(e);
        }

      });

    });

  });

});
