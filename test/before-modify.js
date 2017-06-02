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
  age: Sequelize.INTEGER.UNSIGNED,
});

describe('open-rest-helper-rest-beforeModify', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.beforeModify();
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.beforeModify({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, {});
      }, (err) => {
        const msg = 'Will modify instance hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', 'string');
      }, (err) => err instanceof Error && err.message === "Allow modify attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', [null]);
      }, (err) => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', ['id', 'price']);
      }, (err) => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal cols set', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user', ['name']);

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
        },
      };

      const res = {
      };

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });

    it('cols unset, editableCols exists', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36,
        },
      };

      const res = {
      };

      Model.editableCols = ['name', 'age'];

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });

    it('cols unset, editableCols non-exists, writableCols exists', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Redstone Zhao',
          age: 36,
        },
      };

      const res = {
      };

      Model.editableCols = null;
      Model.writableCols = ['name', 'age'];

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Redstone Zhao',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });
  });
});
