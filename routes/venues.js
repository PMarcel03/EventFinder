const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue')

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