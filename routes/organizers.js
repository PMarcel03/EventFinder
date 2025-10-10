const express = require('express');
const router = express.Router();
const Organizer = require ('../models/Organizer')

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