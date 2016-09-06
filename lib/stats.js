var _       = require('lodash')
  , dc      = decodeURIComponent
  , U       = require('./utils');

var defaultPagination = {
  maxResults: 10,
  maxStartIndex: 10000,
  maxResultsLimit: 5000
};

module.exports = function(rest) {

  // 获取统计的条目数
  var statsCount = function(Model, opts, dims, callback) {
    var option, distincts;
    if (!dims) return callback(null, 1);
    if (!dims.length) return callback(null, 1);
    option = {
      raw: true
    };
    if (opts.where) option.where = opts.where;
    if (opts.include) option.include = opts.include;
    distincts = _.map(dims, function(x) { return x.split(' AS ')[0]; });
    option.attributes = [
      'COUNT(DISTINCT ' + distincts.join(', ') + ') AS `count`'
    ];
    Model.findOne(option).then(function(res) {
      callback(null, res && res.count);
    }).catch(callback);
  };

  var dimensions = function(Model, params, _dims) {
    var dimensions = params.dimensions
      , dims = [];
    // 如果 dimensions 未定义则直接退出
    if (!dimensions) return;

    // 定义了但不是字符串，则返回错误
    if (!_.isString(dimensions)) throw Error('Dimensions must be a string');

    // 循环遍历维度设置
    _.each(dimensions.split(','), function(dim) {
      // Model 静态的配置
      var key = Model.stats.dimensions[dim];
      // 处理动态维度配置
      if (!key && _dims && _dims[dim]) key = _dims[dim];
      // 如果不在允许的范围内，则直接报错
      if (!key) throw Error('Dimensions dont allowed');
      dims.push(key + ' AS `' + dim + '`');
    });

    return dims;
  };

  var group = function(dims) {
    if (!dims) return;
    if (!_.isArray(dims)) return;
    if (!dims.length) return;
    return _.map(dims, function(x) { return x.split(' AS ')[1]; });
  };

  var metrics = function(Model, params, _mets) {
    var metrics = params.metrics
      , mets = [];

    // 如果没有设置了指标
    if (!metrics) throw Error('Metrics must be required');

    // 如果设置了，但是不为字符串，直接返回错误
    if (!_.isString(metrics)) throw Error('Metrics must be a string');

    // 循环遍历所有的指标
    _.each(metrics.split(','), function(met) {
      // 处理静态的配置
      var key = Model.stats.metrics[met];
      // 处理动态指标配置
      if (!key && _mets && _mets[met]) key = _mets[met];
      // 如果指标不在允许的范围内，则直接报错
      if (!key) throw Error('Metrics dont allowed');
      mets.push(key + ' AS `' + met + '`');
    });

    return mets;
  };

  var filters = function(Model, filters, _dims) {
    var $and = [];

    // 如果没有设置了过滤条件
    if (!filters) return $and;

    // 如果设置但是不为字符串，直接返回错误
    if (!_.isString(filters)) throw Error('Filters must be a string');

    _.each(filters.split(';'), function(_and) {
      var $or = [];
      _.each(_and.split(','), function(_or) {
        var tmp = _or.split('==')
          , k = tmp[0]
          , v = tmp[1]
          , col = Model.rawAttributes[k]
          , key;
        key = col ? '`' + k + '`' : Model.stats.dimensions[k];
        // 处理动态维度配置
        if (!key && _dims && _dims[k]) key = _dims[k];
        // key 不存在则抛出异常
        if (!key) throw Error('Filters set error: ' + k)
        $or.push([key + '=?', [dc(v)]]);
      });
      $and.push({$or: $or});
    });

    return $and;
  };

  var sort = function(Model, params) {
    var sort  = params.sort
      , direction = 'ASC'
      , allowSort = [];

    if (!sort) return;

    if (sort[0] === '-') {
      direction = 'DESC';
      order = sort.substring(1);
    } else {
      order = sort;
    }

    _.each(['dimensions', 'metrics'], function(k) {
      if (params[k] && _.isString(params[k])) {
        allowSort = allowSort.concat(params[k].split(','));
      }
    });

    if (!_.includes(allowSort, order)) return;

    return order + ' ' + direction;
  };

  var pageParams = function(Model, params) {
    var pagination = Model.stats.pagination || defaultPagination;
    return U.pageParams(pagination, params);
  };

  var statistics = function(Model, params, where, conf, callback) {
    try {
      var dims = dimensions(Model, params, conf && conf.dimensions);
      var mets = metrics(Model, params, conf && conf.metrics);
      var limit = pageParams(Model, params);
      var listOpts = U.findAllOpts(Model, params);
      var filtersCond = filters(Model, params.filters, conf && conf.dimensions);
      var ands = [];

      if (filtersCond.length) ands.push(filtersCond);

      if (listOpts.where) ands.push(listOpts.where);
      if (where) {
        if (_.isString(where)) {
          ands.push([where, ['']]);
        } else {
          ands.push(where);
        }
      }
      var option = {
        attributes: [].concat(dims || [], mets),
        group: group(dims),
        order: sort(Model, params),
        offset: limit.offset,
        limit: limit.limit,
        raw: true
      };
      if (ands.length) {
        option.where = rest.Sequelize.and.apply(rest.Sequelize, ands);
      }

      if (listOpts.include) {
        option.include = _.map(listOpts.include, function(x) {
          x.attributes = [];
          return x;
        });
      }
    } catch (e) {
      rest.utils.logger.error(e, e.stack);
      return callback(e);
    }

    option = _.omitBy(option, _.isUndefined);
    statsCount(Model, option, dims, function(error, count) {
      if (error) return callback(error);
      Model.findAll(option).then(function(results) {
        callback(null, [results, count]);
      }).catch(callback)
    });
  };

  return {
    statsCount: statsCount,
    statistics: statistics,
    dimensions: dimensions,
    metrics: metrics,
    group: group,
    filters: filters,
    sort: sort,
    pageParams: pageParams
  };
};
