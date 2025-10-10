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

//POST new event
router.post('/', async (req, res) => {
  try {
    //1. Check for event deduplication (Unique Index Search)
    //To prevent duplicate events, we check for a combination of title, venue and start time
    const existingEvent = await Event.findOne({
        title: req.body.title,
        'location.venueId': req.body.location.venueId,
        'dateTime.start': req.body.dateTime.start
    });

    if (existingEvent) {
        //If the exact same event already exists, update it instead of creating a new one (UPSERT)
        const updatedEvent = await Event.findByIdAndUpdate(
            existingEvent._id,
            req.body,
            {new: true, runValidators: true}
        );
        console.log('Event Updated (deduplication):', updatedEvent.title);
        return res.status(200).json(updatedEvent);
    }

    //2.If its a new event, create and save it
    const event = new Event(req.body);
    await event.save();
    console.log('New event created:', event.title);
    return res.status(200).json(event)
  }catch(err){
    console.error('Error processing event POST:', err.message);
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
