const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Connect to MongoDB with updated connection options
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/textAnalysisDB');
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1); // Exit process with failure
    }
};

// Create Analysis Result Schema
const analysisSchema = new mongoose.Schema({
    text: String,
    characterCount: Number,
    wordCount: Number,
    paragraphCount: Number,
    spaceCount: Number,
    createdAt: { type: Date, default: Date.now }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoint to analyze and save text
app.post('/api/analyze', async (req, res) => {
    if (!mongoose.connection.readyState) {
        return res.status(500).json({
            success: false,
            message: 'Database not connected'
        });
    }

    const text = req.body.text || '';
    
    // Perform analysis
    const charCount = text.length;
    const words = text.trim() === '' ? [] : text.trim().split(/\s+/);
    const wordCount = words.length;
    const paragraphs = text.trim() === '' ? [] : text.split(/\n+/);
    const paraCount = paragraphs.length;
    const spaceCount = (text.match(/ /g) || []).length;

    try {
        // Save to MongoDB
        const analysis = new Analysis({
            text,
            characterCount: charCount,
            wordCount,
            paragraphCount: paraCount,
            spaceCount
        });

        await analysis.save();

        res.json({
            success: true,
            analysis: {
                characterCount: charCount,
                wordCount,
                paragraphCount: paraCount,
                spaceCount,
                savedAt: analysis.createdAt
            }
        });
    } catch (err) {
        console.error('Error saving analysis:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error saving analysis'
        });
    }
});

// API endpoint to get analysis history
app.get('/api/history', async (req, res) => {
    if (!mongoose.connection.readyState) {
        return res.status(500).json({
            success: false,
            message: 'Database not connected'
        });
    }

    try {
        const history = await Analysis.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('-__v -_id');
        
        res.json({
            success: true,
            history
        });
    } catch (err) {
        console.error('Error fetching history:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching history'
        });
    }
});

// Serve HTML page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server only after DB connection
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});