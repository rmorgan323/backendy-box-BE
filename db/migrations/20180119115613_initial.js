exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('messages', function(table) {
      table.increments('id').primary();
      table.string('title');
      table.string('body');
      table.string('author');
      table.integer('authorId');
      table.integer('quality');
      table.timestamps(true, true);
    }),

    // knex.schema.createTable('users', function(table) {
    //   table.increments('id').primary();
    //   table.string('authrocketId');
    //   table.string('username');
    //   table.string('email');
    //   table.timestamps(true, true);
    // })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('messages'),
    // knex.schema.dropTable('users')
  ])
};