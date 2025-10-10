//Organizer.js Mongoose Model for Organizer (Person, Company or Group) information.
const mongoose = require('mongoose');

//Define the Schema for the organizer model
const organizerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organizer name is required'],
        trim: true,
        unique: true //Prevent duplication
    },
    website: {
        type: String,
        trim: true,
    },
    contact: {
        phone: String,
        email: {
            type: String,
            trim: true,
            lowercase: true
            //Optional add basic email validation here
        }
    },
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        //Add others as needed
    },

    //Relationships
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

//Create and export the model
module.exports = mongoose.model('Organizer', organizerSchema)
