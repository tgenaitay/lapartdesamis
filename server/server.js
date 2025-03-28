require('dotenv').config();
const express = require('express');
const cors = require('cors');
const llmService = require('./services/llm');
const storageService = require('./services/storage');
const emailService = require('./services/email');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
// Enable CORS for the client app
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
// Parse JSON bodies
app.use(express.json());

// Endpoint to securely provide Mapbox token
app.get('/api/mapbox-token', (req, res) => {
    res.json({ token: process.env.MAPBOX_KEY });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Handle form submissions
app.post('/submit', async (req, res) => {
    console.log('****************************'); 
    console.log('Received form submission:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('****************************');

    
    try {
        const llmResult = await llmService.processFormSubmission(req.body);
        if (llmResult.success) {
            const response = { 
                message: 'Form data processed successfully',
                selection: llmResult.selection
            };

            console.log('****************************'); 
            console.log('Wines selected in catalog:', llmResult.selection.length);
            // Store form data and LLM selection in Supabase
            const { data, error } = await storageService.storeFormSubmission(req.body, llmResult.selection);
            
            if (error) {
                console.error('Error storing form data:', error);
                // Continue with the response even if storage fails
            } else {
                console.log('****************************'); 
                console.log('Form data stored successfully:', data);
                response.submissionId = data[0].id; // Add the submission ID to the response
                
                // Send email notification
                try {
                    console.log('****************************'); 
                    console.log('Sending an email notification to WIM owners');
                    await emailService.sendSubmissionNotification(req.body, llmResult.selection);
                } catch (emailError) {
                    console.error('Error sending email notification:', emailError);
                    // Continue with the response even if email notification fails
                }
            }
            
            res.json(response);
        } else {
            res.status(504).json({ 
                error: 'Gateway Timeout', 
                message: 'The server is currently busy processing requests. Please try again in a few minutes.' 
            });
        }
    } catch (error) {
        console.error('Error processing form submission:', error);
        // Check if it's a timeout error
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            res.status(504).json({ 
                error: 'Gateway Timeout', 
                message: 'Le serveur est actuellement occupé à traiter des requêtes. Veuillez réessayer dans quelques minutes.'
            });
        } else {
            res.status(500).json({ error: 'Failed to process form submission' });
        }
    }
});

// Get wine selection by submission ID
app.get('/selection/:submissionId', async (req, res) => {
    console.log('****************************'); 
    console.log('Get submission ID:');
    console.log(req.params);
    console.log('****************************'); 
    try {
        const { submissionId } = req.params;
        const { data, error } = await storageService.getWineSelection(submissionId);
        
        if (error) {
            console.error('Error fetching wine selection:', error);
            return res.status(500).json({ error: 'Failed to fetch wine selection' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fallback to index.html for SPA-like behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running');
});