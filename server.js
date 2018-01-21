const express = require('express');
const app = express();
const cors = require('express-cors');
const bodyParser = require('body-parser');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const { KEYUTIL, KJUR, b64utoutf8 } = require('jsrsasign');
const key = require('./pubKey');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const corsOptions = {
  allowedOrigins: ['localhost:3001'],
  preflightContinue: true,
  headers: ['Content-Type', 'x-token']
};

app.use(cors(corsOptions));
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
  console.log(`BackendyBox is running on ${app.get('port')}.`);
});

/////////*********/////////  VALIDATION  /////////********/////////

const validate = (request, response) => {
  try {
    var jwToken = request.headers['x-token'] !== 'null' ? request.headers['x-token'] : '';
    var pubkey = KEYUTIL.getKey(key);
    var isValid = KJUR.jws.JWS.verifyJWT(jwToken, pubkey, {alg: ['RS256']});
    if (isValid) {
      var payloadObj = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(jwToken.split(".")[1]));
      return payloadObj;
    }
  } catch (e) {
    response.status(401).json({error: 'Invalid token.  Please login again.'});
  }
};

///*///  GET/CREATE USER  ///*///

const getCurrentUser =  async ( request, response ) => {
  const userObject = await validate(request, response);
  if (!userObject) {
    return;
  }

  const newUser = {
    email: userObject.un,
    name: userObject.n,
    authrocket_id: userObject.uid
  };

  let foundUser = null;
  await database('users').where('authrocket_id', userObject.uid).select()
    .then( async (user) =>{
      if (!user.length) {
        foundUser = await createUser( response, newUser );
      } else {
        foundUser = user[0];
      }
    })
    .catch(error => {
      response.status(404).json({error});
    });
  return foundUser;
};

const createUser = async ( response, user ) => {
  let foundUser;
  await database('users').insert(user)
    .then(() => {
      foundUser = user;
    })
    .catch( error => {
      response.status(500).json({error});
    });
  return foundUser;
};

app.get('/api/v1/users', async (request, response) => { 
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }
  database('users').where('authrocket_id', currentUser.authrocket_id).select()
    .then((user) => {
      response.status(200).json(user);
    });
});

///*///  GET ALL MESSAGES  ///*///
app.get('/api/v1/messages', async (request, response) => {
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }

  database('messages').select()
    .then((messages) => {
      return response.status(200).json(messages);
    })
    .catch((error) => {
      return response.status(500).json({ error })
    });
});

///*///  GET MESSAGE BY MESSAGE ID ///*///
app.get('/api/v1/messages/:id', async (request, response) => {
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }

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
app.get('/api/v1/messages/user/:authorId', async (request, response) => {
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }

  const { author_id } = request.params;

  database('messages').where('author_id', author_id).select()
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
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }

  const messageData = request.body;

  if (messageData.title.length) {
    const insertedId = await database('messages').returning('id').insert(messageData)
    const returnData = await database('messages').where('id', insertedId[0]).select()

    return response.status(201).json(returnData[0])
  } else {
    return response.status(422).send({
      error: 'Message missing title'
    });
  };
});

///*///  EDIT MESSAGE  ///*///
app.put('/api/v1/messages', async (request, response) => {
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }

  const { id } = request.body;
  const update = request.body;

  if (id) {
    await database('messages').where('id', id).update(update)
    const returnData = await database('messages').where('id', id).select()
    return response.status(201).json(returnData[0])
  } else {
    return response.status(422).send({
      error: 'Message ID required'
    });
  };
});

///*///  DELETE MESSAGE  ///*///
app.delete('/api/v1/messages/:id', async (request, response) => {
  const currentUser = await getCurrentUser(request, response);
  if (!currentUser) {
    return;
  }
  
  const { id } = request.params;

  if (id) {
    const deletedMessage = await database('messages').where('id', id).select()
    console.log(deletedMessage);
    await database('messages').where('id', id).del()
    return response.status(201).json(deletedMessage[0])
  } else {
    return response.status(422).send({
      error: 'Message ID required'
    });
  };
});

