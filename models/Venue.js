//Venue.js Contains the Mongoose model for venue information
const mongoose = require('mongoose');

//Define the schema for the venue model
const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Venue name is required'],
        trim: true,
        unique: true //Ensure no venues can have the exact same name
    },
    website: {
        type: String,
        trim: true,
        //Optional add a custom URL validator if needed
    },
    contact: {
        phone: String,
        email: String
    },

    //Location and Geo-spacial Data (For Search) 
    //Note Structure here matches the location in Event.js
    address: {
        street: String,
        suburb: String,
        city: {
            type: String,
            required: [true, 'City is required for venue geocoding.']
        },
        postcode: String,
        country: {
            type: String,
            default: 'New Zealand'
        }
    },

    //GeoJSON for coordinates (MANDATORY for 2dsphere indexing)
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], //Longitude, Latitude
            required: [true, 'Coordinates [lon, lat] are required.'],
            index: '2dsphere' //Critical for fast geo-spacial location searching e.g (Venues near me)
        }
    },

    //Accessiblity & Utility
    accessibility: {
        wheelchairAccess: {type: Boolean, default: false},
        parking: {type: Boolean, default: false},
        notes: String
    },

    transport: {
        public: String, //E.g 'Bus Routes: 1, 5, 12'
        parkingInfo: String
    },
    //Optional references back to events primarily for fast lookup
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Venue', venueSchema)