/**
 * Gemini API integration for Unstuck
 * Handles task breakdown requests to Google's Gemini 3.0 Flash Preview model
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

/**
 * The prompt template for breaking down tasks
 * This is kept visible for transparency - users can see how their tasks are processed
 */
const BREAKDOWN_PROMPT = `You are helping someone with task paralysis break down an overwhelming task into manageable steps.

## Rules

1. **Each step must be completable in 15 minutes or less**
2. **Step 1 must be TRIVIALLY easy** - lower the activation energy to almost zero
3. **Be specific and concrete** - no vague advice like "make a plan"
4. **No decisions in step 1** - just simple physical action
5. **Use physical action verbs**: grab, open, write, walk, type, click
6. **5-7 steps maximum** - more than that is overwhelming
7. **Acknowledge the emotional reality** - this person is stuck, be kind

## Output Format

Return valid JSON only, no markdown formatting:

{
  "task_summary": "Brief 3-5 word summary of the task",
  "steps": [
    "Step 1 description - the easiest possible starting action",
    "Step 2 description",
    "Step 3 description",
    "Step 4 description",
    "Step 5 description"
  ],
  "encouragement": "One brief encouraging sentence"
}

## Examples of Good First Steps

- "Open a new Google Doc and type today's date at the top"
- "Get your phone and set a 15-minute timer"
- "Walk to where you keep [item] and put it on your desk"
- "Open [app/website] - don't do anything yet, just open it"
- "Grab a piece of paper and a pen"

## Examples of Bad First Steps (too much activation energy)

- "Make a list of everything you need to do" (requires thinking)
- "Decide which approach to take" (requires decision)
- "Research the best way to..." (open-ended)
- "Organize your materials" (vague)

---

Task the user is stuck on:
`;

/**
 * Error types for better user messaging
 */
export const ErrorType = {
  INVALID_KEY: 'INVALID_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Get a user-friendly error message
 * @param {string} errorType
 * @param {string} details
 * @returns {string}
 */
export function getErrorMessage(errorType, details = '') {
  switch (errorType) {
    case ErrorType.INVALID_KEY:
      return `That API key doesn't seem to work. Double-check it at:\nhttps://aistudio.google.com/apikey\n\n(Error: ${details})`;

    case ErrorType.RATE_LIMITED:
      return "Google's servers are busy. Wait a moment and try again.\n\nThis usually resolves in a few seconds.";

    case ErrorType.NETWORK_ERROR:
      return "Couldn't connect. Check your internet connection and try again.";

    case ErrorType.PARSE_ERROR:
      return "Got an unexpected response. Please try again.\n\nIf this keeps happening, the task description might need to be clearer.";

    default:
      return `Something went wrong. Please try again.\n\n(Error: ${details})`;
  }
}

/**
 * Build the full prompt with user input
 * @param {string} userTask - What the user is stuck on
 * @returns {string}
 */
export function buildPrompt(userTask) {
  return BREAKDOWN_PROMPT + userTask;
}

/**
 * Parse the JSON response from Gemini
 * @param {string} text - Raw response text
 * @returns {object} Parsed task breakdown
 * @throws {Error} If parsing fails
 */
function parseResponse(text) {
  // Clean up the response - remove markdown code blocks if present
  let cleaned = text.trim();

  // Remove ```json and ``` if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  // Validate the response structure
  if (!parsed.task_summary || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error('Invalid response structure');
  }

  return {
    taskSummary: parsed.task_summary,
    steps: parsed.steps,
    encouragement: parsed.encouragement || "You've got this!"
  };
}

/**
 * Call the Gemini API to break down a task
 * @param {string} userTask - Description of what the user is stuck on
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<{taskSummary: string, steps: string[], encouragement: string}>}
 * @throws {Error} With errorType property for categorized errors
 */
export async function breakdownTask(userTask, apiKey) {
  const prompt = buildPrompt(userTask);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const error = new Error(errorMessage);
        error.errorType = ErrorType.INVALID_KEY;
        throw error;
      }

      if (response.status === 429) {
        const error = new Error('Rate limited');
        error.errorType = ErrorType.RATE_LIMITED;
        throw error;
      }

      const error = new Error(errorMessage);
      error.errorType = ErrorType.UNKNOWN;
      throw error;
    }

    const data = await response.json();

    // Extract the text from Gemini's response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const error = new Error('Empty response from API');
      error.errorType = ErrorType.PARSE_ERROR;
      throw error;
    }

    return parseResponse(text);

  } catch (error) {
    // Network errors (no internet, DNS failure, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network request failed');
      networkError.errorType = ErrorType.NETWORK_ERROR;
      throw networkError;
    }

    // JSON parse errors
    if (error instanceof SyntaxError) {
      const parseError = new Error('Failed to parse response');
      parseError.errorType = ErrorType.PARSE_ERROR;
      throw parseError;
    }

    // Re-throw errors that already have an errorType
    if (error.errorType) {
      throw error;
    }

    // Unknown errors
    error.errorType = ErrorType.UNKNOWN;
    throw error;
  }
}

/**
 * Validate an API key by making a minimal request
 * @param {string} apiKey
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "ok"' }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}
