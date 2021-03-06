const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors')
app.use(bodyParser.urlencoded());
const knex = require('knex');
const { response } = require('express');


const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'root',
      database : 'smartbrain'
    }
  });

// console.log(db.select('*').from('users').then(data => {
//     console.log(data);
// }));

app.use(bodyParser.json());
var hash = bcrypt.hashSync("bacon");
app.use(cors())
const database = {
    users: [
        {
            id:'123', 
            name:'John',
            email:'john@gmail.com',
            password:'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id:'124', 
            name:'Sally',
            email:'sally@gmail.com',
            password:'bananas',
            entries: 0,
            joined: new Date()
        }
    ]
}


app.get('/', (req,res) => {
    res.send(database.users);
} )

app.get('/profile/:id',(req,res) => {
    const {id} = req.params;
    let userFound = false;
    db.select('*').from('users').where('id',id).then(user => 
        {
            if(user.length){
                res.send(user[0]);
            }
            else{
                res.status(400).json('not found')
            }
       
        }).catch(err => res.status(400).json('error getting user'))
 
})

app.post('/signIn', (req,res) => {
 db.select('email','hash').from('login')
 .where('email','=',req.body.email)
 .then(data => {
     const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
     if(isValid){
        return db.select('*').from('users')
        .where('email','=',req.body.email)
        .then(user => {
            res.json(user[0])
        }) 
        .catch(err => res.status(400).json('unable to get'))
     }else{
        res.status(400).json('wrong credentials');
     }
   
    })
    .catch(err => res.status(400).json('credentials fail'))
})


app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
        trx.insert({
          hash: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0],
              name: name,
              joined: new Date()
            })
            .then(user => {
              res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
  })
app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users')
    .where('id', '=', id)
    .increment('entries', 1 )
    .returning('entries')
    .then(entries => res.json(entries[0]))
    .catch(err => res.status(400).json('Unable to get entries'))
  })
  


app.listen(3000, () => {
    console.log('LISTENING ON PORT 3000');
})