// Get submission ID and email from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const submissionId = urlParams.get('submissionId');
const userEmail = urlParams.get('email');

function createCharacteristicBar(value, maxValue = 5) {
    if (value === null) return '';
    const percentage = (value / maxValue) * 100;
    return `
        <div class="characteristic-bar">
            <div class="characteristic-fill" style="width: ${percentage}%"></div>
        </div>
    `;
}

function displayWines(wines) {
    const wineGrid = document.createElement('div');
    wineGrid.className = 'wine-grid';
    let count = 1;
    wines.forEach(wine => {
        const wineCard = document.createElement('div');
        wineCard.className = 'wine-card';
        
        const characteristics = [];
        if (wine.couleur === 'Blanc') {
            if (wine.blanc_fruite !== null) characteristics.push(['Fruité', wine.blanc_fruite]);
            if (wine.blanc_mineral !== null) characteristics.push(['Minéral', wine.blanc_mineral]);
            if (wine.blanc_boise !== null) characteristics.push(['Boisé', wine.blanc_boise]);
            if (wine.blanc_beurre !== null) characteristics.push(['Beurré', wine.blanc_beurre]);
            if (wine.blanc_sucrosite !== null) characteristics.push(['Sucrosité', wine.blanc_sucrosite]);
        } else {
            if (wine.rouge_fruite !== null) characteristics.push(['Fruité', wine.rouge_fruite]);
            if (wine.rouge_tannique !== null) characteristics.push(['Tannique', wine.rouge_tannique]);
            if (wine.rouge_boise !== null) characteristics.push(['Boisé', wine.rouge_boise]);
            if (wine.rouge_epice !== null) characteristics.push(['Épicé', wine.rouge_epice]);
        }
        
        wineCard.innerHTML = `
            <h3>${count}. ${wine.domaine_chateau}</h3>
            <div class="wine-info">
                <span class="wine-label">Appellation:</span>
                <span class="wine-value">${wine.appellation}</span>
                
                <span class="wine-label">Région:</span>
                <span class="wine-value">${wine.region}</span>
                
                <span class="wine-label">Cépage:</span>
                <span class="wine-value">${wine.cepage_dominant}</span>
                
                <span class="wine-label">Couleur:</span>
                <span class="wine-value">${wine.couleur}</span>
                
                <span class="wine-label">Prix:</span>
                <span class="wine-value">${wine.prix}€</span>
                
                <span class="wine-label">Apogée:</span>
                <span class="wine-value">${wine.debut_apogee} - ${wine.fin_apogee} ans</span>
            </div>
            <div class="characteristics">
                ${characteristics.map(([label, value]) => `
                    <div class="wine-info">
                        <span class="wine-label">${label}:</span>
                        <span class="wine-value">${createCharacteristicBar(value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        wineGrid.appendChild(wineCard);
        count++;
    });
    
    return wineGrid;
}

function createEmailForm() {
    const formCard = document.createElement('div');
    formCard.className = 'email-form-card';
    formCard.innerHTML = `
        <div class="email-form-content">
            <div id="formContent">
                <p class="cta-text">Indiquez votre email ci-dessous.</p>
                <form id="emailForm" class="email-form">
                    <input type="email" id="email" required placeholder="email@" />
                    <button type="submit" class="submit-button">Envoyer la sélection sur mon email</button>
                </form>
            </div>
            <div id="formFeedback" class="form-feedback"></div>
        </div>
    `;
    return formCard;
}

function showEmailForm() {
    const formCard = createEmailForm();
    const ctaSection = document.querySelector('.cta-section');
    ctaSection.insertAdjacentElement('afterend', formCard);
    setTimeout(() => {
        formCard.classList.add('visible');
        formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    
    // Hide all CTA buttons
    document.querySelectorAll('.cta-button').forEach(button => {
        button.style.display = 'none';
    });
    
    const emailForm = formCard.querySelector('#emailForm');
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailForm.querySelector('#email').value;
        const feedback = formCard.querySelector('#formFeedback');
        const content = formCard.querySelector('#formContent');
        const ctaIntro = document.querySelector('.cta-intro');
        const ctaSection = document.querySelector('.cta-section');
        const submitButton = emailForm.querySelector('.submit-button');
        
        // Hide submit button
        submitButton.style.display = 'none';
        
        // Create and show loading container
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-status">Envoi de votre sélection en cours...</div>
        `;
        feedback.innerHTML = '';
        feedback.appendChild(loadingContainer);
        feedback.style.display = 'block';
        
        try {
            console.log('trying to send an email to customer');
            
            // Update loading status
            const loadingStatus = loadingContainer.querySelector('.loading-status');
            loadingStatus.textContent = 'Votre sélection personnalisée est en chemin...';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, submissionId })
            });
            
            if (!response.ok) throw new Error('Erreur lors de l\'envoi');
            
            // Update loading status before hiding it
            loadingStatus.textContent = 'Email envoyé.';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Hide loading container
            loadingContainer.style.display = 'none';
            
            // Show success message
            content.style.display = 'none';
            ctaIntro.style.display = 'none';
            ctaSection.style.display = 'none';
            feedback.innerHTML = '<h2>Votre sélection de vins est dans votre boîte email.</h2> \n <p class="cta-text"> Pour en discuter, nous vous proposons un rendez-vous téléphonique. </p> <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3fjhdeRHHq-pXxplqSlWc5MI2uP9pCRql4228rK-aUUkEeZqkbU1-9gUg91EkkITyPwIXqkRmb" class="cta-button">Gratuit: Prenez rendez-vous</a> \n ';
            feedback.className = 'form-feedback success';
            
        } catch (error) {
            // Hide loading container
            loadingContainer.style.display = 'none';
            
            // Show error message
            feedback.innerHTML = 'Une erreur est survenue. Veuillez réessayer.';
            feedback.className = 'form-feedback error';
            
            // Show submit button again
            submitButton.style.display = 'block';
        }
    });
}

function createCTASection(isEmailProvided) {
    if (isEmailProvided) {
        return `
            <div class="cta-section">
                <p class="cta-text">... et ce n'est que le début. Nous pouvons maintenant itérer ensemble sur cette courte sélection. <br> Utilisez notre calendrier pour réserver un appel à votre convenance !</p>
                <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3fjhdeRHHq-pXxplqSlWc5MI2uP9pCRql4228rK-aUUkEeZqkbU1-9gUg91EkkITyPwIXqkRmb" class="cta-button">Gratuit: Prenez rendez-vous</a>
            </div>
        `;
    } else {
        return `
            <div class="cta-section">
                <p class="cta-text">... et ce n'est que le début. Nous pouvons maintenant itérer ensemble sur cette courte sélection.</p>
                <button class="cta-button" onclick="showEmailForm()">Cliquez ici pour recevoir cette sélection par email</button>
            </div>
        `;
    }
}

async function fetchAndDisplayWines() {
    if (!submissionId) {
        document.getElementById('content').innerHTML = `
            <div class="error">
                Aucun identifiant de sélection trouvé. Veuillez retourner au formulaire.
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/selection/${submissionId}`);
        if (!response.ok) throw new Error('Failed to fetch wine selection');
        
        const wines = await response.json();
        const isEmailProvided = userEmail !== null;
        
        document.getElementById('content').innerHTML = `
            <div class="success">
                <h2 class="cta-intro">Nous avons des vins absolument extraordinaires à vous partager...</h2>
                ${createCTASection(isEmailProvided)}
                ${displayWines(wines).outerHTML}
                ${isEmailProvided ? `<a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3fjhdeRHHq-pXxplqSlWc5MI2uP9pCRql4228rK-aUUkEeZqkbU1-9gUg91EkkITyPwIXqkRmb" class="cta-button">Gratuit: Prenez rendez-vous</a>` : 
                `<button class="cta-button" onclick="showEmailForm()">Recevoir ma sélection par email</button>`}
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('content').innerHTML = `
            <div class="error">
                Nous n'avons pas de sélection disponible ici. Veuillez retourner au formulaire.
            </div>
        `;
    }
}

fetchAndDisplayWines();