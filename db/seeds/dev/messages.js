const seedMessages = [
  {
    title: "Figure Me This",
    body: "I'm learning how all this backendy stuff works.",
    author: "Roberto",
    authorId: 1,
    quality: 2
  },
  {
    title: "Now this is bold",
    body: "If this works, I may be a genius.",
    author: "Roberto",
    authorId: 1,
    quality: 2
  }
]

exports.seed = function(knex, Promise) {
  return knex('messages').del()
    .then(() => {
      return Promise.all([
        knex('messages').insert(seedMessages)
        .then(() => console.log('Seeding complete!'))
        .catch(error => console.log(`Error seeding data: ${error}`))
      ])
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};
