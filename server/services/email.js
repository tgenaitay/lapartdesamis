const { Resend } = require('resend');
const { v4: uuid } = require('uuid');

class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.recipientEmail = process.env.NOTIFICATION_EMAIL;
        this.senderEmail = process.env.SENDER_EMAIL;
    }

    /**
     * Formats form data into a clean, readable string without JSON syntax
     * @param {Object} formData - The form data to format
     * @returns {String} - Formatted form data as a string
     */
    formatFormData(formData) {
        let result = '';
        
        // Helper function to format nested objects
        const formatNestedObject = (obj, indent = '') => {
            let nestedResult = '';
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    nestedResult += `${indent}${key}:\n`;
                    nestedResult += formatNestedObject(value, indent + '  ');
                } else {
                    nestedResult += `${indent}${key}: ${value}\n`;
                }
            }
            return nestedResult;
        };
        
        // Process the top-level keys
        const sortedEntries = Object.entries(formData)
            .sort(([keyA], [keyB]) => {
                const numA = parseInt(keyA);
                const numB = parseInt(keyB);
                return isNaN(numA) || isNaN(numB) ? 0 : numA - numB;
            });
            
        for (const [key, value] of sortedEntries) {
            if (typeof value === 'object' && value !== null) {
                result += `${key}\n`;
                result += formatNestedObject(value, '  ');
            } else {
                result += `${key} ${value}\n`;
            }
        }
        
        return result;
    }

    /**
     * Sends a notification email when a new form is submitted
     * @param {Object} formData - The form data submitted by the user
     * @param {Array} wineSelection - The wine selection generated by the LLM
     * @returns {Promise<Object>} - The result of the email sending operation
     */
    async sendSubmissionNotification(formData, wineSelection) {
        try {
            // Format the form data for email in a clean, readable format
            const formDataFormatted = this.formatFormData(formData);
            
            // Format the wine selection for email
            const wineSelectionFormatted = wineSelection.map((wine, index) => {
                return `${index + 1}. ${wine.domaine_chateau} - ${wine.appellation} (${wine.couleur}) - ${wine.prix}€`;
            }).join('\n');
            
            // Create email content
            const emailContent = `
                <h1>Un nouveau formulaire La Part des Amis a été rempli 🎉 </h1>
                <p>Voici ce que nous avons obtenu</p>
                
                <h2>Sélection (${wineSelection.length} vins):</h2>
                <pre>${wineSelectionFormatted}</pre>
                
                <h2>Données client:</h2>
                <pre>${formDataFormatted}</pre>
            `;
            
            // Send the email
            const { data, error } = await this.resend.emails.send({
                from: this.senderEmail,
                to: this.recipientEmail,
                subject: 'Nouvelle entrée dans le formulaire La Part des Amis',
                html: emailContent,
                headers: {
                    'X-Entity-Ref-ID': uuid(),
                  },
            });
            
            if (error) {
                console.error('Error sending email notification:', error);
                return { error };
            }
            
            console.log('Email notification sent successfully:', data);
            return { data };
        } catch (error) {
            console.error('Error in email service:', error);
            return { error };
        }
    }

    /**
     * Sends the wine selection to a customer's email
     * @param {string} email - The customer's email address
     * @param {string} submissionId - The ID of the form submission
     * @returns {Promise<Object>} - The result of the email sending operation
     */
    async sendWineSelection(email, submissionId) {
        try {
            // Get the wine selection from storage
            const { data, error: storageError } = await require('./storage').getWineSelection(submissionId);
            
            if (storageError) {
                console.error('Error fetching wine selection for email:', storageError);
                return { error: storageError };
            }
            
            if (!data || data.length === 0) {
                console.error('No wine selection found for submission ID:', submissionId);
                return { error: 'No wine selection found' };
            }
            
            // Format the wine selection for email
            const wineSelectionFormatted = data.map((wine, index) => {
                return `${index + 1}. ${wine.domaine_chateau} - ${wine.appellation} (${wine.couleur}) - ${wine.prix}€`;
            }).join('\n');
            
            // Create email content
            const emailContent = `
                <h1>Votre sélection personnalisée La Part des Amis 🍷</h1>
                <p>Merci pour votre intérêt! Voici la sélection de vins que nous avons préparée spécialement pour vous.</p>
                
                <h2>Votre sélection (${data.length} vins):</h2>
                <div style="white-space: pre-wrap;">${wineSelectionFormatted}</div>
                
                <p>Pour discuter de cette sélection ou pour obtenir plus d'informations, n'hésitez pas à prendre rendez-vous avec nous :</p>
                <p><a href="https://calendar.app.google/32uARJEajwA6bkH1A" style="display: inline-block; background-color: #8B0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Prendre rendez-vous</a></p>
                
                <p>À bientôt !</p>
                <p>L'équipe La Part des Amis</p>
            `;
            
            // Send the email
            const { data: emailData, error } = await this.resend.emails.send({
                from: this.senderEmail,
                to: email,
                subject: 'Votre sélection personnalisée La Part des Amis',
                html: emailContent,
                headers: {
                    'X-Entity-Ref-ID': uuid(),
                },
            });
            
            if (error) {
                console.error('Error sending wine selection email:', error);
                return { error };
            }
            
            console.log('Wine selection email sent successfully to:', email);
            return { data: emailData };
        } catch (error) {
            console.error('Error in email service:', error);
            return { error };
        }
    }
}

module.exports = new EmailService();