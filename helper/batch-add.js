const delegate = require('func-delegate');
const U = require('../lib/utils');
const async = require('async');
const _ = require('lodash');

module.exports = (rest) => {
  const { Sequelize } = rest;

  /** 输出 */
  const detail = (hook, attachs) => (
    (req, res, next) => {
      const results = _.isArray(req.body) ? req.hooks[hook] : [req.hooks[hook]];
      let ret = _.map(results, (model) => {
        const json = (model.toJSON instanceof Function) ? model.toJSON() : model;
        if (attachs) {
          _.each(attachs, (v, k) => {
            json[k] = _.get(req, v);
          });
        }
        return json;
      });
      if (!_.isArray(req.body) && ret.length === 1) [ret] = ret;
      if (_.isArray(ret)) {
        res.send(204);
      } else {
        res.send(201, ret);
      }
      next();
    }
  );

  /** 批量验证 */
  const validate = (Model, cols, hook) => (
    (req, res, next) => {
      const body = _.isArray(req.body) ? req.body : [req.body];
      const origParams = _.clone(req.params);
      const handler = (params, callback) => {
        req.params = _.extend(params, origParams);
        const attr = U.pickParams(req, cols || Model.writableCols, Model);
        if (Model.rawAttributes.creatorId) attr.creatorId = req.user.id;
        if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(req);

        /** 构建实例 */
        const model = Model.build(attr);
        model.validate().then(() => {
          callback(null, model);
        }).catch(callback);
      };
      async.map(body, handler, (error, results) => {
        const err = rest.errors.sequelizeIfError(error);
        if (err) return next(err);
        req.hooks[hook] = results;
        return next();
      });
    }
  );

  /** 保存 */
  const save = (hook, Model, opt) => (
    (req, res, next) => {
      const ls = _.map(req.hooks[hook], x => ((x.toJSON instanceof Function) ? x.toJSON() : x));
      const p = _.isArray(req.body) ? Model.bulkCreate(ls, opt) : Model.create(ls[0], opt);
      rest.utils.callback(p, (error, results) => {
        const err1 = rest.errors.sequelizeIfError(error);
        if (err1) return next(err1);
        req.hooks[hook] = results;

        /**
         * 如果是多条会返回204 No-content 所以无需关注保存后的model的最新态
         * 而如果是单一的是要返回具体的内容，所以要 model.reload
         */
        if (_.isArray(results)) return next();
        return rest.utils.callback(results.reload(), (e) => {
          const err2 = rest.errors.sequelizeIfError(e);
          if (err2) return next(err2);
          return next();
        });
      });
    }
  );

  /** 批量添加 */
  const batchAdd = (Model, cols, hook, attachs, createOpt) => {
    const _hook = hook || `${Model.name}s`;
    const _validate = validate(Model, cols, _hook);
    const _save = save(_hook, Model, createOpt);
    const _detail = detail(_hook, attachs);
    return (req, res, next) => {
      _validate(req, res, (error1) => {
        if (error1) return next(error1);
        return _save(req, res, (error2) => {
          if (error2) return next(error2);
          return _detail(req, res, next);
        });
      });
    };
  };

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check(keys, schema, args) {
        const Model = args[0];
        _.each(keys, (v) => {
          if (!_.isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error(`Attr non-exists: ${v}`);
          }
        });
        return true;
      },
    },
    message: 'Allow writed attrs\'s name array',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check(value) {
        _.each(value, (v) => {
          if (!_.isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      },
    },
    message: 'Attach other data dict. key => value, value is req\'s path',
  }, {
    /**
     * [options]  Object
     * [options.raw=false]  Boolean
     * [options.isNewRecord=true] Boolean
     * [options.fields] Array
     * [options.include]  Array
     * [options.onDuplicate]  String
     * [options.transaction]  Transaction
     * [options.logging=false]  Function
     * [options.benchmark=false]  Boolean
     */
    name: 'createOpt',
    type: Object,
    allowNull: true,
    message: 'Sequelize create & bulkCreate the second argument',
  }];

  return delegate(batchAdd, schemas);
};
