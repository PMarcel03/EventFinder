//Routing for Events
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { default: mongoose } = require('mongoose');

//Debug Logs
console.log('Event model:', Event);
console.log('Event modelName:', Event.modelName);

//GET all events
router.get('/', async (req, res) => {
    console.log('GET /api/events hit!');
    try {
        const events = await Event.find()
        .populate({
            path: 'location.venueId',
            select: 'name address'//Select fields to pull from menu
        })
        .populate('organizer'); //Automatically uses path organizer
       console.log('Found events:', events.length);
       res.json(events);
    } catch(err) {
        console.error('GET error:', err);
        res.status(500).json({error: err.message});
    }
});

//GET single event
router.get('/:id', async (req, res) => {
    console.log('Requested ID:', req.params.id);
    try {
        const event = await Event.findById(req.params.id)
        .populate({
            path: 'location.venueId',
            select: 'name address'
        })
        .populate('organizer')
        console.log('Found event:', event);
        if (!event) return res.status(404).json({error: 'Event not found'});
        res.json(event);
    } catch (err) {
        console.error('Error finding event:', err.message);
        res.status(500).json({error: err.message});
    }
});

//POST new event - Implementing a single, atomic UPSERT based on the unique 'slug'
router.post('/', async (req, res) => {
    try {
        const {slug} = req.body;

        if (!slug) 
        {
            return res.status(400).json({error: 'Event slug is required for upsert operation'});
        }

        const event = await Event.findOneAndUpdate(
            {slug: slug}, //1. Query: Use the unique slug to find the document
            req.body, //2. Update: Use the entire req body to update all fields
            {
                new: true, //Return the updated/new document
                upsert: true, //CRITICAL: Create the document if it doesn't exist
                runValidators: true //Ensures mongoose validation runs on update/insert
            }
        );

        const isNew = event.createdAt.getTime() === event.updatedAt.getTime();
        const statusCode = isNew ? 201 : 200;

        console.log(`Event ${event.title} saved (Slug based ${isNew ? 'Creation' : 'Update'})`)
        res.status(statusCode).json(event);
    } catch(err) {
        console.error('Event Upsert Error:', err.message);
        res.status(400).json({error: err.message});
    }

});

//PUT new event
router.put('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        if (!event) return res.status(404).json({error: 'Event not found'});
        res.json(event);
    } catch(err){
        res.status(400).json({error: err.message});
    }
});

//DELETE event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json ({error: 'Event not found'});
        res.json({message: 'Event Deleted'});
    }
    catch(err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
