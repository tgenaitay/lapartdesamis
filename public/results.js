// Get submission ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const submissionId = urlParams.get('submissionId');

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
            <h3>${wine.domaine_chateau}</h3>
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
    });
    
    return wineGrid;
}

async function fetchAndDisplayWines() {
    if (!submissionId) {
        document.getElementById('content').innerHTML = `
            <div class="error">
                Aucun identifiant de soumission trouvé. Veuillez retourner au formulaire.
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/selection/${submissionId}`);
        if (!response.ok) throw new Error('Failed to fetch wine selection');
        
        const wines = await response.json();
        document.getElementById('content').innerHTML = `
            <div class="success">
                <h2>Nous avons des vins absolument extraordinaires à vous partager...</h2>
                <div class="cta-section">
                    <p class="cta-text">... et ce n'est que le début. Nous pouvons maintenant itérer ensemble sur cette courte sélection. <br> Utilisez notre calendrier pour réserver un appel à votre convenance !</p>
                    <a href="https://calendar.app.google/32uARJEajwA6bkH1A" class="cta-button">Gratuit: Prenez rendez-vous</a>
                </div>
                ${displayWines(wines).outerHTML}
                <a href="https://calendar.app.google/32uARJEajwA6bkH1A" class="cta-button">Gratuit: Prenez rendez-vous</a>
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