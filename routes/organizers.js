const express = require('express');
const router = express.Router();
const Organizer = require ('../models/Organizer')

//POST /api/organizers/normalize - The NORMALIZATION ROUTE
router.post('./normalize', async (req, res) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({error: 'Organizer name is required for normalization'});
    }

    try{
        //Use findOneandUpdate with upsert
        const organizer = await Organizer.findOneAndUpdate(
            {name: name}, //Query: Find by unique name
            {name: name}, //Data to set
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );

        res.json({_id: organizer._id, name: organizer.name});
    }catch(err){
        console.error('Error in Organizer normalization', err.message);
        res.status(500).json({error: 'Failed to normalizer organizer:' + err.message})
    }
});

//GET all organizers
router.get('/', async (req, res) => {
    try {
        const organizers = await Organizer.find().populate('events');
        res.json(organizers);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

//GET single Organizer
router.get('/:id', async (req, res) => {
    try{
        const organizer = await Organizer.findById(req.params.id).populate('events');
        if (!organizer) return res.status(404).json({error: 'Organizer not found'});
        res.json(organizer);
    }catch(err) {
        res.status(500).json({error: err.message});
    }
});

//POST new organizer
router.post('/', async (req, res) =>{
    try {
        const organizer = new Organizer(req.body);
        await organizer.save();
        res.status(201).json(organizer);

    } catch(err) {
        res.status(400).json({error: err.message});
    }
});

//PUT update organizer
router.put('/:id', async (req, res) => {
    try{
        const organizer = await Organizer.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        if (!organizer) return res.status(404).json({error: 'organizer not found'});
        res.json(organizer);
    }catch(err){
        res.status(400).json({error:err.message})
    }
});

//DELETE organizer
router.delete('/:id', async (req, res) =>{
    try{
        const organizer = await Organizer.findByIdAndDelete(req.params.id);
        if (!organizer) return res.status(404).json({error: 'Organizer not found'});
        res.json({message: 'Organizer deleted'})

    }catch(err){
        res.status(500).json({error: err.message})
    }
});

module.exports = router;