var assert      = require('assert')
  , utils       = require('../lib/utils');

describe('utils', function() {
  describe('#searchOpt', function() {
    var Model = {
      name: 'user',
      searchCols: {
        name: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        id: {
          op: '=',
          match: ['{1}']
        }
      }
    };

    it("normal", function(done) {
      var except = [
        ["((`user`.`name` LIKE '%a%'))"],
        ["((`user`.`email` LIKE '%a%'))"],
        ["((`user`.`id` = 'a'))"]
      ];
      var real = utils.searchOpt(Model, '', 'a');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil keyword", function(done) {
      var except = [
        [
          '((`user`.`name` LIKE \'%a%\'))',
          '((`user`.`name` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];
      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil match, single keyword", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['{1}', '%,{1}', '{1},%', '%,{1},%']
          },
          email: {
            op: 'LIKE',
            match: ['%{1}%']
          },
          id: {
            op: '=',
            match: ['{1}']
          }
        }
      };
      var except = [
        [
          '((`user`.`name` LIKE \'a\') OR (`user`.`name` LIKE \'%,a\') OR (`user`.`name` LIKE \'a,%\') OR (`user`.`name` LIKE \'%,a,%\'))',
          '((`user`.`name` LIKE \'b\') OR (`user`.`name` LIKE \'%,b\') OR (`user`.`name` LIKE \'b,%\') OR (`user`.`name` LIKE \'%,b,%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];

      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("container single quote", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = [
        ["((`user`.`name` LIKE '%a\\\'%'))"]
      ];
      var real = utils.searchOpt(Model, '', "a'");
      assert.deepEqual(except, real);
      done();
    });
  });

  describe('#mergeSearchOrs', function() {
    it('single searchOpt result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a")]);
      assert.deepEqual(except, real);
      done();
    });

    it('single searchOpt, mutil keyword result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a b")]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, single keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a"),
        utils.searchOpt(Model2, '', "a")
      ]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, mutil keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%')) OR ((`book`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a b"),
        utils.searchOpt(Model2, '', "a b")
      ]);
      assert.deepEqual(except, real);
      done();
    });
  });

});
