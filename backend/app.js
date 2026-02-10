const express = require('express');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const kidRoutes = require('./routes/kidRoutes');
const choreRoutes = require('./routes/choreRoutes');
const cardRoutes = require('./routes/cardRoutes');

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.use('/auth', authRoutes);
app.use('/kids', kidRoutes);
app.use('/chores', choreRoutes);
app.use('/cards', cardRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
