var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , beforeAdd     = require('./before-add')
  , detailHelper  = require('./detail')
  , async         = require('async')
  , _             = require('lodash');

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  /** 输出 */
  var detail = function(hook, attachs) {
    return function(req, res, next) {
      var results = _.isArray(req.body) ? req.hooks[hook] : [req.hooks[hook]];
      var ret = _.map(results, function(model) {
        var json = (model.toJSON instanceof Function) ? model.toJSON() : model;
        if (attachs) {
          _.each(attachs, function(v, k) {
            json[k] = _.get(req, v);
          });
        }
        return json;
      });
      if (!_.isArray(req.body) && ret.length === 1) ret = ret[0];
      if (_.isArray(ret)) {
        res.send(204);
      } else {
        res.send(201, ret);
      }
      next();
    };
  };

  /** 批量验证 */
  var validate = function(Model, cols, hook) {
    return function(req, res, next) {
      var body = _.isArray(req.body) ? req.body : [req.body];
      var origParams = _.clone(req.params);
      var handler = function(params, callback) {
        var attr;

        req.params = _.extend(params, origParams);
        attr = U.pickParams(req, cols || Model.writableCols, Model)
        if (Model.rawAttributes.creatorId) attr.creatorId = req.user.id;
        if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(req);

        /** 构建实例 */
        model = Model.build(attr);
        model.validate().then(function() {
          callback(null, model);
        }).catch(callback);
      };
      async.map(body, handler, function(error, results) {
        var err = rest.errors.sequelizeIfError(error);
        if (err) return next(err);
        req.hooks[hook] = results;
        next();
      });
    };
  };

  /** 保存 */
  var save = function(hook, Model) {
    return function(req, res, next) {
      var ls = _.map(req.hooks[hook], function(x) {
        return (x.toJSON instanceof Function) ? x.toJSON() : x;
      });
      var p = _.isArray(req.body) ? Model.bulkCreate(ls) : Model.create(ls[0]);
      rest.utils.callback(p, function(error, results) {
        var err = rest.errors.sequelizeIfError(error);
        if (err) return next(err);
        req.hooks[hook] = results;

        /**
         * 如果是多条会返回204 No-content 所以无需关注保存后的model的最新态
         * 而如果是单一的是要返回具体的内容，所以要 model.reload
         */
        if (_.isArray(results)) return next();
        rest.utils.callback(results.reload(), function(error) {
          var err = rest.errors.sequelizeIfError(error);
          if (err) return next(err);
          next();
        });
      });
    };
  };

  /** 批量添加 */
  var batchAdd = function(Model, cols, hook, attachs) {
    var hook = hook || Model.name + 's';
    var _validate = validate(Model, cols, hook);
    var _save = save(hook, Model);
    var _detail = detail(hook, attachs);
    return function(req, res, next) {
      _validate(req, res, function(error) {
        if (error) return next(error);
        _save(req, res, function(error) {
          if (error) return next(error);
          _detail(req, res, next);
        });
      });
    };
  };

  var schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check: function(keys, schema, args) {
        var Model = args[0];
        _.each(keys, function(v) {
          if (!_.isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error('Attr non-exists: ' + v);
          }
        });
        return true;
      }
    },
    message: "Allow writed attrs's name array"
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string'
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check: function(value) {
        _.each(value, function(v) {
          if (!_.isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      }
    },
    message: 'Attach other data dict. key => value, value is req\'s path'
  }];

  return delegate(batchAdd, schemas);
};
