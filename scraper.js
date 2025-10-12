//Scraper.JS
const axios = require('axios');
const cheerio = require('cheerio');
const { Console } = require('console');
const fs = require ('fs/promises') //Uses promises version of fs for async/wait

//API Base URL
const API_URL = 'http://localhost:3000/api'

//Helper function to convert a title into a DB friendly, unique slug
//This is critical for the atomic upsert operation in events.js
function slugify(text)
{
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') //Replaces spaces with -
        .replace(/[^\w\-]+/g, '') //Removes all non-word chars
        .replace(/\-\-+/g, '-') //Replace multiple - with a single -
        .slice(0, 100); //Shorten to a reasonable length
}

async function fetchContent(url)
//Check if protocol is 'file://'
{
    if (url.startsWith('file://'))
        try {
            //Use native Node.js 'fs' module for local files
            const filePath = url.replace('file://', '');
            console.log('Reading Local Files', filePath);
            //Decode URI to handle spaces/special characters in file paths
            const content = await fs.readFile(decodeURI(filePath), 'utf-8');
            return content;
        }
        catch(error)
        {
            console.error('Error reading local file:', error.message);
            return null;
        }
        else 
            //Use Axios for standard HTTP/HTTPS requests
            {   
                try {
                    console.log('Fetching event from:', url);
                    const response = await axios.get(url, {
                        headers: {'User-Agent': 'Eventfinder-Scraper/1.0'}
                    });
                    return response.data;
                } catch(error){
                    console.error('error fetching URL:', error.message);
                    return null;
                }

            }
} 

//Function to scrape events from HTML Content
function parseEvents(html) {
    try {
    const $ = cheerio.load(html);
    const events = [];

    $('.event').each((i, element) => {
        const title = $(element).find('.title').text().trim();
        const description = $(element).find('.description').text().trim();
        const category = $(element).find('.category').text().trim();
        const dateString = $(element).find('.date').text().trim();

        //Venue + Organizer Scrape
        const venueName = $(element).find('.venue-name').text().trim();
        const organizerName = $(element).find('.organizer-name').text().trim();

        //Convert date string to an ISO date for Mongoose's date type with validation
        let dateTime = {};
        if (dateString) {
            const dateObj = new Date(dateString);
            //Simple validation check: Ensure date object is valid
        if(!isNaN(dateObj))
            {
                dateTime = {start: dateObj.toISOString()}
            } else {
                console.warn(`Skipping event due to invalid date string: ${title}`)
                return;
            }
        }
        

        const event = {
            title: title,
            description: description,
            category: category,
            dateTime: dateTime,
            //These are temporary fields used only for the normalization API call
            venueName: venueName,
            organizerName: organizerName,
            //CRITICAL: Slug generation is now inside parser
            slug: slugify(title)
        };

        //Only add if required fields are present
        if (event.title && event.category && event.venueName && event.organizerName && dateString) {
            events.push(event);
        }
    });

    console.log(`Found ${events.length} events`);
    return events;
    } catch(error) {
        console.error('Error scraping events', error.message);
        return [];
    }
    
}

//Hits the API's normalization endpoint for a Venue
async function normalizeVenue(name){
    if (!name) return null;
    try {
        const response = await axios.post(`${API_URL}/venues/normalize`, {name});
        return response.data._id;
    }catch(error){
        const apiError = error.response ? error.response.data.error: error.message;
        console.error(`Error in normalizing venue "${name}": ${apiError}`);
        return null;
    }
}

//Hits the API's normalization endpoint for an Organizer
async function normalizeOrganizer(name){
    if (!name) return null;
    try {
        const response = await axios.post(`${API_URL}/organizers/normalize`, {name});
        return response.data._id;
    }catch(error){
        const apiError = error.response ? error.response.data.error: error.message;
        console.error(`Error in normalizing organizer "${name}": ${apiError}`);
        return null;
    }
}

//Function to scrape events from a URL
async function scrapeEvents(url) {
    const htmlContent = await fetchContent(url);
    if (!htmlContent) {
        return [];
    }
    return parseEvents(htmlContent);
}

//Function to save an event to the API
async function saveEvent(event) {
    try{
        const payload = {
            title: event.title,
            description: event.description,
            category: event.category,
            dateTime: event.dateTime,
            slug: event.slug,
            //Use the Normalized IDs for linking (Referencing)
            location: {
                venueId: event.venueId, //Mongoose objectId reference
                venueName: event.venueName, //Denormalized name for quick display/UI
            },
            organizer: event.organizerId, //The Mongoose ObjectId reference
            //Pricing, address etc., would be added here if scraped
        };

        const response = await axios.post(`${API_URL}/events`, payload);
        console.log(`Saved: ${event.title} (ID: ${response.data._id})`);
        return response.data;
    }catch(error){
        //Log specific error message from the API if avaliable
        const apiError = error.response ? error.response.data.error : error.message;
        console.error(`Error saving event: ${event.title} - ${apiError}`);
        return null;
    }
}

//Main function to run the scraper
async function runScraper() {
    console.log('=== Starting Event Scraper ===\n');

    //URL to scrape (Can be local for testing)
    const path = require ('path');
    const targetUrl = "//'file://' + path.resolve(__dirname, 'test-events.html')";
    //Or use a real website like const targetURL = 'https://example.com/events'

    //Scrape events
    const events = await scrapeEvents(targetUrl);
    if (events.length === 0){
        console.log('No events found to save')
        return;
    }

    //Normalize and map IDs
    console.log(`\nStarting normalization for ${events.length} potential events...`);

    for (const event of events){
        //Await the normalization calls sequentially
        event.venueId = await normalizeVenue(event.venueName);
        event.organizerId = await normalizeOrganizer(event.organizerName)
    }
    console.log('Normalization complete. Starting save phase...')

    //Save each event to the API
    console.log(`\nSaving ${events.length} events to database...\n`)

    for (const event of events){
        //CRITICAL CHECK: Only proceed if normalization has been completed
        if (event.venueId && event.organizerId) {
            await saveEvent(event);
        } else {
            console.warn(`Skipping event "${event.title}": Normalization failed for Venue/Organizer.`)
        }
        //Add a small delay to respect API rate limits and log visibility
        await new Promise(resolve => setTimeout(resolve, 500));
        
    }

    console.log('\n=== Scraper Completed ===')
}

//Execute main scraper
runScraper()