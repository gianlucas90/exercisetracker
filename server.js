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
  userId: String,
  description: {
    type: String,
    required: true,
  },
  durations: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
  },
});

userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

/////////////////// Models
///////////////////////////
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

/////////////////// Views
///////////////////////////
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
