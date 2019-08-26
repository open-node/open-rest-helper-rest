const assert = require('assert');
const rest = require('open-rest');
const om = require('open-rest-with-mysql');

om(rest);
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
});

/* eslint-disable new-cap */
describe('open-rest-helper-rest-list', () => {
  describe('list', () => {
    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.list({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('opt argument type error', (done) => {
      assert.throws(() => {
        helper.list(Model, {});
      }, (err) => {
        const msg = "FindAll option hooks's name, so `opt` must be a string";
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('allowAttrs type error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, 'string');
      }, (err) => err instanceof Error && err.message === "Allow return attrs's name array");
      done();
    });

    it('allowAttrs item type error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, [null]);
      }, (err) => {
        const msg = 'Every item in allowAttrs must be a string.';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('allowAttrs item non-exists error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, ['price']);
      }, (err) => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });

    it('fixOptFn is function', (done) => {
      const ls = [{
        id: 1,
        name: 'Redstone',
        score: 30
      }, {
        id: 2,
        name: 'StonePHP',
        score: 60
      }];
      
      const fixOptFn = (options, params) => {
        const { condition } = params;
        options.attributes = {};
        options.attributes.include = [[Model.sequelize.literal(`(${condition} * 30)`), `score`]];
      };
      
      const list = helper
                    .list
                    .Model(Model)
                    .fixOptFn(fixOptFn)
                    .exec();
      const req = {
        params: {
          condition: 'name',
        },
      };
      const res = {
        send(lss) {
          assert.deepEqual([{
            id: 1,
            name: 'Redstone',
            score: 30,
          }, {
            id: 2,
            name: 'StonePHP',
            score: 60,
          }], lss);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(2, value);
        },
      };

      Model.findAll = (options) => (
        new Promise((resolve) => {
          assert.deepEqual(
            { include: [[{ val: "(name * 30)" }, "score"]] }, options.attributes);
          setTimeout(() => {
            resolve(ls);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('fixOptFn type error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, null, null, 'abc');
      }, (err) => err instanceof Error && err.message === "FixOptFn must be a function");
      done();
    });

    it('All arguments validate pass', (done) => {
      const list = helper.list(Model);
      const req = {
        params: {
          id: 1,
        },
      };
      const res = {
        send(ls) {
          assert.deepEqual([], ls);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(2, value);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('opt set', (done) => {
      const ls = [{
        id: 1,
        name: 'Redstone',
        email: '13740080@qq.com',
      }, {
        id: 2,
        name: 'StonePHP',
        email: '269718799@qq.com',
      }];
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .hook('book')
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
          _ignoreTotal: 'yes',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
        send(lss) {
          assert.deepEqual([{
            id: 1,
            name: 'Redstone',
          }, {
            id: 2,
            name: 'StonePHP',
          }], lss);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(0, value);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(ls);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('count is 0', (done) => {
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .hook('book')
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
        send(ls) {
          assert.deepEqual([], ls);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(0, value);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(0);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('count is 0, hook unset', (done) => {
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
        send(ls) {
          assert.deepEqual([], ls);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(0, value);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(0);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('count is 2, hook unset', (done) => {
      const ls = [{
        id: 1,
        name: 'Redstone',
        email: '13740080@qq.com',
      }, {
        id: 2,
        name: 'StonePHP',
        email: '269718799@qq.com',
      }];
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
        send(lss) {
          assert.deepEqual([{
            id: 1,
          }, {
            id: 2,
          }], lss);
        },
        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(2, value);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(ls);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('count error', (done) => {
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Hello world'));
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);
        done();
      });
    });

    it('findAll error', (done) => {
      const list = helper
                    .list
                    .Model(Model)
                    .opt('opt')
                    .allowAttrs(['id', 'name'])
                    .exec();
      const req = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
      };
      const res = {
      };
      Model.findAll = () => (
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Hi world'));
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hi world', error.message);
        done();
      });
    });
  });
});
/* eslint-enable new-cap */
