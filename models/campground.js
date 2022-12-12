const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

// 'https://res.cloudinary.com/dhfcsqpus/image/upload/v1670698946/Yelp-Camp/nzvjvzdesuprh0m2fxwf.jpg'

const ImageSchema = new Schema({
	url: String,
	filename: String,
});

//modify the URL of the image to add w_200 after upload
//in order for cloudinary to change the width of the image
ImageSchema.virtual('thumbnail').get(function () {
	return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

//setting up a schema that every campgound will follow
const CampgroundSchema = new Schema(
	{
		title: String,
		images: [ImageSchema],
		geometry: {
			type: {
				type: String,
				enum: ['Point'],
				required: true,
			},
			coordinates: {
				type: [Number],
				required: true,
			},
		},
		price: Number,
		description: String,
		location: String,
		author: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		reviews: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Review',
			},
		],
	},
	opts
);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
	return `<strong><a href='/campgrounds/${this._id}'>${this.title}</a><strong>
	<p>${this.description.substring(0, 20)}...</p>`;
});

//if a campground is deleted this also deletes every review asociated with that campground
CampgroundSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		await Review.deleteMany({
			_id: {
				$in: doc.reviews,
			},
		});
	}
});

//export the schema for external use
module.exports = mongoose.model('Campground', CampgroundSchema);
