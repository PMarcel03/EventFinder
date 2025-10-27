//Server.js handles the connection to MongoDB and routing using express
require('dotenv').config();
const express =require('express');
const cors = require ('cors');
const { default: mongoose } = require('mongoose');


const app = express();

//Middleware
app.use(cors());
app.use(express.json()); //Parse JSON bodies


mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    console.log('Connected to database:', mongoose.connection.name);
    
    const Event = require('./models/Event');
    const count = await Event.countDocuments();
    console.log('>>> Total events in database:', count);
    
    const allEvents = await Event.find();
    console.log('>>> Events found:', allEvents);
  })
  .catch(err => console.error('MongoDB connection error:', err));

//---Routes---//
//Event Route
const eventRoutes = require('./routes/events');
console.log('Event routes loaded:', eventRoutes);
app.use('/api/events', eventRoutes);
console.log('Event routes registered at /api/events');
//Venue Route
const venueRoutes = require('./routes/venues');
console.log('Venue routes loaded:', venueRoutes);
app.use('/api/venues', venueRoutes);
console.log('Venue routes registered at /api/venues');
//Organizer Route
const organizerRoutes = require('./routes/organizers');
console.log('Organizer routes loaded:', organizerRoutes);
app.use('/api/organizers', organizerRoutes);
console.log('Organizer routes registered at /api/organizers');


//Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!'});
});

// Serve static files (HTML, CSS, images, etc.)
app.use(express.static(__dirname));

// Serve the index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});