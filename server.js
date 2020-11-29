const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Schema } = mongoose;

const app = express();
const cors = require('cors');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('we are conncected to the db!');
});

/////////////////// Schemas
///////////////////////////
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
});

const exerciseSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
  },
});

/////////////////// Models
///////////////////////////
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

////////////////// Functions
///////////////////////////
const formatDate = (input) => {
  const date = new Date(input);
  return date.toDateString();
};

/////////////////// Views
///////////////////////////
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

////////////////// Handlers
///////////////////////////
app.post('/api/exercise/new-user', async function (req, res) {
  try {
    const username = req.body.username;
    await User.create({ username });
    await User.findOne({ username }, function (err, user) {
      res.json({
        username,
        _id: user._id,
      });
    });
  } catch (error) {
    console.error(error);
  }
});

app.post('/api/exercise/add', async function (req, res) {
  console.log(req.body);
  try {
    let { userId, description, duration, date } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.send('User not found!');
    if (!date) {
      date = formatDate(Date.now());
    } else {
      date = formatDate(date);
    }
    const newExercise = await Exercise.create({
      username: user.username,
      date,
      duration,
      description,
    });
    res.json({
      _id: userId,
      username: user.username,
      date,
      duration: newExercise.duration,
      description: newExercise.description,
    });
  } catch (error) {
    console.error(error);
  }
});

app.get('/api/exercise/users/', async function (req, res) {
  const users = await User.find().select('-__v');
  if (!users) res.send('No users found.');
  res.json(users);
});

app.get('/api/exercise/log', async (req, res) => {
  const { userId, from, to, limit } = req.query;
  const { username } = await User.findById({ _id: userId });

  const query = { username };
  if (from && !to) query.date = { $gte: from };
  if (!from && to) query.date = { $lte: to };
  if (from && to) query.date = { $gte: from, $lte: to };

  const exResults = await Exercise.find(query)
    .select('-_id -username -__v')
    .limit(limit * 1)
    .sort('date');
  res.json({
    _id: userId,
    username,
    count: exResults.length,
    log: exResults,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
