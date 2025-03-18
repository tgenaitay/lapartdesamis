document.addEventListener('DOMContentLoaded', () => {
    // Conditional Logic for level questions
    const level = document.querySelectorAll('input[name="1.niveau"]');
    const toggleSections = (level) => {
        document.querySelectorAll('.debutant-only, .connaisseur-only, .expert-only')
        .forEach(el => el.classList.add('hidden'));
        
        if(level === 'debutant') {
            document.querySelectorAll('.debutant-only').forEach(el => el.classList.remove('hidden'));
        } else if(level === 'connaisseur') {
            document.querySelectorAll('.connaisseur-only').forEach(el => el.classList.remove('hidden'));
        } else if(level === 'expert') {
            document.querySelectorAll('.expert-only').forEach(el => el.classList.remove('hidden'));
        }
    };
    level.forEach(radio => {
        radio.addEventListener('change', (e) => toggleSections(e.target.value));
    });
    
    // Rating System for wine preferences
    document.querySelectorAll('.rating-scale').forEach(scale => {
        const buttons = scale.querySelectorAll('.rating-btn');
        const name = scale.dataset.name;
        
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons in this scale
                buttons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Create hidden input to store the value
                let input = document.querySelector(`input[name="${name}"]`);
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = name;
                    document.getElementById('wineForm').appendChild(input);
                }
                input.value = this.dataset.value;
            });
        });
    });
    
    // Shuffle function to randomize array elements
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Ranking System for wine types (Tap-to-Select)
    const wineRanking = document.getElementById('wineRanking');
    const rankingItems = document.querySelectorAll('.ranking-item');
    let currentRankingIndex = 0;
    
    // Shuffle the ranking items
    const shuffledItems = shuffleArray([...rankingItems]);
    shuffledItems.forEach(item => {
        wineRanking.appendChild(item);
        // Add rank indicator
        const rankIndicator = document.createElement('span');
        rankIndicator.className = 'rank-indicator';
        item.insertBefore(rankIndicator, item.firstChild);
        
        // Add tap event listener
        item.addEventListener('click', function() {
            if (!this.dataset.rank) {
                currentRankingIndex++;
                this.dataset.rank = currentRankingIndex;
                this.querySelector('.rank-indicator').textContent = currentRankingIndex;
                this.classList.add('ranked');
                updateWineOrder();
            }
        });
    });
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Réinitialiser ce classement';
    resetButton.className = 'reset-ranking-btn';
    resetButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        currentRankingIndex = 0;
        rankingItems.forEach(item => {
            delete item.dataset.rank;
            item.querySelector('.rank-indicator').textContent = '';
            item.classList.remove('ranked');
        });
        updateWineOrder();
    });
    wineRanking.after(resetButton);
    
    function updateWineOrder() {
        const items = Array.from(document.querySelectorAll('.ranking-item'));
        const rankedItems = items
            .filter(item => item.dataset.rank)
            .sort((a, b) => parseInt(a.dataset.rank) - parseInt(b.dataset.rank))
            .map(item => item.dataset.value);
        const unrankedItems = items
            .filter(item => !item.dataset.rank)
            .map(item => item.dataset.value);
        const order = [...rankedItems, ...unrankedItems];
        document.getElementById('wineOrder').value = order.join(',');
    }
    
    // Initialize the wine order
    updateWineOrder();
    
    // Other interactions - Show/hide text input for 'autre' moment
    document.querySelector('input[name="3.moments"][value="autre"]').addEventListener('change', function(e) {
        document.querySelector('input[name="autre_moment"]').classList.toggle('hidden', !e.target.checked);
    });
    
    // Limit region selections to 2 checkboxes
    function limitCheckboxes(checkboxes, limit) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                if (checkedCount > limit) {
                    this.checked = false;
                    alert(`Vous ne pouvez sélectionner que ${limit} options.`);
                }
            });
        });
    }
    
    limitCheckboxes(document.querySelectorAll('input[name="6.debutant_regions"]'), 2);
    limitCheckboxes(document.querySelectorAll('input[name="6.connaisseur_regions"]'), 2);
    limitCheckboxes(document.querySelectorAll('input[name="6.expert_regions"]'), 2);
    
    // Add loading container after the form
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loading-container';
    loadingContainer.style.display = 'none';
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-status"></div>
    `;
    document.getElementById('wineForm').after(loadingContainer);
    
    // Form Submission with validation
    document.getElementById('wineForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.style.display = 'none';
        
        const loadingContainer = document.getElementById('loading-container');
        const loadingStatus = loadingContainer.querySelector('.loading-status');
        
        // Show loading container
        loadingContainer.style.display = 'block';
        
        // Scroll to loading container
        loadingContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Update status function
        const updateStatus = (message) => {
            loadingStatus.textContent = message;
        };
        
        // Show error function
        const showError = (message) => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'loading-error';
            errorDiv.textContent = message;
            loadingStatus.after(errorDiv);
            setTimeout(() => {
                loadingContainer.style.display = 'none';
                errorDiv.remove();
            }, 5000);
        };
        
        try {
            updateStatus('Lecture de vos habitudes et de vos préférences...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Validate all required fields
            const requiredSections = document.querySelectorAll('.required');
            for (const section of requiredSections) {
                // Get the question number and title for error message
                const questionTitle = section.textContent.trim();
                
                // Find the parent question group
                const questionGroup = section.closest('.question-group');
                
                // Check radio buttons
                const radioInputs = questionGroup.querySelectorAll('input[type="radio"]');
                if (radioInputs.length > 0) {
                    const radioName = radioInputs[0].name;
                    if (!document.querySelector(`input[name="${radioName}"]:checked`)) {
                        throw new Error(`Veuillez répondre à la question: ${questionTitle}`);
                    }
                }
                
                // Check checkboxes (at least one should be checked)
                const checkboxes = questionGroup.querySelectorAll('input[type="checkbox"]');
                if (checkboxes.length > 0) {
                    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
                    if (checkedBoxes.length === 0) {
                        const errorMessage = `Veuillez sélectionner au moins une option pour: ${questionTitle}`;
                        showError(errorMessage);
                        throw new Error(errorMessage);
                    }
                }
                
                // Check rating scales
                const ratingScales = questionGroup.querySelectorAll('.rating-scale');
                for (const scale of ratingScales) {
                    if (!scale.querySelector('.rating-btn.active')) {
                        throw new Error(`Veuillez donner une note pour tous les critères de: ${questionTitle}`);
                    }
                }
            }
            
            // Validate wine ranking specifically
            if (!document.getElementById('wineOrder').value) {
                throw new Error('Veuillez classer les familles de vins.');
            }
            
            updateStatus('Recherche d\'excellents vins pour votre cave...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Collect form data
            const formData = new FormData(this);
            
            // Get the selected experience level
            const selectedLevel = document.querySelector('input[name="1.niveau"]:checked').value;
            
            // Create an array to store entries
            const entries = Array.from(formData.entries());
            
            // Filter out entries based on experience level
            const filteredEntries = entries.filter(([key]) => {
                if (selectedLevel === 'debutant') {
                    return !key.includes('_connaisseur') && !key.includes('_expert');
                } else if (selectedLevel === 'connaisseur') {
                    return !key.includes('_debutant') && !key.includes('_expert');
                } else if (selectedLevel === 'expert') {
                    return !key.includes('_debutant') && !key.includes('_connaisseur');
                }
                return true;
            });
            
            // Create a structured object with question-answer pairs
            const formattedData = {};
            const allQuestionGroups = document.querySelectorAll('.question-group');
            
            allQuestionGroups.forEach(group => {
                // Process all question sections within the group
                const sections = group.querySelectorAll('.question-section, h2');
                
                sections.forEach(section => {
                    let questionTitle = '';
                    let inputs;
                    
                    if (section.tagName.toLowerCase() === 'h2') {
                        questionTitle = section.textContent.trim();
                        inputs = section.parentElement.querySelectorAll('input, textarea, select');
                    } else {
                        questionTitle = section.querySelector('h2')?.textContent.trim();
                        if (!questionTitle) return;
                        inputs = section.querySelectorAll('input, textarea, select');
                    }
                    
                    if (inputs.length === 0) return;
                    
                    // Handle different input types
                    let answer = '';
                    if (inputs[0].type === 'radio') {
                        const checkedInput = Array.from(inputs).find(input => input.checked);
                        answer = checkedInput ? checkedInput.value : '';
                    } else if (inputs[0].type === 'checkbox') {
                        const checkedBoxes = Array.from(inputs).filter(input => input.checked);
                        answer = checkedBoxes.map(cb => cb.value).join(', ');
                    } else if (inputs[0].tagName.toLowerCase() === 'textarea') {
                        answer = inputs[0].value;
                    }
                    
                    if (answer) {
                        formattedData[questionTitle] = answer;
                    }
                });
            });
            
            // Add wine ranking if present (Question 4)
            const wineOrder = document.getElementById('wineOrder');
            console.log(wineOrder);
            if (wineOrder && wineOrder.value) {
                formattedData['4. Classement'] = wineOrder.value;
            }
            
            // Add wine preferences ratings from section 5
            const winePreferences = {};
            document.querySelectorAll('.wine-type').forEach(wineType => {
                const wineCategory = wineType.querySelector('h3').textContent.trim();
                const ratings = {};
                
                wineType.querySelectorAll('.rating-item').forEach(item => {
                    const criterion = item.querySelector('span').textContent.trim();
                    const scale = item.querySelector('.rating-scale');
                    const activeBtn = scale.querySelector('.rating-btn.active');
                    if (activeBtn) {
                        ratings[criterion] = activeBtn.dataset.value;
                    }
                });
                
                if (Object.keys(ratings).length > 0) {
                    winePreferences[wineCategory] = ratings;
                }
            });
            
            if (Object.keys(winePreferences).length > 0) {
                formattedData['5. Préférences de goût'] = winePreferences;
            }
            
            updateStatus('Analyse des résultats...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Send data to server
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur dans la recherche, HTTP status: ${response.status}`);
            }
            
            const data = await response.json();
            
            updateStatus('Une pré-selection est prête!');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Redirect to results page with submissionId
            window.location.href = `results.html?submissionId=${data.submissionId}`;
            
        } catch (error) {
            showError(error.message);
            submitButton.style.display = 'block';
            loadingContainer.style.display = 'none';
            return;
        }
        
        // Log formatted data to console
        console.log(formattedData);
    });
});