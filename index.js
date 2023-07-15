const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

// Mongo DB - start
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username:{type:String,required:true,unique:true},
  exercises:[{
    date:String,
    duration:Number,
    description:String}]
});

const User = new mongoose.model("User",UserSchema);
// DEBUG
//mongoose.set('debug',true);
// Mondo DB - end

// Middleware - start
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
// Logger
app.use(function(req,res,next) {
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
});
// Middleware - end

// API - start
// GET / - shows index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// GET /api/users - gets all users
app.get('/api/users',(req, res) => {
  User.find({})
    .then((docs) => {
      res.json(docs.map((x) => {return {"username":x.username,"_id":x._id}}));
    })
    .catch((err) => {console.log(err)});
});

// POST /api/users - post new username
app.post('/api/users',(req, res) => {
  const new_user = new User({
    username:req.body.username
  })
  new_user.save()
    .then((doc) => {
      res.json({"username":doc.username,"_id":doc._id})
    })
    .catch((err) => {console.log(err)});
});

// GET /api/users/:user_id/logs?[from][&to][&limit] - get exercise list 
// [ ] = optional; from, to = dates (yyyy-mm-dd); limit = number
app.get('/api/users/:user_id/logs',(req,res) => {
  let from_date = req.query.from;
  let to_date = req.query.to;
  let limit = req.query.limit;
  User.findById({"_id":req.params.user_id})
    .then((doc) => {
      let exercises = doc.exercises;
      let logs = exercises.map((x) => {return {"description":x.description,"duration":x.duration,"date":x.date}});
      if (from_date) {
        let min_date = Date.parse(from_date);
        logs = logs.filter(x => Date.parse(x.date) >= min_date);
      }
      if (to_date) {
        let max_date = Date.parse(to_date);
        logs = logs.filter(x => Date.parse(x.date) <= max_date);
      }
      if (limit) {
        logs = logs.slice(0,limit);
      }
      res.json({
        "username":doc.username,
        "count":exercises.length,
        "_id":doc._id,
        "log":logs        
      });
    })
});

// POST /api/users/:user_id/exercises - post new exercise
app.post('/api/users/:user_id/exercises',(req,res) => {
  if (!req.body.date) {
    req.body.date = new Date();
  }
  else {
    req.body.date = new Date(req.body.date);
  }
  User.findById({"_id":req.params.user_id})
    .then((doc) => {
      doc.exercises.push({
        date:req.body.date.toDateString(),
        duration:req.body.duration,
        description:req.body.description
      });
      const exercise = doc.exercises[doc.exercises.length - 1];
      console.log(exercise);
      doc.save()
        .then((doc) => {
          res.json({
            "username":doc.username,
            "description":exercise.description,
            "duration":exercise.duration,
            "date":exercise.date,
            "_id":doc._id
          })
        })
        .catch((err) => {console.log(err)});
    })
    .catch((err) => {console.log(err)});
});
// API - end

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


// DEBUG ONLY
/*
// GET /api/users/:user_id/delete - deletes user
app.get('/api/users/:user_id/delete',(req,res) => {
  User.deleteOne({"_id":req.params.user_id})
});
// GET /api/users/:user_id/:ex_id/delete - deletes exercise
app.get('/api/users/:user_id/:ex_id/delete',(req,res) => {
  User.findById({"_id":req.params.user_id})
    .then((doc) => {
      doc.exercises.id(req.params.ex_id).deleteOne((err, data) => {
        if (err) console.log(err);
        else {
          doc.save()
            .then((doc) => {res.json(doc)})
            .catch((err) => console.log(err))
        } 
      })
    })
    .catch((err) => {console.log(err)})
});
*/