const assert = require('assert');
const rest = require('open-rest');
require('open-rest-with-mysql')(rest);

const helper = require('../')(rest);

describe('open-rest-helper-rest', () => {
  describe('validate argument', () => {
    it('hook is null', (done) => {
      assert.throws(() => {
        helper.detail();
      }, (err) => {
        const msg = 'Geted instance will hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('hook type error', (done) => {
      assert.throws(() => {
        helper.detail({ hi: 'world' });
      }, (err) => {
        const msg = 'Geted instance will hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs type error', (done) => {
      assert.throws(() => {
        helper.detail('user', 'string');
      }, (err) => {
        const msg = 'Attach other data dict. key => value, value is req\'s path';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs check error', (done) => {
      assert.throws(() => {
        helper.detail('user', { string: [] });
      }, (err) => {
        const msg = 'The attachs structure is key = > value, value must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('statusCode type error, String', (done) => {
      assert.throws(() => {
        helper.detail('user', null, 'hello');
      }, (err) => err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200');

      done();
    });

    it('statusCode type error, Array', (done) => {
      assert.throws(() => {
        helper.detail('user', null, ['hello']);
      }, (err) => err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200');

      done();
    });
  });

  describe('argument all right', () => {
    it('only hook', (done) => {
      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
          },
        },
        params: {
        },
      };

      const res = {
        send(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual({ id: 1, name: 'Redstone' }, json);
        },
      };

      helper.detail('user')(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('attachs statusCode = 201, allowAttrs = true', (done) => {
      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name,address',
        },
      };

      const res = {
        send(statusCode, json) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone',
            address: '北京市昌平区',
          }, json);
        },
      };

      const detail = helper.detail('user', { address: 'hooks.address' }, 201, true);
      detail(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('data is array', (done) => {
      const req = {
        hooks: {
          users: [{
            id: 1,
            name: 'Redstone',
            age: 36,
          }],
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name',
        },
      };

      const res = {
        send(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual([{
            id: 1,
            name: 'Redstone',
          }], json);
        },
      };

      const detail = helper.detail('users', null, null, true);
      detail(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('data exists JSON method', (done) => {
      const req = {
        hooks: {
          user: {
            toJSON() {
              return {
                id: 1,
                name: 'Redstone',
                age: 36,
              };
            },
          },
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name',
        },
      };

      const res = {
        send(statusCode, json) {
          assert.equal(200, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Redstone',
          }, json);
        },
      };

      const detail = helper.detail('user', null, null, true);
      detail(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });
  });
});

