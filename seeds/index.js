const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Database connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
	await Campground.deleteMany({});
	for (let i = 0; i < 200; i++) {
		const random1000 = Math.floor(Math.random() * 1000);
		const price = Math.floor(Math.random() * 20) + 10;
		const camp = new Campground({
			//YOUR USER ID
			author: '63931f2bae033cf3585c2862',
			location: `${cities[random1000].city}, ${cities[random1000].state}`,
			title: `${sample(descriptors)} ${sample(places)}`,
			description:
				'Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis laboriosam nihil modi sunt, adipisci nam maiores perspiciatis. Distinctio, voluptas nihil voluptate neque, quaerat veritatis molestias odit, placeat cumque eligendi inventore.',
			price,
			geometry: {
				type: 'Point',
				coordinates: [
					cities[random1000].longitude,
					cities[random1000].latitude,
				],
			},
			images: [
				{
					url: 'https://res.cloudinary.com/dhfcsqpus/image/upload/v1670693430/Yelp-Camp/vuabyumaqgn6qwiwjmy9.jpg',
					filename: 'Yelp-Camp/vuabyumaqgn6qwiwjmy9',
				},
				{
					url: 'https://res.cloudinary.com/dhfcsqpus/image/upload/v1670693431/Yelp-Camp/ilfngpo6wle20bzkf7sc.jpg',
					filename: 'Yelp-Camp/ilfngpo6wle20bzkf7sc',
				},
			],
		});
		await camp.save();
	}
};

seedDB().then(() => {
	mongoose.connection.close();
});
