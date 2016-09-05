var assert = require('assert')
  , rest = require('open-rest')
  , stats = require('../lib/stats')(rest);

describe('stats', function() {
  describe('metrics', function() {
    it("动态的指标配置", function(done) {
      var Model, expected, params, _mets;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          },
          metrics: {}
        }
      };
      params = {metrics: 'count,total'};
      _mets = {
        count: 'COUNT(*)',
        total: 'SUM(`price`)'
      };

      expected = [
        "COUNT(*) AS `count`",
        "SUM(`price`) AS `total`"
      ];

      assert.deepEqual(expected, stats.metrics(Model, params, _mets));
      return done();
    });
    it("isnt string", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {metrics: []};
      assert.throws(function() {
        return stats.metrics(Model, params);
      }, Error);
      return done();
    });
    it("no", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {};
      expected = void 0;
      assert.throws(function() {
        return stats.metrics(Model, params);
      }, Error);
      return done();
    });
    it("single", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)'
          }
        }
      };
      params = {
        metrics: 'total'
      };
      expected = ["SUM(`num`) AS `total`"];
      assert.deepEqual(stats.metrics(Model, params), expected);
      return done();
    });
    it("multi", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)'
          }
        }
      };
      params = {
        metrics: 'count,total'
      };
      expected = ["count(*) AS `count`", "SUM(`num`) AS `total`"];
      assert.deepEqual(stats.metrics(Model, params), expected);
      return done();
    });
    return it("non-allowd", function(done) {
      var Model, params;
      Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)'
          }
        }
      };
      params = {
        metrics: 'avg'
      };
      assert.throws(function() {
        return stats.metrics(Model, params);
      }, Error);
      return done();
    });
  });

  describe('group', function() {
    it("dims unset", function(done) {
      assert.equal(undefined, stats.group());
      assert.equal(undefined, stats.group(0));
      assert.equal(undefined, stats.group(''));
      assert.equal(undefined, stats.group(undefined));
      assert.equal(undefined, stats.group(null));

      done();
    });

    it("dims isnt an array", function(done) {
      assert.equal(undefined, stats.group({}));
      assert.equal(undefined, stats.group(function() {}));
      assert.equal(undefined, stats.group(200));
      assert.equal(undefined, stats.group('hello'));

      done();
    });

    it("dims is an empty array", function(done) {
      assert.equal(undefined, stats.group([]));

      done();
    });

    it("dims is an array", function(done) {
      var dims = [
        "`creatorId` AS `user`",
        "`createdAt` AS `date`"
      ]
      assert.deepEqual(['`user`', '`date`'], stats.group(dims));

      done();
    });
  });

  describe('dimension', function() {
    it("动态维度处理", function(done) {
      var Model, expected, params, _dims;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      _dims = {
        user: '`creatorId`'
      };
      params = {dimensions: 'user'};
      expected = ["`creatorId` AS `user`"];
      assert.deepEqual(stats.dimensions(Model, params, _dims), expected);
      done();
    });
    it("isnt string", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {dimensions: []};
      assert.throws(function() {
        stats.dimensions(Model, params);
      }, function(err) {
        return err instanceof Error && err.message === 'Dimensions must be a string';
      });
      done();
    });
    it("no", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {};
      expected = void 0;
      assert.equal(stats.dimensions(Model, params), expected);
      return done();
    });
    it("single", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {
        dimensions: 'date'
      };
      expected = ["`date2` AS `date`"];
      assert.deepEqual(stats.dimensions(Model, params), expected);
      return done();
    });
    it("multi", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      params = {
        dimensions: 'date,network'
      };
      expected = ["`date2` AS `date`", "3 + 2 AS `network`"];
      assert.deepEqual(stats.dimensions(Model, params), expected);
      return done();
    });
    return it("non-allowd", function(done) {
      var Model, params;
      Model = {
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      params = {
        dimensions: 'date,network,name'
      };
      assert.throws(function() {
        return stats.dimensions(Model, params);
      }, Error);
      return done();
    });
  });
  describe('filters', function() {
    it("动态维度", function(done) {
      var Model, expected, params, _dims;
      Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {filters: 'user==2'};
      _dims = {
        user: '`creatorId`'
      };
      expected = [
        {
          $or: [["`creatorId`=?", ['2']]]
        }
      ];
      assert.deepEqual(expected, stats.filters(Model, params.filters, _dims));
      return done();
    });
    it("isnt a string", function(done) {
      var Model, expected, params;
      Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {filters: []};
      assert.throws(function() {
        stats.filters(Model, params.filters);
      }, function(err) {
        return err instanceof Error && err.message == 'Filters must be a string';
      });
      return done();
    });
    it("no", function(done) {
      var Model, expected, params;
      Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {};
      expected = [];
      assert.deepEqual(stats.filters(Model, params.filters), expected);
      return done();
    });
    it("include isDelete column", function(done) {
      var Model, expected, params;
      Model = {
        rawAttributes: {
          isDelete: {}
        },
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      params = {};
      expected = {};
      assert.deepEqual(stats.filters(Model, params.filters), expected);
      return done();
    });
    it("single", function(done) {
      var Model, expected, filters;
      Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`'
          }
        }
      };
      filters = 'date==2014';
      expected = [
        {
          $or: [["`date2`=?", ['2014']]]
        }
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
      return done();
    });
    it("multi", function(done) {
      var Model, expected, filters;
      Model = {
        rawAttributes: {
          networkId: {}
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      filters = 'date==2014;networkId==11';
      expected = [
        {
          $or: [["`date2`=?", ['2014']]]
        }, {
          $or: [["`networkId`=?", ['11']]]
        }
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
      return done();
    });
    it("non-allowd", function(done) {
      var Model, filters;
      Model = {
        rawAttributes: {
          networkId: {}
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      filters = 'date==2014;networkId==11;name=niubi';
      assert.throws(function() {
        return stats.filters(Model, filters);
      }, Error);
      return done();
    });
    it("need escape", function(done) {
      var Model, expected, filters;
      Model = {
        rawAttributes: {
          networkId: {}
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      filters = "date==2014';networkId==11";
      expected = [
        {
          $or: [["`date2`=?", ["2014'"]]]
        }, {
          $or: [["`networkId`=?", ['11']]]
        }
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
      return done();
    });
    return it("no simple", function(done) {
      var Model, expected, filters;
      Model = {
        rawAttributes: {
          networkId: {}
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2'
          }
        }
      };
      filters = "date==2014,date==2015;networkId==11,networkId==23";
      expected = [
        {
          $or: [["`date2`=?", ["2014"]], ["`date2`=?", ["2015"]]]
        }, {
          $or: [["`networkId`=?", ['11']], ["`networkId`=?", ['23']]]
        }
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
      return done();
    });
  });
  describe('sort', function() {
    it("no set", function(done) {
      var expected, params;
      params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total'
      };
      expected = void 0;
      assert.equal(stats.sort({}, params), expected);
      return done();
    });
    it("desc", function(done) {
      var expected, params;
      params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total',
        sort: '-count'
      };
      expected = "count DESC";
      assert.equal(stats.sort({}, params), expected);
      return done();
    });
    it("asc", function(done) {
      var expected, params;
      params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total',
        sort: 'count'
      };
      expected = "count ASC";
      assert.equal(stats.sort({}, params), expected);
      return done();
    });
    it("params.dimensions isnt a string", function(done) {
      var expected, params;
      params = {
        dimensions: ['date,network,creator'],
        metrics: 'count,avg,total',
        sort: 'count'
      };
      expected = "count ASC";
      assert.equal(stats.sort({}, params), expected);
      return done();
    });
    it("sort dont allowd", function(done) {
      var expected, params;
      params = {
        dimensions: ['date,network,creator'],
        sort: 'count'
      };
      expected = void 0;
      assert.equal(stats.sort({}, params), expected);
      return done();
    });
  });
  return describe('pageParams', function() {
    it("default no set", function(done) {
      var Model, expected, params;
      Model = {
        stats: {}
      };
      params = {};
      expected = {
        offset: 0,
        limit: 10
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    it("noraml page", function(done) {
      var Model, expected, params;
      Model = {
        stats: {}
      };
      params = {
        startIndex: 20,
        maxResults: 15
      };
      expected = {
        offset: 20,
        limit: 15
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    it("set pagination default", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000
          }
        }
      };
      params = {};
      expected = {
        offset: 0,
        limit: 20
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    it("set pagination default page", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000
          }
        }
      };
      params = {
        startIndex: 50
      };
      expected = {
        offset: 50,
        limit: 20
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    it("set pagination limit startIndex", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000
          }
        }
      };
      params = {
        startIndex: 5000000
      };
      expected = {
        offset: 50000,
        limit: 20
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    it("set pagination limit maxResults", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000
          }
        }
      };
      params = {
        startIndex: 5000000,
        maxResults: 10000
      };
      expected = {
        offset: 50000,
        limit: 2000
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
    return it("set pagination lt 0", function(done) {
      var Model, expected, params;
      Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000
          }
        }
      };
      params = {
        startIndex: -1,
        maxResults: -10
      };
      expected = {
        offset: 0,
        limit: 0
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
      return done();
    });
  });
});
