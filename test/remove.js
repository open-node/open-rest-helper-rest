const assert = require('assert');
const rest = require('open-rest');
const om = require('open-rest-with-mysql');

om(rest);
const helper = require('../')(rest);

describe('open-rest-helper-rest-remove', () => {
  describe('Argument check', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.remove.hook([]).exec();
      }, (error) => {
        const msg = 'Remove instance hook on req.hooks[hook], so `hook` must be a string';
        return error instanceof Error && error.message === msg;
      });

      done();
    });
  });

  describe('Argument all right', () => {
    it('isDelete non-exists', (done) => {
      const model = {
        destroy() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const req = {
        hooks: {
          user: model,
        },
      };

      const res = {
        send(statusCode) {
          assert.equal(204, statusCode);
        },
      };

      helper.remove('user')(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });

    it('isDelete exists', (done) => {
      const model = {
        isDelete: 'no',
        save() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const req = {
        hooks: {
          user: model,
        },
        user: {
          id: 5,
        },
      };

      const res = {
        send(statusCode) {
          assert.equal(204, statusCode);
        },
      };

      helper.remove('user')(req, res, (error) => {
        assert.equal(null, error);
        assert.equal('yes', req.hooks.user.isDelete);
        done();
      });
    });

    it('only save isDelete when delete process', (done) => {
      const model = {
        isDelete: 'no',
        save(opts) {
          assert.deepEqual(opts, {
            fields: ['isDelete', 'deletorId', 'deletedAt'],
            validate: false,
          });
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const req = {
        hooks: {
          user: model,
        },
        user: {
          id: 35,
        },
      };

      const res = {
        send(statusCode) {
          assert.equal(204, statusCode);
        },
      };

      helper.remove('user')(req, res, (error) => {
        assert.equal(null, error);
        assert.equal('yes', req.hooks.user.isDelete);
        done();
      });
    });
  });
});
