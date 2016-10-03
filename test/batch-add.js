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

var validateSuccess = function(model) {
  return function() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(model);
      }, 10);
    });
  };
};

var validateFailure = function(model) {
  return function() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        reject(Error('This is a test error message'));
      }, 10);
    });
  };
};


describe("open-rest-helper-rest-batchAdd", function() {

  describe("Argument validate error", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.batchAdd();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.batchAdd({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("cols type error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, 'string');
      }, function(err) {
        return err instanceof Error && err.message === "Allow writed attrs's name array"
      });
      done();
    });

    it("cols item type error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, [null]);
      }, function(err) {
        return err instanceof Error && err.message === 'Every item in cols must be a string.';
      });
      done();
    });

    it("cols item non-exists error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, ['id', 'price']);
      }, function(err) {
        return err instanceof Error && err.message === 'Attr non-exists: price';
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, null, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Added instance will hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

    it("attrs type error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, null, null, 'string');
      }, function(err) {
        return err instanceof Error && err.message === 'Attach other data dict. key => value, value is req\'s path';
      });

      done();
    });

    it("attrs check error", function(done) {
      assert.throws(function() {
        helper.batchAdd(Model, null, null, {string: []});
      }, function(err) {
        return err instanceof Error && err.message === 'The attachs structure is key = > value, value must be a string';
      });

      done();
    });

  });

  describe("All aguments validate passed", function() {

    it("normal cols set, hook set, body is array", function(done) {

      var add = helper.batchAdd(Model, ['name', 'age'], 'user', {address: 'hooks.address'});

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: [{
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }]
      };

      var res = {
        send: function(statusCode, data) {
          try {
            assert.equal(204, statusCode);
          } catch(e) {
            console.error('sendError', e, data);
            done(e);
          }
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(model);
              }, 10);
            });
          },
          validate: validateSuccess(model)
        });

        return model;
      };

      Model.bulkCreate = function(ls) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve(_.map(ls, function(x, i) {
              x.id = i + 1;
              return x;
            }));
          }, 10);
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

    it("normal cols set, hook set, body isnot array, attachs", function(done) {

      var add = helper.batchAdd(Model, ['name', 'age'], 'user', {address: 'hooks.address'});

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
        send: function(statusCode, data) {
          try {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'Redstone Zhao',
              age: 36,
              address: '北京市昌平区'
            }, _.pick(data, ['id', 'name', 'age', 'address']));
          } catch(e) {
            console.error('sendError', e, data);
            done(e);
          }
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(model);
              }, 10);
            });
          },
          validate: validateSuccess(model)
        });

        return model;
      };


      Model.create = function(x) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            x.id = 1;
            resolve(x);
          }, 10);
        });
      };

      add(req, res, function(error) {
        try {
          assert.equal(null, error);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });

    it("normal cols set, hook set, body isnot array, no attachs", function(done) {

      var add = helper.batchAdd(Model, ['name', 'age'], 'user');

      var req = {
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      var res = {
        send: function(statusCode, data) {
          try {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'Redstone Zhao',
              age: 36
            }, _.pick(data, ['id', 'name', 'age', 'address']));
          } catch(e) {
            console.error('sendError', e, data);
            done(e);
          }
        }
      };

      add(req, res, function(error) {
        try {
          assert.equal(null, error);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });

    it("writableCols, creatorId, clientIp, validate failure", function(done) {

      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      var add = helper.batchAdd(Model);

      var req = {
        user: {
          id: 3
        },
        headers: {
          'x-forwarded-for':  '192.168.199.188'
        },
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(model);
              }, 10);
            });
          },
          validate: validateFailure(model)
        });

        return model;
      };

      var res = {};

      add(req, res, function(error) {
        try {
          assert.ok(error);
          assert.ok(error instanceof Error);
          assert.equal('This is a test error message', error.message);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });

    it("writableCols, creatorId, clientIp, validate success, model.toJSON", function(done) {

      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      var add = helper.batchAdd(Model);

      var req = {
        user: {
          id: 3
        },
        headers: {
          'x-forwarded-for':  '192.168.199.188'
        },
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(model);
              }, 10);
            });
          },
          validate: validateSuccess(model)
        });

        model.toJSON = function() {
          return model;
        };

        return model;
      };

      var res = {
        send: function(statusCode, data) {
          try {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'Redstone Zhao',
              age: 36,
              clientIp: '192.168.199.188',
              creatorId: 3
            }, _.pick(data, ['id', 'name', 'age', 'address', 'clientIp', 'creatorId']));
          } catch(e) {
            console.error('sendError', e, data);
            done(e);
          }
        }
      };

      add(req, res, function(error) {
        try {
          assert.equal(null, error);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });

    it("writableCols, creatorId, clientIp, validate success, reload error", function(done) {

      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      var add = helper.batchAdd(Model);

      var req = {
        user: {
          id: 3
        },
        headers: {
          'x-forwarded-for':  '192.168.199.188'
        },
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                reject(Error('Happen a error when reload'));
              }, 10);
            });
          },
          validate: validateSuccess(model)
        });

        return model;
      };

      var res = {};

      add(req, res, function(error) {
        try {
          assert.ok(error);
          assert.ok(error instanceof Error);
          assert.equal('Happen a error when reload', error.message);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });

    it("writableCols, creatorId, clientIp, validate success, save error", function(done) {

      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      var add = helper.batchAdd(Model);

      var req = {
        user: {
          id: 3
        },
        headers: {
          'x-forwarded-for':  '192.168.199.188'
        },
        hooks: {
          address: '北京市昌平区'
        },
        params: {},
        body: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36
        }
      };

      Model.build = function(attrs) {
        var model = _.extend({}, attrs, {
          reload: function() {
            return new Promise(function(resolve, reject) {
              setTimeout(function() {
                resolve(model);
              }, 10);
            });
          },
          validate: validateSuccess(model)
        });

        return model;
      };

      Model.create = function(x) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(Error('Happen a error when save'));
          }, 10);
        });
      };

      var res = {};

      add(req, res, function(error) {
        try {
          assert.ok(error);
          assert.ok(error instanceof Error);
          assert.equal('Happen a error when save', error.message);
        } catch (e) {
          console.error('nextError', e, error);
        }
        done();
      });

    });
  });

});
