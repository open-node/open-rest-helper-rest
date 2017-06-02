const assert = require('assert');
const rest = require('open-rest');
require('open-rest-with-mysql')(rest);
const helper = require('../')(rest);

describe('open-rest-helper-rest-save', () => {
  describe('Argument validate error', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.save({});
      }, (err) => {
        const msg = 'Will modify instance hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal changed', (done) => {
      const save = helper.save('user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: 1,
                    name: 'Redstone Zhao',
                    age: 36,
                  });
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
        },
      };

      const res = {
        send(data) {
          assert.deepEqual({
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
          }, data);
        },
      };

      save(req, res, (error) => {
        assert.equal(null, error);

        done();
      });
    });

    it('normal unchanged', (done) => {
      const save = helper.save('user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed() {
              return false;
            },
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
        },
      };

      const res = {
        send(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        },
      };

      save(req, res, (error) => {
        assert.equal(null, error);

        done();
      });
    });

    it('Has error when save', (done) => {
      const save = helper.save('user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone Zhao',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(Error('Hello world'));
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
        },
      };

      const res = {
        send(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        },
      };

      save(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });
    });
  });
});
