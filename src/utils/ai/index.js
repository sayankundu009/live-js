export const models = {
    quality: 'gemini-2.0-flash',
    fast: 'gemini-2.0-flash-lite-preview-02-05',
}

export async function generateText(prompt, model = models.quality) {
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt, }] }],
        }),
    }).then((response) => response.json()).then((data) => {
        const result = data.candidates[0].content.parts[0].text;

        return result;
    });
}

export async function generateCode({message, context, selection}){
    const prompt = `
    You are a senior software engineer with expertise in JavaScript and modern web development.
    You are given a message containing a request and a file with existing code context.
    Your task is to generate a code solution that:
    1. Solves the requested problem effectively
    2. Follows JavaScript best practices and conventions
    3. Is clean, readable and well-documented
    4. Uses 2 tabs for indentation
    5. Uses modern JavaScript features when appropriate
    6. Handles edge cases and errors gracefully
    7. Always make to code readable and easy to understand
    8. Never remove any existing code unless it is to fix an error or improve the code
    9. Use comments to explain the code if needed, keep them minimal and concise

    Please provide only the code solution without explanations.
    
    <file>
        ${context}
    </file>

    ${selection ? `<selection>
        <start>${selection.start}</start>
        <end>${selection.end}</end>
        <text>${selection.text}</text>
    </selection>` : ''}

    <message>
        ${message}
    </message>

    <example-response>
        <message>
            Create bubble sort algorithm
        </message>

        <file>
            
        </file>

        <code>
            function bubbleSort(array) {
                const arrayLength = array.length;

                for (let i = 0; i < arrayLength - 1; i++) {
                    for (let j = 0; j < arrayLength - i - 1; j++) {
                        // Compare adjacent elements
                        if (array[j] > array[j + 1]) {
                            // Swap if they are in the wrong order
                            [array[j], array[j + 1]] = [array[j + 1], array[j]];
                        }
                    }
                }
                    
                return array;
            }
        </code>
    </example-response>

    <example-response>
        <message>
            Call the function 
        </message>

        <file>
             function bubbleSort(array) {
                const arrayLength = array.length;

                for (let i = 0; i < arrayLength - 1; i++) {
                    for (let j = 0; j < arrayLength - i - 1; j++) {
                        // Compare adjacent elements
                        if (array[j] > array[j + 1]) {
                            // Swap if they are in the wrong order
                            [array[j], array[j + 1]] = [array[j + 1], array[j]];
                        }
                    }
                }
                    
                return array;
            }
        </file>

        <code>
            function bubbleSort(array) {
                const arrayLength = array.length;

                for (let i = 0; i < arrayLength - 1; i++) {
                    for (let j = 0; j < arrayLength - i - 1; j++) {
                        // Compare adjacent elements
                        if (array[j] > array[j + 1]) {
                            // Swap if they are in the wrong order
                            [array[j], array[j + 1]] = [array[j + 1], array[j]];
                        }
                    }
                }
                    
                return array;
            }

            const unsortedArray = [64, 34, 25, 12, 22, 11, 90];
            console.log(unsortedArray);

            const sortedArray = bubbleSort(unsortedArray);
            console.log(sortedArray);
        </code>
    </example-response>
    
    Always respond with the result wrapped in <code> tags.
    The code inside <code> tags should:
    - Be properly formatted and indented
    - Be valid, runnable JavaScript
    - Include any necessary imports and setup
    - Follow JavaScript best practices and conventions
    - Be complete and self-contained
    Do not include:
    - Markdown
    - Code blocks with backticks
    - Explanations or text outside the <code> tags
    - Multiple code examples or variations
    `.trim();
    const result = await generateText(prompt);
    
    const match = result.match(/<code>(.*?)<\/code>/s);

    if (!match) {
      throw new Error('No code block found');
    }

    const code = match[1].trim();

    return code;
}
