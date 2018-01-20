const seedUsers = [
  {
    authrocket_id: "jfsd7je92f",
    name: "JimBob McGillicutty",
    email: "jbm@samplemail.com"
  },
  {
    authrocket_id: "m38fh0as6d",
    name: "Reba Waterfaucet",
    email: "rebaw@samplemail.com"
  }
]

exports.seed = function(knex, Promise) {
  return knex('users').del()
    .then(() => {
      return Promise.all([
        knex('users').insert(seedUsers)
        .then(() => console.log('Seeding users complete!'))
        .catch(error => console.log(`Error seeding data: ${error}`))
      ])
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};