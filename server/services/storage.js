const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Stores form submission data and LLM selection in Supabase
 * @param {Object} formData - The form data submitted by the user
 * @param {Object} llmSelection - The selection made by the LLM
 * @returns {Promise<Object>} - The result of the database operation
 */
async function storeFormSubmission(formData, llmSelection) {
    try {
        // Create a record with form data and LLM selection
        const submission = {
            form_data: formData,
            llm_selection: llmSelection,
            submitted_at: new Date().toISOString(),
            client: formData.Email || null
        };
        
        return await supabase
            .from('forms')
            .insert(submission)
            .select();
    } catch (error) {
        console.error('Supabase storage error:', error);
        return { error };
    }
}

/**
 * Updates a form submission with the client's email
 * @param {string} submissionId - The ID of the form submission
 * @param {string} clientEmail - The email of the client
 * @returns {Promise<Object>} - The result of the database operation
 */

async function updateSubmissionWithClientEmail(submissionId, clientEmail) {
    try {
        const { data, error } = await supabase
           .from('forms')
           .update({ client: clientEmail })
           .eq('id', submissionId)
           .select();
        if (error) throw error;
        return { data };
    } catch (error) {
        console.error('Error updating submission with client email:', error);
        return { error };
    }
}

/**
 * Fetches wine selection data by submission ID
 * @param {string} submissionId - The ID of the form submission
 * @returns {Promise<Object>} - The wine selection data
 */
async function getWineSelection(submissionId) {
    try {
        const { data, error } = await supabase
            .from('forms')
            .select('llm_selection')
            .eq('id', submissionId)
            .single();

        if (error) throw error;
        return { data: data.llm_selection };
    } catch (error) {
        console.error('Error fetching wine selection:', error);
        return { error };
    }
}

module.exports = {
    storeFormSubmission,
    getWineSelection,
    updateSubmissionWithClientEmail
};