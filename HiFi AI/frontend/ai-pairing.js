// AI HiFi Frontend - Secure Client-Side Code
document.addEventListener('DOMContentLoaded', function() {
    const pairingButton = document.querySelector('.pairing-button');
    const resultsContainer = document.getElementById('pairing-results');
    const speakerInput = document.getElementById('speaker-input');
    const amplifierInput = document.getElementById('amplifier-input');
    const soundPreference = document.getElementById('sound-preference');
    const loadingIndicator = document.createElement('div');
    
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Analyzing pairing using AI and forum data...</p>
    `;

    async function fetchPairingAnalysis(speaker, amplifier, preferences) {
        try {
            const apiUrl = window.AI_HIFI_CONFIG?.API_BASE_URL || '';
            const response = await fetch(`${apiUrl}/api/pairing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    speaker: speaker.trim(),
                    amplifier: amplifier.trim(),
                    preferences: {
                        soundSignature: preferences.soundPreference,
                        roomSize: preferences.roomSize,
                        budget: preferences.budget,
                        primaryGenres: preferences.genres
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.');
                } else if (response.status === 400) {
                    throw new Error(errorData.error || 'Invalid input. Please check your speaker and amplifier names.');
                } else if (response.status === 503) {
                    throw new Error('AI analysis service is temporarily unavailable. Please try again later.');
                } else {
                    throw new Error(errorData.error || 'Analysis failed. Please try again.');
                }
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    function displayPairingResults(pairingData) {
        const { speaker, amplifier, analysis } = pairingData;
        
        resultsContainer.innerHTML = `
            <div class="pairing-header">
                <h3>${speaker.productName} + ${amplifier.productName}</h3>
                <div class="compatibility-score">
                    <span class="score">${analysis.compatibilityScore}/100</span>
                    <span class="assessment">${analysis.overallAssessment}</span>
                </div>
            </div>
            
            <div class="analysis-sections">
                <div class="technical-match">
                    <h4>Technical Compatibility</h4>
                    <div class="tech-details">
                        <p><strong>Impedance:</strong> ${analysis.technicalMatch.impedanceMatch}</p>
                        <p><strong>Power:</strong> ${analysis.technicalMatch.powerMatch}</p>
                        <p><strong>Sensitivity:</strong> ${analysis.technicalMatch.sensitivityMatch}</p>
                    </div>
                </div>
                
                <div class="sound-quality">
                    <h4>Expected Sound Quality</h4>
                    <p><strong>Signature:</strong> ${analysis.soundQuality.expectedSignature}</p>
                    
                    <div class="strengths">
                        <h5>Strengths:</h5>
                        <ul>
                            ${analysis.soundQuality.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                    </div>
                    
                    ${analysis.soundQuality.potentialWeaknesses.length > 0 ? `
                        <div class="weaknesses">
                            <h5>Potential Limitations:</h5>
                            <ul>
                                ${analysis.soundQuality.potentialWeaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="genre-recommendations">
                        <h5>Recommended Genres:</h5>
                        <p>${analysis.soundQuality.genreRecommendations.join(', ')}</p>
                    </div>
                </div>
                
                <div class="practical-considerations">
                    <h4>Setup Recommendations</h4>
                    <p><strong>Room Size:</strong> ${analysis.practicalConsiderations.roomSize}</p>
                    <p><strong>Placement:</strong> ${analysis.practicalConsiderations.placement}</p>
                    
                    ${analysis.practicalConsiderations.additionalEquipment.length > 0 ? `
                        <div class="additional-equipment">
                            <h5>Consider Adding:</h5>
                            <ul>
                                ${analysis.practicalConsiderations.additionalEquipment.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                ${analysis.alternativeRecommendations.length > 0 ? `
                    <div class="alternatives">
                        <h4>Alternative Recommendations</h4>
                        ${analysis.alternativeRecommendations.map(alt => `
                            <div class="alternative-item">
                                <strong>${alt.product}</strong>
                                <p>${alt.reason}</p>
                                <small>Trade-offs: ${alt.tradeoffs}</small>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="data-sources">
                <small>Analysis based on ${speaker.sourceCount + amplifier.sourceCount} forum discussions and reviews</small>
                <small>Last updated: ${new Date(speaker.lastUpdated).toLocaleDateString()}</small>
            </div>
        `;
        
        resultsContainer.classList.add('active');
    }

    function displayError(error) {
        let errorTitle = 'Analysis Failed';
        let errorMessage = error.message;
        let suggestion = 'Please try again in a few moments.';
        
        if (error.message.includes('Too many requests')) {
            errorTitle = 'Rate Limited';
            suggestion = 'Please wait a moment before making another request.';
        } else if (error.message.includes('temporarily unavailable')) {
            errorTitle = 'Service Unavailable';
            suggestion = 'Our AI analysis service is temporarily down. Please try again later.';
        } else if (error.message.includes('Invalid input')) {
            errorTitle = 'Invalid Input';
            suggestion = 'Please check that you\'ve entered valid speaker and amplifier model names.';
        }
        
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h4>${errorTitle}</h4>
                <p>${errorMessage}</p>
                <p><small>${suggestion}</small></p>
            </div>
        `;
        resultsContainer.classList.add('active');
    }

    function showLoading() {
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(loadingIndicator);
        resultsContainer.classList.add('active');
    }

    async function handlePairingRequest() {
        const speaker = speakerInput.value.trim();
        const amplifier = amplifierInput.value.trim();
        const preferences = {
            soundPreference: soundPreference.value,
            roomSize: document.getElementById('room-size')?.value || 'medium',
            budget: document.getElementById('budget')?.value || 'mid-range',
            genres: Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(cb => cb.value)
        };

        if (!speaker || !amplifier) {
            displayError(new Error('Please enter both speaker and amplifier models'));
            return;
        }
        
        if (speaker.length > 100 || amplifier.length > 100) {
            displayError(new Error('Product names must be less than 100 characters'));
            return;
        }

        showLoading();

        try {
            const pairingData = await fetchPairingAnalysis(speaker, amplifier, preferences);
            displayPairingResults(pairingData);
        } catch (error) {
            displayError(error);
        }
    }

    // Event Listeners
    pairingButton.addEventListener('click', handlePairingRequest);

    // Allow Enter key to trigger analysis
    [speakerInput, amplifierInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handlePairingRequest();
                }
            });
        }
    });

    // Recent pairings functionality
    async function loadRecentPairings() {
        try {
            const apiUrl = window.AI_HIFI_CONFIG?.API_BASE_URL || '';
            const response = await fetch(`${apiUrl}/api/recent?limit=5`);
            const data = await response.json();
            
            const recentContainer = document.getElementById('recent-pairings');
            if (recentContainer && data.pairings.length > 0) {
                recentContainer.innerHTML = `
                    <h4>Recent Analyses</h4>
                    <div class="recent-list">
                        ${data.pairings.map(pairing => `
                            <div class="recent-item" onclick="loadPairing('${pairing.speaker}', '${pairing.amplifier}')">
                                <span>${pairing.speaker} + ${pairing.amplifier}</span>
                                <span class="score">${pairing.score}/100</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load recent pairings:', error);
        }
    }

    // Global function for recent pairing clicks
    window.loadPairing = function(speaker, amplifier) {
        if (speakerInput) speakerInput.value = speaker;
        if (amplifierInput) amplifierInput.value = amplifier;
        handlePairingRequest();
    };

    // Load recent pairings on page load
    loadRecentPairings();

    // Auto-suggest functionality (simple implementation)
    function setupAutoSuggest(input, type) {
        if (!input) return;
        
        const suggestions = document.createElement('div');
        suggestions.className = 'suggestions';
        input.parentNode.appendChild(suggestions);

        input.addEventListener('input', async function() {
            const query = this.value.trim();
            if (query.length < 3) {
                suggestions.style.display = 'none';
                return;
            }

            // In a real implementation, you might want to fetch suggestions from the API
            // For now, we'll just show the input
            suggestions.innerHTML = `<div class="suggestion-item">${query}</div>`;
            suggestions.style.display = 'block';
        });

        input.addEventListener('blur', function() {
            setTimeout(() => {
                suggestions.style.display = 'none';
            }, 200);
        });
    }

    // Setup auto-suggest for inputs
    setupAutoSuggest(speakerInput, 'speaker');
    setupAutoSuggest(amplifierInput, 'amplifier');
});

// CSS for new elements (to be added to styles.css)
const aiPairingStyles = `
.loading-indicator {
    text-align: center;
    padding: 2rem;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #2c5530;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.pairing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #2c5530;
}

.compatibility-score {
    text-align: right;
}

.compatibility-score .score {
    font-size: 2rem;
    font-weight: bold;
    color: #2c5530;
    display: block;
}

.compatibility-score .assessment {
    font-size: 0.9rem;
    color: #666;
}

.analysis-sections {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

.analysis-sections > div {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #2c5530;
}

.analysis-sections h4 {
    margin-top: 0;
    color: #2c5530;
}

.analysis-sections h5 {
    margin: 1rem 0 0.5rem;
    color: #444;
}

.analysis-sections ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.alternative-item {
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
}

.error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c00;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
}

.data-sources {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
}

.data-sources small {
    display: block;
    color: #666;
    margin: 0.25rem 0;
}

.recent-list {
    max-height: 200px;
    overflow-y: auto;
}

.recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    margin: 0.25rem 0;
    background: #f5f5f5;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.recent-item:hover {
    background: #e5e5e5;
}

.recent-item .score {
    font-weight: bold;
    color: #2c5530;
}

.suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    z-index: 1000;
    display: none;
}

.suggestion-item {
    padding: 0.5rem;
    cursor: pointer;
    border-bottom: 1px solid #eee;
}

.suggestion-item:hover {
    background: #f5f5f5;
}

.suggestion-item:last-child {
    border-bottom: none;
}

@media (min-width: 768px) {
    .analysis-sections {
        grid-template-columns: 1fr 1fr;
    }
    
    .technical-match {
        grid-column: 1 / -1;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = aiPairingStyles;
document.head.appendChild(styleSheet);