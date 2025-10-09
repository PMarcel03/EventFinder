//Event.js stores the mongoose model for event information
console.log('=== Loading Event model ===');
const mongoose = require('mongoose');
console.log('mongoose loaded');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  dateTime: {
    start: Date,
    end: Date
  },
  location: {
    venueName: String,
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    address: {
      suburb: String,
      city: String
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    accessibility: {
      type: Object,
      default: {}
    },
    transport: {
      type: Object,
      default: {}
    },
    geocoding: {
      type: Object,
      default: {}
    }
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: 'NZD'
    },
    minPrice: Number,
    maxPrice: Number
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true
});

console.log('eventSchema created:', eventSchema);

eventSchema.pre('save', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  next();
});

console.log('About to export model');
module.exports = mongoose.model('Event', eventSchema);
console.log('Model exported');