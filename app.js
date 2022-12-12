if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require('connect-mongo');

const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
//'mongodb://127.0.0.1:27017/yelp-camp'
//connect database
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Database connected');
});

//use express
const app = express();

//use other dependencies
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
	express.urlencoded({
		encoded: true,
	})
);
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const store = MongoStore.create({
	mongoUrl: dbUrl,
	secret: 'thishouldbesecret',
	touchAfter: 24 * 60 * 60,
});

//configuring session cookie
const sessionConfig = {
	store: store,
	name: 'blah',
	secret: 'thishouldbesecret',
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
};

sessionConfig.store.on('error', function (e) {
	console.log('SESSION STORE ERROR', e);
});

app.use(session(sessionConfig));
app.use(flash());

//CHECKOUT HELMET!!
// app.use(
// 	helmet({
// 		contentSecurityPolicy: false,
// 		crossOriginEmbedderPolicy: false,
// 		crossOriginOpenerPolicy: false,
// 		crossOriginResourcePolicy: false,
// 	})
// );

// const scriptSrcUrls = [
// 	'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.min.js',
// 	'https://api.tiles.mapbox.com/',
// 	'https://api.mapbox.com/',
// 	'https://kit.fontawesome.com/',
// 	'https://cdnjs.cloudflare.com/',
// 	'https://cdn.jsdelivr.net',
// ];
// const styleSrcUrls = [
// 	'https://kit-free.fontawesome.com/',
// 	'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
// 	'https://api.mapbox.com/',
// 	'https://api.tiles.mapbox.com/',
// 	'https://fonts.googleapis.com/',
// 	'https://use.fontawesome.com/',
// ];
// const connectSrcUrls = [
// 	'https://api.mapbox.com/',
// 	'https://a.tiles.mapbox.com/',
// 	'https://b.tiles.mapbox.com/',
// 	'https://events.mapbox.com/',
// ];
// const fontSrcUrls = [];
// app.use(
// 	helmet.contentSecurityPolicy({
// 		directives: {
// 			defaultSrc: [],
// 			connectSrc: ["'self'", ...connectSrcUrls],
// 			scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
// 			styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
// 			workerSrc: ["'self'", 'blob:'],
// 			objectSrc: [],
// 			imgSrc: [
// 				"'self'",
// 				'blob:',
// 				'data:',
// 				'https://res.cloudinary.com/dhfcsqpus/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
// 				'https://images.unsplash.com/',
// 			],
// 			fontSrc: ["'self'", ...fontSrcUrls],
// 		},
// 	})
// );

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware to display flashes on screen that disappear after you leave
//aslo stores current user info, e.g. to use for is loggedIn
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

//use the router and add the prefix
// /camgrounds for every route of campground
// /campgrounds/:id/reviews for every route of revies
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
	res.render('home');
});

//ERROR handling
app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found!', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Oh no, Something went wrong!';
	res.status(statusCode).render('error', {
		err,
	});
});

app.listen(3000, () => {
	console.log('Serving on port 3000');
});
