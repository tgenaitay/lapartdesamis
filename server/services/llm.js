const { OpenAI } = require('openai');

class LLMService {
    constructor() {
        // Initialize OpenAI client with provider's base URL and API key
        this.client = new OpenAI({
            baseURL: "https://api.together.xyz/v1/",
            apiKey: process.env.TOGETHER_API_KEY,
        });
    }

    async processFormSubmission(formData) {
        try {
            // Prepare the prompt with form data
            const prompt = this.preparePrompt(formData);
            console.log(prompt);

            const queryWinesTool = {
                type: "function",
                function: {
                    name: "query_wines",
                    description: "Interroge la base de données pour recommander des vins selon les préférences.",
                    parameters: {
                        type: "object",
                        properties: {
                            filters: { type: "object", properties: { 
                                region: { type: "array", items: { type: "string" } }, 
                                prix_max: { type: "number" }, 
                                prix_min: { type: "number" }, 
                                appellations: { type: "array", items: { type: "string" } }, 
                                domaines: { type: "array", items: { type: "string" } } 
                            } },
                            color_weights: { type: "object", properties: { 
                                rouge: { type: "number" }, 
                                blanc: { type: "number" }, 
                                rose: { type: "number" }, 
                                bulles: { type: "number" } 
                            } },
                            preferences: { type: "object", properties: { 
                                rouges: { type: "object", 
                                    properties: { 
                                        rouge_fruite: { type: "number" }, 
                                        rouge_epice: { type: "number" }, 
                                        rouge_boise: { type: "number" }, 
                                        rouge_tannique: { type: "number" } 
                                    } 
                                },
                                blancs: { type: "object", 
                                    properties: { 
                                        blanc_fruite: { type: "number" }, 
                                        blanc_mineral: { type: "number" }, 
                                        blanc_beurre: { type: "number" }, 
                                        blanc_boise: { type: "number" },
                                        blanc_sucrosite: { type: "number" } 
                                    } 
                                }                                 
                            } }
                        },
                        required: ["filters", "color_weights", "preferences"]
                    }
                }
            };

            // Call the LLM API
            const response = await this.client.chat.completions.create({
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                messages: [
                    {
                        role: 'system',
                        content: 'Vous etes un expert en vin francais. Vous ne parlez que le français. IMPORTANT Vous avez accès à un catalogue de vin et ne pouvez faire des propositions que dans ce catalogue, pas une autre source. Utilisez l\'outil `query_wines` pour structurer vos recommandations. Vous devez répondre avec un JSON 100% valide.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 1,
                max_tokens: null,
                top_p: 0.7,
                top_k: 50,
                repetition_penalty: 1,
                stop: ["<|eot_id|>","<|eom_id|>"],
                stream: false,
                tools: [queryWinesTool],
                tool_choice: {"type": "function", "function": {"name": "query_wines"}}
            });

            const message = response.choices[0].message;
            console.log(message);
            console.log(message.tool_calls);

            // Check for tool calls in the standard way
            if (message.tool_calls && message.tool_calls.length > 0 && message.tool_calls[0].function.name === "query_wines") {
                const args = JSON.parse(message.tool_calls[0].function.arguments);
                const recommendations = await this.query_wines(args.filters, args.color_weights, args.preferences);
                return {
                    selection: recommendations,
                    success: true
                };
            } 
            // Check for function call embedded in content (Together.xyz format)
            else if (message.content && message.content.includes('<function=query_wines>')) {
                const functionMatch = message.content.match(/<function=query_wines>(.*?)<\/function>/s);
                if (functionMatch && functionMatch[1]) {
                    try {
                        const args = JSON.parse(functionMatch[1]);
                        const recommendations = await this.query_wines(args.filters, args.color_weights, args.preferences);
                        return {
                            selection: recommendations,
                            success: true
                        };
                    } catch (parseError) {
                        console.error('Error parsing function arguments from content:', parseError);
                        return {
                            error: 'Failed to parse function arguments from content',
                            success: false
                        };
                    }
                }
            }

            return {
                error: 'No valid tool call found',
                success: false
            };
        } catch (error) {
            console.error('LLM processing error:', error);
            return {
                error: 'Failed to process form submission with LLM',
                success: false
            };
        }
    }

    preparePrompt(formData) {
        // Convert form data into a structured prompt
        return "Notre équipe commerciale vient de terminer un rendez-vous avec un client et a fourni le resultat d'un questionnaire. Vous êtes un assistant expert en vins, chargé de recommander les 10 meilleurs vins à ce client en fonction de ses préférences tirées du questionnaire. Les réponses du client sont fournies sous forme de paires clé-valeur au format JSON, avec des variations selon le niveau d'expertise du client ('debutant' ou 'expert' ou 'connaisseur'). Merci d'analyser les préférences du client pour l'aider à constituer une cave. Votre tâche est d'analyser ces préférences et d'appeler la fonction 'query_wines' avec les paramètres appropriés pour filtrer et scorer les vins de la base de données. Retournez uniquement l'appel de la fonction au format JSON. Ce client est a très fort potentiel commercial, bien prendre le temps de réfléchir avant de formuler l'appel de fonction." 
        +
           "**Contexte de la base de données :**\n" +
           "- Table : `wines`\n" +
           "- Colonnes : `region`, `appellation`, `domaine_chateau`, `couleur` ('Rouge', 'Blanc', 'Bulles', 'Rosé'), `prix`, et caractéristiques gustatives :\n" +
           "  - Pour 'Rouge': `rouge_fruite`, `rouge_epice`, `rouge_boise`, `rouge_tannique` (échelle de 1 à 5).\n" +
           "  - Pour 'Blanc' : `blanc_fruite`, `blanc_mineral`, `blanc_beurre`, `blanc_boise`, `blanc_sucrosite` (échelle de 1 à 5).\n\n" +
           "**Instructions :**\n" +
           "1. **Filtres** :\n" +
           "   - De la question 6, extrayez les régions préférées (par exemple, \"bourgogne, provence\") sous forme de tableau.\n" +
           "   - De la question 7 :\n" +
           "     - Divisez la réponse par des virgules. Traitez les appellations (par exemple, \"Meursault\") et les domaines (par exemple, \"Domaine de Terrebrune\") séparément, et retournez-les comme tableaux (ex. [\"Meursault\"] et [\"Domaine de Terrebrune\"]). \n" +
           "     - Si la réponse est vide ou n'a pas de sens, définissez `appellations` et `domaines` comme des tableaux vides.\n" +
           "   - De la question 8, analysez la fourchette de budget (par exemple, \"50-100\") en `prix_min` et `prix_max`.\n" +
           "   - Omettez tout filtre non spécifié ou non pertinent.\n\n" +
           "2. **Poids des couleurs** :\n" +
           "   - De la question 4 (\"Classement\", par exemple, \"rouge,petillant,blanc,rose\"), attribuez des poids :\n" +
           "     - 1er : 4, 2ème : 3, 3ème : 2, 4ème : 1.\n" +
           "   - Mappez \"petillant\" à la couleur \"Bulles\". Utilisez \"Rouge\", \"Blanc\", \"Bulles\", \"Rosé\" comme clés.\n\n" +
           "3. **Préférences** :\n" +
           "   - De la question 5 (\"Préférences de goût\"), extrayez les notes (1-5) pour chaque type de vin :\n" +
           "     - \"rouges\" : \"fruite\", \"épice\", \"boise\", \"tannique\".\n" +
           "     - \"blancs\" : \"fruite\", \"mineral\", \"beurre\", \"boise\", \"sucrosite\".\n" +
           "     - Ignorez \"petillants\" et \"roses\" en raison des limitations de la base de données).\n" +
           "   - Les notes indiquent l'intensité de la préférence (1 = aversion, 5 = forte préférence).\n\n" +
           "4. **Sortie** :\n" +
           "   - Générez un objet JSON 100% valide pour la fonction `query_wines` avec `filters`, `color_weights`, et `preferences`.\n\n" +
           "   - Les clés 'regions', 'appellations', et 'domaines' doivent être des tableaux de chaînes.\n\n \n\n" +
           "**Exemple de sortie attendue :**\n" +
           "{\n" +
           "  \"filters\": {\n" +
           "    \"regions\": [\"bourgogne\", \"provence\"],\n" +
           "    \"appellations\": [\"Meursault\"],\n" +
           "    \"domaines\": [\"Domaine de Terrebrune\"],\n" +
           "    \"prix_min\": 50,\n" +
           "    \"prix_max\": 100\n" +
           "  },\n" +
           "  \"color_weights\": {\n" +
           "    \"rouge\": 4,\n" +
           "    \"blanc\": 3,\n" +
           "    \"rose\": 2,\n" +
           "    \"bulles\": 1\n" +
           "  },\n" +
           "  \"preferences\": {\n" +
           "    \"rouges\": {\"fruite\": 2, \"epice\": 5, \"boise\": 5, \"tannique\": 3},\n" +
           "    \"blancs\": {\"fruite\": 5, \"mineral\": 5, \"beurre\": 2, \"boise\": 1, \"sucrosite\": 1},\n" +
           "  }\n" +
           "}\n\n" +
           "Les données du client sont les suivantes : " + JSON.stringify(formData, null, 2);
    }

    async query_wines(filters, color_weights, preferences) {
        console.log('****************************'); 
        console.log("Received SQL query with params:", filters, color_weights, preferences)
        try {
            // Initialiser le client Supabase (à adapter selon votre configuration)
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
            // Construire la requête de base
            let query = supabase.from('wines').select('*');
    
// Appliquer les filtres: regions, prix min, prix max, appelations, domaines
/* Les filtres (region, prix_min, prix_max, appellations, domaines) sont appliqués avec les méthodes Supabase .in() (inclus dans), .gte() (supérieur ou égal), et .lte() (inférieur ou égal).
Chaque filtre est conditionnel : s'il n'est pas défini dans filters, il est ignoré.*/

            if (filters.regions && Array.isArray(filters.regions) && filters.regions.length > 0) {
                query = query.in('region', filters.regions);
            }
            if (filters.prix_min) {
                query = query.gte('prix', filters.prix_min);
            }
            if (filters.prix_max) {
                query = query.lte('prix', filters.prix_max);
            }
            if (filters.appellations && Array.isArray(filters.appellations) && filters.appellations.length > 0) {
                query = query.in('appellation', filters.appellations);
            }
            if (filters.domaines && Array.isArray(filters.domaines) && filters.domaines.length > 0) {
                query = query.in('domaine_chateau', filters.domaines);
            }
    
            // Exécuter la requête
            const { data: wines, error } = await query;
    
            if (error) {
                throw new Error('Erreur lors de la récupération des vins : ' + error.message);
            }
    
            // Calculer les scores pour chaque vin fonction des préférences et des poids des couleurs
/* 
Poids des couleurs : Le poids de la couleur (color_weights) est multiplié par 10 pour lui donner une importance significative dans le score total.
Préférences gustatives :
Pour les vins rouges, on multiplie chaque caractéristique de la base de données (rouge_fruite, etc.) par la préférence correspondante (preferences.rouges.fruite, etc.).
Pour les vins blancs, on fait de même avec leurs caractéristiques (blanc_fruite, etc.).
Les valeurs nulles sont gérées avec || 0 pour éviter les erreurs.
Pas de scoring gustatif pour "Bulles" ou "Rosé" car la base de données ne contient pas ces caractéristiques.
*/
            const scoredWines = wines.map(wine => {
                let score = 0;

                // 1. Appliquer le poids de la couleur
                const colorKey = wine.couleur.toLowerCase();
                const colorWeight = color_weights[colorKey] || 0;
                score += colorWeight * 10; // Multiplier pour donner plus de poids à la couleur

                // 2. Calculer le score des préférences selon la couleur
                if (wine.couleur === 'Rouge' && preferences.rouges) {
                    const reds = preferences.rouges;
                    score += (wine.rouge_fruite || 0) * (reds.fruite || 0);
                    score += (wine.rouge_epice || 0) * (reds.epice || 0);
                    score += (wine.rouge_boise || 0) * (reds.boise || 0);
                    score += (wine.rouge_tannique || 0) * (reds.tannique || 0);
                } else if (wine.couleur === 'Blanc' && preferences.blancs) {
                    const whites = preferences.blancs;
                    score += (wine.blanc_fruite || 0) * (whites.fruite || 0);
                    score += (wine.blanc_mineral || 0) * (whites.mineral || 0);
                    score += (wine.blanc_beurre || 0) * (whites.beurre || 0);
                    score += (wine.blanc_boise || 0) * (whites.boise || 0);
                    score += (wine.blanc_sucrosite || 0) * (whites.sucrosite || 0);
                }
                // Note: Pas de caractéristiques gustatives pour Bulles ou Rosé dans la DB

                // 3. Ajouter l'influence de note_wim
                score += wine.note_wim * 10; // Multiplier par 10 pour aligner avec le poids des couleurs

                return { ...wine, score };
            });
                
            // Trier par score décroissant et prendre les 10 premiers
/* Les vins sont triés par score décroissant avec .sort((a, b) => b.score - a.score).
.slice(0, 10) limite le résultat aux 10 premiers vins.
*/
            const sortedWines = scoredWines
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return sortedWines;
        } catch (error) {
            console.error('Erreur dans query_wines :', error);
            throw error;
        }
    }

}

module.exports = new LLMService();