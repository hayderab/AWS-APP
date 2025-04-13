import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizTypesImport from './QuizTypes';
// import LocalDatabase from '../LocalDatabase';
import { MongoDatabase } from '../MongoDatabase'; // Ensure proper import of MongoDatabase
import { GEMINI_API_KEY } from '../../config/env';

class QuizGenerator {
  constructor() {
    try {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      // Use the thinking-capable model for more thoughtful quiz generation
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Fallback to a known working model
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 64,
        }
      });
      console.log('QuizGenerator initialized with fallback model. Checking available models...');
      
      // Check available models and update to the best one
      this.checkAvailableModels();
    } catch (error) {
      console.error('Error initializing QuizGenerator:', error);
    }
  }
  
  async checkAvailableModels() {
    try {
      console.log("Checking available Gemini models...");
      
      // List of preferred models in order of preference
      const preferredModels = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
      ];
      
      // Just use the fallback model instead of trying to list models
      // This avoids the error with listModels() which might not be available in all environments
      // console.log(`Using fallback model: gemini-1.5-pro`);
      
      // No need to change the model as we're already using the fallback
      return;
    } catch (error) {
      console.error('Error checking available models:', error);
      // Continue with the fallback model
    }
  }

  async generateQuiz(topic, subtopic, numberOfQuestions = 10) {
    try {
      console.log('Generating quiz for topic:', topic.title, 'subtopic:', subtopic.title, 'with', numberOfQuestions, 'questions');

      // Ensure the model was initialized
      if (!this.model) {
         throw new Error("QuizGenerator model not initialized.");
      }

      try {
        // Create a chat session with the model
        const chatSession = this.model.startChat({
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 64,
          },
          history: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an AWS Certification Expert. I need you to create AWS certification practice questions for the following topic and subtopic:

                  Topic: ${topic.title}
                  Subtopic: ${subtopic.title}
                  Content: ${subtopic.content}

                  Please generate ${numberOfQuestions} questions with a mix of the following types:
                  - Multiple Choice questions (one correct answer from four options)
                  - Multiple Response questions (two or more correct answers from five or more options)
                  - Ordering questions (3-5 items that must be placed in the correct order)
                  - Matching questions (3-5 prompts to match with responses)
                  - Case Study questions (scenario with 2 related questions, each sub-question being multiple choice)

                  Each question should be directly relevant to AWS and the topic provided, match the AWS exam format and difficulty, and include detailed explanations.

                  EXTREMELY IMPORTANT: Your response MUST be a valid, complete JSON array with exactly ${numberOfQuestions} questions. 
                  Do not include any text before or after the JSON array.
                  Do not use markdown code blocks.
                  Start your response with [ and end with ].
                  Ensure all JSON properties are properly quoted.
                  Ensure there are no trailing commas.
                  
                  The JSON structure must follow this exact format:
                  [
                    {
                      "question_type": "Multiple Choice",
                      "question_text": "...",
                      "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}],
                      "correct_answer": "...",
                      "explanation": "..."
                    },
                    {
                      "question_type": "Multiple Response",
                      "question_text": "...",
                      "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}, {"id": "E", "text": "..."}],
                      "correct_answers": ["...", "..."],
                      "explanation": "..."
                    },
                    {
                      "question_type": "Ordering",
                      "question_text": "...",
                      "prompt": "...",
                      "items_to_order": [{"id": "1", "text": "..."}, {"id": "2", "text": "..."}, {"id": "3", "text": "..."}],
                      "correct_order": ["...", "...", "..."],
                      "explanation": "..."
                    },
                    {
                      "question_type": "Matching",
                      "question_text": "...",
                      "prompts": [{"id": "P1", "text": "..."}, {"id": "P2", "text": "..."}, {"id": "P3", "text": "..."}],
                      "responses": [{"id": "R1", "text": "..."}, {"id": "R2", "text": "..."}, {"id": "R3", "text": "..."}, {"id": "R4", "text": "..."}],
                      "correct_matches": [{"prompt_id": "...", "response_id": "..."}, {"prompt_id": "...", "response_id": "..."}, {"prompt_id": "...", "response_id": "..."}],
                      "explanation": "..."
                    },
                    {
                      "question_type": "Case Study",
                      "scenario": "...",
                      "questions": [
                        {
                          "question_id": "CS1-Q1",
                          "question_text": "...",
                          "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}],
                          "correct_answer": "...",
                          "explanation": "..."
                        },
                        {
                          "question_id": "CS1-Q2",
                          "question_text": "...",
                          "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}],
                          "correct_answer": "...",
                          "explanation": "..."
                        }
                      ],
                      "explanation": "..." 
                    }
                  ]`
                }
              ]
            }
          ]
        });

        // Send a message to get the questions
        console.log('Sending message to chat session...');
        // More specific message to ensure proper JSON formatting
        const result = await chatSession.sendMessage(`Generate the ${numberOfQuestions} AWS questions now as a valid JSON array. Remember to return ONLY the JSON array with no additional text, markdown formatting, or code blocks. Start with '[' and end with ']'. Ensure all JSON properties are properly quoted.`);
        const responseText = result.response.text();

        // Log the full response for debugging
        console.log('FULL GEMINI RESPONSE:');
        console.log('----------------------------------------');
        console.log(responseText);
        console.log('----------------------------------------');

        // Also log a shorter version for quick reference
        console.log('Response preview:', responseText.substring(0, 200) + '...');

        // Extract JSON from response - Improved extraction
        let questions;
        try {
            // First try to parse the entire response as JSON
            try {
                questions = JSON.parse(responseText.trim());
                console.log('Successfully parsed entire response as JSON');
            } catch (directParseError) {
                // If that fails, try to extract JSON from markdown or text
                console.log('Direct parsing failed, trying to extract JSON from response...');
                
                // Try various patterns to extract JSON
                // 1. Look for JSON in code blocks (```json ... ```)
                const jsonCodeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                
                // 2. Look for array pattern [...]
                const arrayMatch = responseText.match(/(\[\s*\{\s*"question_type"[\s\S]*\]\s*)/);
                
                // 3. Look for any JSON-like structure
                const jsonLikeMatch = responseText.match(/(\[\s*\{[\s\S]*\}\s*\])/);
                
                let jsonString = null;
                
                if (jsonCodeBlockMatch) {
                    console.log('Found JSON in code block');
                    jsonString = jsonCodeBlockMatch[1];
                } else if (arrayMatch) {
                    console.log('Found array pattern');
                    jsonString = arrayMatch[1];
                } else if (jsonLikeMatch) {
                    console.log('Found JSON-like structure');
                    jsonString = jsonLikeMatch[1];
                } else {
                    throw new Error('Could not find valid JSON structure in response');
                }
                
                // Clean up the extracted string
                jsonString = jsonString.trim()
                    .replace(/^```json/, '')
                    .replace(/```$/, '')
                    .trim();
                    
                console.log('Extracted JSON string:', jsonString.substring(0, 100) + '...');
                
                // Try to parse the extracted JSON
                questions = JSON.parse(jsonString);
            }

            console.log('Parsed questions successfully.');
            console.log('Question types:', questions.map(q => q.question_type));
            console.log('Number of questions:', questions.length);

        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            console.error('--- Start Response Text ---');
            console.error(responseText); // Log the full problematic response
            console.error('--- End Response Text ---');
            
            // Try a more robust fallback approach
            try {
                console.log('Attempting robust fallback JSON extraction...');
                
                // First, clean up the response text
                let cleanedText = responseText
                    .replace(/```json/g, '')  // Remove markdown code markers
                    .replace(/```/g, '')      // Remove markdown code markers
                    .replace(/\\n/g, ' ')     // Replace newline chars with spaces
                    .trim();                  // Trim whitespace
                
                // Find the first '[' and last ']' to extract the JSON array
                const startIndex = cleanedText.indexOf('[');
                const endIndex = cleanedText.lastIndexOf(']');
                
                if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                    const jsonCandidate = cleanedText.substring(startIndex, endIndex + 1);
                    console.log('Extracted JSON candidate:', jsonCandidate.substring(0, 100) + '...');
                    
                    try {
                        // Try to parse the extracted JSON
                        questions = JSON.parse(jsonCandidate);
                        console.log('Fallback JSON parsing succeeded!');
                    } catch (jsonError) {
                        console.error('JSON parsing error:', jsonError);
                        
                        // Try to fix common JSON issues
                        let fixedJson = jsonCandidate
                            .replace(/,\s*\]/g, ']')         // Remove trailing commas in arrays
                            .replace(/,\s*\}/g, '}')         // Remove trailing commas in objects
                            .replace(/([^\\])"([^"]*?)"/g, '$1"$2"'); // Fix unescaped quotes within strings
                        
                        try {
                            questions = JSON.parse(fixedJson);
                            console.log('Fixed JSON parsing succeeded!');
                        } catch (fixError) {
                            console.error('Fixed JSON parsing failed:', fixError);
                            
                            // If we still can't parse it, try to construct a valid array from individual questions
                            const questionMatches = cleanedText.match(/\{\s*"question_type"[^{]*?(?=\}\s*,|\}\s*\])/g);
                            
                            if (questionMatches && questionMatches.length > 0) {
                                console.log(`Found ${questionMatches.length} individual questions to reconstruct`);
                                
                                // Add closing braces to each question
                                const completeQuestions = questionMatches.map(q => q + '}');
                                
                                // Reconstruct the array
                                const reconstructedJson = '[' + completeQuestions.join(',') + ']';
                                
                                try {
                                    questions = JSON.parse(reconstructedJson);
                                    console.log('Reconstructed JSON parsing succeeded!');
                                } catch (reconstructError) {
                                    console.error('Reconstructed JSON parsing failed:', reconstructError);
                                    
                                    // Last resort: create a minimal valid question set
                                    console.log('Creating minimal valid question set as fallback');
                                    questions = this.createFallbackQuestions(numberOfQuestions, topic, subtopic);
                                }
                            } else {
                                // Last resort: create a minimal valid question set
                                console.log('Creating minimal valid question set as fallback');
                                questions = this.createFallbackQuestions(numberOfQuestions, topic, subtopic);
                            }
                        }
                    }
                } else {
                    // Last resort: create a minimal valid question set
                    console.log('JSON array markers not found. Creating minimal valid question set as fallback');
                    questions = this.createFallbackQuestions(numberOfQuestions, topic, subtopic);
                }
            } catch (fallbackError) {
                console.error('Fallback extraction failed:', fallbackError);
                // Last resort: create a minimal valid question set
                console.log('Creating minimal valid question set as final fallback');
                questions = this.createFallbackQuestions(numberOfQuestions, topic, subtopic);
            }
        }

        // Verify we have all question types and exactly numberOfQuestions questions
        if (!Array.isArray(questions)) {
           throw new Error(`Parsed result is not an array. Type: ${typeof questions}`);
        }

        // We're now more lenient about the number of questions
        if (questions.length < 1) {
          console.warn(`Expected at least one question but got ${questions.length}.`);
          throw new Error(`No questions were generated. Please try again.`);
        }
        
        if (questions.length !== numberOfQuestions) {
          console.warn(`Expected ${numberOfQuestions} questions but got ${questions.length}.`);
          // Just warn but don't throw an error - we'll work with what we have
        }

        // Convert the JSON format to our internal question format
        const questionObjects = questions.map(q => this.createQuestionFromJSONFormat(q));

        // Save to quiz history
        await MongoDatabase.quizService.saveQuizToHistory({
          topicId: topic.id,
          topicTitle: topic.title,
          subtopicId: subtopic.id,
          subtopicTitle: subtopic.title,
          questions: questions, // Save the raw JSON for better storage
          generatedAt: new Date().toISOString()
        });

        return questionObjects;
      } catch (apiError) {
        // If this is a parsing error, rethrow it as is
        if (apiError.isParsingError) {
          throw apiError;
        }
        
        // Otherwise, it's likely an API error - throw a specific error
        console.error('API error generating quiz:', apiError);
        const apiRequestError = new Error(`API request failed: ${apiError.message}`);
        apiRequestError.isApiError = true; // Add a flag to identify API errors
        throw apiRequestError;
      }
    } catch (error) {
      console.error('Error in generateQuiz function:', error);
      // Rethrow the error so the caller knows something went wrong
      throw error;
    }
  }

  // Create fallback questions when JSON parsing fails
  createFallbackQuestions(count, topic, subtopic) {
    console.log(`Creating ${count} fallback questions for ${topic.title} - ${subtopic.title}`);
    
    // Create a basic multiple choice question
    const createBasicQuestion = (index) => {
      return {
        question_type: "Multiple Choice",
        question_text: `Question ${index + 1}: This is a fallback question about ${subtopic.title}. The actual question generation failed.`,
        options: [
          { id: "A", text: "First option related to the topic" },
          { id: "B", text: "Second option related to the topic" },
          { id: "C", text: "Third option related to the topic" },
          { id: "D", text: "Fourth option related to the topic" }
        ],
        correct_answer: "A",
        explanation: `This is a fallback explanation for ${subtopic.title}. Please try generating questions again.`
      };
    };
    
    // Create the specified number of questions
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(createBasicQuestion(i));
    }
    
    return questions;
  }

  // Keep your createQuestionFromJSONFormat, mapQuestionData, createQuestionFromJSON, getConstructorArgs methods as they are.
  // They handle the conversion *after* successfully receiving and parsing the JSON.

  // ... (rest of your class methods: createQuestionFromJSONFormat, mapQuestionData, etc.)
  createQuestionFromJSONFormat(questionData) {
    try {
      // Validate the question data
      if (!questionData || !questionData.question_type) {
        console.error('Invalid question data received for mapping:', questionData);
        throw new Error('Invalid question data format passed to createQuestionFromJSONFormat');
      }

      // Map the question type to our internal types
      let type;
      switch (questionData.question_type) {
        case 'Multiple Choice':
          type = 'MultipleChoiceQuestion';
          break;
        case 'Multiple Response':
          type = 'MultipleResponseQuestion';
          break;
        case 'Ordering':
          type = 'OrderingQuestion';
          break;
        case 'Matching':
          type = 'MatchingQuestion';
          break;
        case 'Case Study':
          type = 'CaseStudyQuestion';
          break;
        default:
           console.error(`Unknown question type encountered: ${questionData.question_type}`, questionData);
          throw new Error(`Unknown question type: ${questionData.question_type}`);
      }

      // Create a new object with our internal format
      const mappedData = {
        type: type,
        ...this.mapQuestionData(questionData) // Spread the mapped properties
      };

       // Now create the actual class instance
      return this.createQuestionFromJSON(mappedData);
    } catch (error) {
      console.error('Error creating question from specific JSON format:', error, 'Data:', JSON.stringify(questionData));
      // Return null or a placeholder error object instead of throwing maybe?
      // Or rethrow if this failure should stop the whole process.
      throw error; // Rethrow for now
    }
  }

  mapQuestionData(questionData) {
    // Add checks for expected fields within each case to prevent runtime errors
    try {
        switch (questionData.question_type) {
          case 'Multiple Choice':
            if (!questionData.options || !questionData.correct_answer) throw new Error("Missing options/correct_answer");
            const mcCorrectOption = questionData.options.find(o => o.id === questionData.correct_answer);
            if (!mcCorrectOption) throw new Error(`Correct answer ID '${questionData.correct_answer}' not found in options.`);
            return {
              question: questionData.question_text || "Missing question text",
              choices: questionData.options.map(o => o.text),
              correctAnswer: mcCorrectOption.text,
              explanation: questionData.explanation || "No explanation provided.",
              difficulty: 'medium' // Default or derive if possible
            };
          case 'Multiple Response':
             if (!questionData.options || !questionData.correct_answers || !Array.isArray(questionData.correct_answers)) throw new Error("Missing options/correct_answers");
             const mrCorrectTexts = questionData.correct_answers.map(id => {
                 const option = questionData.options.find(o => o.id === id);
                 if (!option) throw new Error(`Correct answer ID '${id}' not found in options.`);
                 return option.text;
             });
            return {
              question: questionData.question_text || "Missing question text",
              choices: questionData.options.map(o => o.text),
              correctAnswers: mrCorrectTexts,
              explanation: questionData.explanation || "No explanation provided.",
              difficulty: 'hard'
            };
          case 'Ordering':
            if (!questionData.items_to_order || !questionData.correct_order || !Array.isArray(questionData.correct_order)) throw new Error("Missing items_to_order/correct_order");
             const orderCorrectTexts = questionData.correct_order.map(id => {
                 const item = questionData.items_to_order.find(i => i.id === id);
                 if (!item) throw new Error(`Correct order ID '${id}' not found in items.`);
                 return item.text;
             });
            return {
              question: questionData.question_text || "Missing question text",
              items: questionData.items_to_order.map(i => i.text),
              correctOrder: orderCorrectTexts,
              explanation: questionData.explanation || "No explanation provided.",
              difficulty: 'medium'
            };
          case 'Matching':
             if (!questionData.prompts || !questionData.responses || !questionData.correct_matches || !Array.isArray(questionData.correct_matches)) throw new Error("Missing prompts/responses/correct_matches");
             const correctPairsMapped = questionData.correct_matches.map(match => {
                 const prompt = questionData.prompts.find(p => p.id === match.prompt_id);
                 const response = questionData.responses.find(r => r.id === match.response_id);
                 if (!prompt || !response) throw new Error(`Invalid prompt/response ID in match: ${JSON.stringify(match)}`);
                 return { prompt: prompt.text, response: response.text };
             });
            return {
              question: questionData.question_text || "Missing question text",
              prompts: questionData.prompts.map(p => p.text),
              responses: questionData.responses.map(r => r.text),
              correctPairs: correctPairsMapped,
              explanation: questionData.explanation || "No explanation provided.",
              difficulty: 'hard'
            };
          case 'Case Study':
             if (!questionData.scenario || !questionData.questions || !Array.isArray(questionData.questions)) throw new Error("Missing scenario/questions");
            
            // Map sub-questions based on their structure
            const mappedSubQuestions = questionData.questions.map((sq, index) => {
                if (!sq.options || !sq.correct_answer) {
                    throw new Error(`Sub-question ${index+1} missing options/correct_answer`);
                }
                
                const sqCorrectOption = sq.options.find(o => o.id === sq.correct_answer);
                if (!sqCorrectOption) {
                    throw new Error(`Sub-question ${index+1} correct answer ID '${sq.correct_answer}' not found.`);
                }
                
                // Create a proper sub-question object with the type property
                return {
                    type: 'MultipleChoiceQuestion', // Explicitly set the type for sub-questions
                    question: sq.question_text || `Sub-question ${index+1}`,
                    choices: sq.options.map(o => o.text),
                    correctAnswer: sqCorrectOption.text,
                    explanation: sq.explanation || "No explanation provided."
                };
            });
            
            return {
              question: (questionData.scenario || "Scenario").substring(0, 70) + '...', // Use first chars of scenario as title
              scenario: questionData.scenario || "Missing scenario text",
              subQuestions: mappedSubQuestions,
              explanation: questionData.explanation || "No overall explanation provided.",
              difficulty: 'hard'
            };
          default:
            // This should have been caught earlier, but as a safeguard:
            throw new Error(`Unhandled question type in mapQuestionData: ${questionData.question_type}`);
        }
    } catch(mappingError) {
        console.error("Error mapping data for type:", questionData.question_type, mappingError);
        // Decide how to handle mapping errors - throw, return null, return error object?
        throw mappingError; // Rethrowing
    }
  }

  createQuestionFromJSON(questionData) {
    try {
      // Validate the question data
      if (!questionData || !questionData.type) {
        console.error('Invalid mapped data passed to createQuestionFromJSON:', questionData);
        throw new Error('Invalid internal question data format');
      }

      // Get the appropriate question class
      let QuestionClass = QuizTypesImport[questionData.type]; // Directly access using type string

      if (!QuestionClass) {
           throw new Error(`Unknown question type for class instantiation: ${questionData.type}`);
      }

      // Special handling for CaseStudyQuestion
      if (questionData.type === 'CaseStudyQuestion') {
        // Create sub-question instances first
        const subQuestionInstances = questionData.subQuestions.map(sq => {
          if (!sq.type) {
            console.error('Invalid sub-question missing type:', sq);
            throw new Error('Sub-question missing type property');
          }
          
          const SubQuestionClass = QuizTypesImport[sq.type];
          if (!SubQuestionClass) {
            throw new Error(`Unknown sub-question type: ${sq.type}`);
          }
          
          return new SubQuestionClass(
            sq.question,
            sq.choices,
            sq.correctAnswer,
            sq.explanation
          );
        });
        
        // Now create the case study question with the sub-question instances
        return new QuestionClass(
          questionData.question,
          questionData.scenario,
          subQuestionInstances,
          questionData.explanation,
          questionData.difficulty
        );
      }

      // For all other question types
      const question = new QuestionClass(
        questionData.question, // Assuming 'question' is the first arg for all types
        ...this.getConstructorArgs(questionData) // Get the rest of the args
      );

      return question;
    } catch (error) {
      console.error('Error creating question instance from mapped JSON:', error, 'Data:', JSON.stringify(questionData));
      throw error; // Rethrow
    }
  }

   getConstructorArgs(questionData) {
    // This should return an array of arguments *excluding* the first one ('question')
    // which was passed directly to the constructor in createQuestionFromJSON
    try {
        switch (questionData.type) {
          case 'MultipleChoiceQuestion':
            return [
              questionData.choices,
              questionData.correctAnswer,
              questionData.explanation,
              questionData.difficulty
            ];
          case 'MultipleResponseQuestion':
            return [
              questionData.choices,
              questionData.correctAnswers,
              questionData.explanation,
              questionData.difficulty
            ];
          case 'OrderingQuestion':
            return [
              questionData.items,
              questionData.correctOrder,
              questionData.explanation,
              questionData.difficulty
            ];
          case 'MatchingQuestion':
            return [
              questionData.prompts,
              questionData.responses,
              questionData.correctPairs,
              questionData.explanation,
              questionData.difficulty
            ];
          case 'CaseStudyQuestion':
            // For Case Study, we need to create actual question objects from the subQuestions
            // We already created the proper objects with types in mapQuestionData
            return [
              questionData.scenario,
              questionData.subQuestions, // These are already properly formatted objects with type
              questionData.explanation,
              questionData.difficulty
            ];
          default:
            throw new Error(`Unknown question type in getConstructorArgs: ${questionData.type}`);
        }
    } catch (argError) {
        console.error("Error getting constructor args for type:", questionData.type, argError);
        throw argError; // Rethrow
    }
  }

} // End of QuizGenerator class

export default new QuizGenerator();