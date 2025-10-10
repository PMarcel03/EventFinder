//Scraper.JS
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require ('fs/promises') //Uses promises version of fs for async/wait

//API Base URL
const API_URL = 'http://localhost:3000/api'

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
                        headers: {'User-Agent': 'Eventfinder-Scraper/1.0'} //Good pratice to identify the scraper
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
    const $ = cheerio.load(html);
    const events = [];

    $('.event').each((i, element) => {
        const title = $(element).find('.title').text().trim();
        const description = $(element).find('.description').text().trim();
        const category = $(element).find('.category').text().trim();
        const dateString = $(element).find('.date').text().trim();

        //Convert date string to an ISO date for Mongoose's date type
        const dateTime = dateString ? {start: new Date(dateString).toISOString()} : {};

        const event = {
            title: title,
            description: description,
            category: category,
            dateTime: dateTime
            //Currently missing venues/organizers but that will be added later
        };

        //Only add if required fields are present
        if (event.title && event.category) {
            events.push(event);
        }
    });

    console.log(`Found ${events.length} events`);
    return events;
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
        const payload = {...event};

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
    const targetUrl = 'file://' + path.resolve(__dirname, 'test-events.html');
    //Or use a real website like const targetURL = 'https://example.com/events'

    //Scrape events
    const events = await scrapeEvents(targetUrl);
    if (events.length === 0){
        console.log('No events found to save')
        return;
    }

    //Save each event to the API
    console.log(`\nSaving ${events.length} events to database...\n`)

    for (const event of events){
        await saveEvent(event);
        //add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n=== Scraper Completed ===')
}

runScraper()