const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue')

//POST /api/venues/normalize
//This implements the 'Find or Create" logic using Mongoose's upsert functionality
router.post('/normalize', async (req, res) => {
    const { name } = req.body

    if (!name){
        return res.status(400).json({error: 'Venue name is required for normalization.'});
    }

    try{
        //findOneandUpdate is the standard pattern for upsert operations
        const venue = await Venue.findOneAndUpdate(
            {name: name}, //1. Query: Find a venue with this unique name
            {name: name}, //2. Update/Insert: Data to a set if found or created
            {
                new: true, //Return the updated/new document
                upsert: true, //CRITICAL: If no document is found create a new one 
                runValidators: true, //Apply Mongoose Schema validators
            }
        );
        //Return only the ID and name as this is all the scraper needs
        res.json({_id: venue._id, name: venue.name});
    }catch(err) {
        console.error('Error in Venue Normalization', err.message);
        //Handle potential unique index errors here if needed but upsert usually manages this
        res.status(500).json({error: 'Failed to normalize venue:' + err.message});
    }
})



//GET all venues
router.get('/', async (req, res) =>{
    try{
        const venues = await Venue.find().populate('events');
        res.json(venues);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

//GET single venue
router.get('/:id', async (req, res) =>{
    try{
        const venue = await Venue.findById(req.params.id).populate('events');
        if (!venue) return res.status(404).json({error: 'Venue not found'});
        res.json(venue);
    }catch(err){
        res.status(500).json({error: err.message})
    }
});

//POST new venues
router.post('/', async (req, res) =>{
    try{
        const venue = new Venue(req.body);
        await venue.save();
        res.status(201).json(venue);
    }catch(err){
        res.status(400).json({error: err.message});
    }
});

//PUT update venue
router.put('/:id', async (req, res) =>{
    try{
        const venue = await Venue.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        if (!venue) return res.status(404).json({error: 'Venue not found'})
        res.json(venue)
    }catch(err){
        res.status(400).json({error: err.message});
    }
});

//DELETE venue
router.delete('/:id', async (req, res) =>{
    try{
        const venue = await Venue.findByIdAndDelete(req.params.id);
        if (!venue) return res.status(404).json({error: err.message});
        res.json({message: 'Venue deleted'});
    }catch(err){
        res.status(500).json({error: err.message})
    }
});

module.exports = router;