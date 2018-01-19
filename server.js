const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 3000);
app.locals.title = 'BackendyBox';

app.locals.messages = [
  {id: 1, message: 'hello world'},
  {id: 2, message: 'goodbye cruel world'}
]

///*///  GET ALL MESSAGES  ///*///
app.get('/api/v1/messages', (request, response) => {
  database('messages').select()
    .then((messages) => {
      return response.status(200).json(messages);
    })
    .catch((error) => {
      return response.status(500).json({ error })
    });
});

///*///  GET MESSAGE BY MESSAGE ID ///*///
app.get('/api/v1/messages/:id', (request, response) => {
  const { id } = request.params;

  database('messages').where('id', id).select()
    .then(message => {
      if (message.length) {
        return response.status(200).json(message);
      } else {

        return response.status(404).json({
          error: `Can't find message with id ${id}`
        });
      }
    })
    .catch(error => {
      return response.status(500).json({ error })
    });
});

///*///  GET MESSAGES BY USER ID  ///*///
app.get('/api/v1/messages/user/:authorId', (request, response) => {
  const { authorId } = request.params;

  database('messages').where('authorId', authorId).select()
    .then(messages => {
      if (messages.length) {
        return response.status(200).json(messages);
      } else {
        return response.status(404).json({
          error: 'No messages authored by this user'
        });
      }
    })
    .catch(error => {
      return response.status(500).json({ error })
    });
});

///*///  POST NEW MESSAGE  ///*///
app.post('/api/v1/messages', async (request, response) => {
  const messageData = request.body;

  if (messageData.title.length) {
    await database('messages').insert(messageData)
    return response.status(201).json(messageData)
  } else {
    return response.status(422).send({
      error: 'Message missing title'
    });
  };
});

///*///  EDIT MESSAGE  ///*///
app.put('/api/v1/messages', async (request, response) => {
  const { id } = request.body;
  const update = request.body;

  if (id) {
    await database('messages').where('id', id).update(update)
    return response.status(201).send({ success: 'message updated' })
  } else {
    return response.status(422).send({
      error: 'Message ID required'
    });
  };
});


//////  DELETE MESSAGE  //////
app.delete('/api/v1/messages/:id', (request, response) => {
  const { id } = request.params;
  const messageToDelete = app.locals.messages.find(message => message.id === parseInt(id));

  if (messageToDelete) {
    const updatedMessagesArray = app.locals.messages.filter(message => message.id !== parseInt(id));
    app.locals.messages = updatedMessagesArray;
    return response.status(200).send({
      deleted: `Message id ${id}`
    });
  } else {
    return response.status(422).send({
      error: `Message id ${id} does not exist`
    });
  };
});

//////  LISTEN  //////
app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});
