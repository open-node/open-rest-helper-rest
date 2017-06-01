const _ = require('lodash');
const U = require('./utils');

const dc = decodeURIComponent;
const defaultPagination = {
  maxResults: 10,
  maxStartIndex: 10000,
  maxResultsLimit: 5000,
};

// 获取统计的条目数
const statsCount = (Model, opts, dims, callback) => {
  if (!dims) return callback(null, 1);
  if (!dims.length) return callback(null, 1);
  const option = { raw: true };
  if (opts.where) option.where = opts.where;
  if (opts.include) option.include = opts.include;
  const distincts = _.map(dims, (x) => x.split(' AS ')[0]);
  option.attributes = [`COUNT(DISTINCT ${distincts.join(', ')}) AS \`count\``];
  return Model.findOne(option).then((res) => {
    callback(null, res && res.count);
  }).catch(callback);
};

const getDimensions = (Model, params, _dims) => {
  const dimensions = params.dimensions;
  const dims = [];

  // 如果 dimensions 未定义则直接退出
  if (!dimensions) return undefined;

  // 定义了但不是字符串，则返回错误
  if (!_.isString(dimensions)) throw Error('Dimensions must be a string');

  // 循环遍历维度设置
  _.each(dimensions.split(','), (dim) => {
    // Model 静态的配置
    const key = Model.stats.dimensions[dim] || (_dims && _dims[dim]);
    // 如果不在允许的范围内，则直接报错
    if (!key) throw Error('Dimensions dont allowed');
    dims.push(`${key} AS \`${dim}\``);
  });

  return dims;
};

const group = (dims) => {
  if (!dims) return undefined;
  if (!_.isArray(dims)) return undefined;
  if (!dims.length) return undefined;
  return _.map(dims, (x) => x.split(' AS ')[1]);
};

const getMetrics = (Model, params, _mets) => {
  const metrics = params.metrics;
  const mets = [];

  // 如果没有设置了指标
  if (!metrics) throw Error('Metrics must be required');

  // 如果设置了，但是不为字符串，直接返回错误
  if (!_.isString(metrics)) throw Error('Metrics must be a string');

  // 循环遍历所有的指标
  _.each(metrics.split(','), (met) => {
    // 处理静态的配置
    const key = Model.stats.metrics[met] || (_mets && _mets[met]);
    // 如果指标不在允许的范围内，则直接报错
    if (!key) throw Error('Metrics dont allowed');
    mets.push(`${key} AS \`${met}\``);
  });

  return mets;
};

const getFilters = (Model, filters, _dims, onlyCols) => {
  const $and = [];
  const cols = [];

  // 如果没有设置了过滤条件
  if (!filters) return $and;

  // 如果设置但是不为字符串，直接返回错误
  if (!_.isString(filters)) throw Error('Filters must be a string');

  _.each(filters.split(';'), (_and) => {
    const $or = [];
    _.each(_and.split(','), (_or) => {
      const tmp = _or.split('==');
      const [k, v] = tmp;
      const col = Model.rawAttributes[k];
      let key = col ? `\`${k}\`` : Model.stats.dimensions[k];
      // 处理动态维度配置
      if (!key && _dims && _dims[k]) key = _dims[k];
      // key 不存在则抛出异常
      if (!key) throw Error(`Filters set error: ${k}`);
      if (onlyCols) {
        cols.push(k);
      } else {
        $or.push([`${key}=?`, [dc(v)]]);
      }
    });
    $and.push({ $or });
  });

  return onlyCols ? cols : $and;
};

const getSort = (Model, params) => {
  const sort = params.sort;
  let allowSort = [];

  if (!sort) return undefined;

  const isDesc = sort[0] === '-';

  const direction = isDesc ? 'DESC' : 'ASC';
  const order = isDesc ? sort.substring(1) : sort;

  _.each(['dimensions', 'metrics'], (k) => {
    if (params[k] && _.isString(params[k])) {
      allowSort = allowSort.concat(params[k].split(','));
    }
  });

  if (!_.includes(allowSort, order)) return undefined;

  return `${order} ${direction}`;
};

const pageParams = (Model, params) => {
  const pagination = Model.stats.pagination || defaultPagination;
  return U.pageParams(pagination, params);
};


module.exports = (rest) => {
  const statistics = (Model, params, where, conf, callback) => {
    const option = {};
    let dims;
    try {
      dims = getDimensions(Model, params, conf && conf.dimensions);
      const mets = getMetrics(Model, params, conf && conf.metrics);
      const limit = pageParams(Model, params);
      const listOpts = U.findAllOpts(Model, params);
      const filtersCond = getFilters(Model, params.filters, conf && conf.dimensions);
      const ands = [];

      if (filtersCond.length) ands.push(filtersCond);

      if (listOpts.where) ands.push(listOpts.where);
      if (where) {
        if (_.isString(where)) {
          ands.push([where, ['']]);
        } else {
          ands.push(where);
        }
      }
      Object.assign(option, {
        attributes: [].concat(dims || [], mets),
        group: group(dims),
        order: getSort(Model, params),
        offset: limit.offset,
        limit: limit.limit,
        raw: true,
      });
      if (ands.length) {
        option.where = rest.Sequelize.and(...ands);
      }

      if (listOpts.include) {
        option.include = _.map(listOpts.include, (x) => {
          x.attributes = [];
          return x;
        });
      }
    } catch (e) {
      rest.utils.logger.error(e, e.stack);
      return callback(e);
    }

    const opt = _.omitBy(option, _.isUndefined);
    return statsCount(Model, opt, dims, (error, count) => {
      if (error) return callback(error);
      return Model.findAll(opt).then((results) => {
        callback(null, [results, count]);
      }).catch(callback);
    });
  };

  return {
    group,
    statsCount,
    statistics,
    pageParams,
    dimensions: getDimensions,
    metrics: getMetrics,
    filters: getFilters,
    sort: getSort,
  };
};
