import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { GEMINI_API_KEY, USE_GEMINI_API } from '../config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Processes a PDF file using Google Gemini API to extract topics and subtopics
 * @param {string} fileUri - The URI of the PDF file
 * @param {string} fileName - The name of the PDF file
 * @returns {Promise<Object>} - The processed certification data
 */
const processPdfWithGemini = async (fileUri, fileName) => {
  try {
    // Check if we should use the Gemini API or fallback to mock data
    if (!USE_GEMINI_API || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
      console.log('Using mock data (Gemini API disabled or no valid API key)');
      return getMlCertificationData(fileName.replace('.pdf', ''));
    }

    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Get file as base64
    const base64Content = await FileSystem.readAsStringAsync(fileUri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Get the model - using a stable model that's definitely available
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // Using a stable model that's definitely available
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192
      }
    });
    
    const certificationName = fileName.replace('.pdf', '');
    
    const prompt = `
      I have an AWS certification guide for "${certificationName}". 
      Please analyze this certification and provide me with:
      
      1. A list of 5-7 main topics that would be covered in this certification
      2. For each topic, provide 2-3 subtopics
      3. For each subtopic, provide a brief content description and 1-2 relevant resources
      
      Format the response as a JSON object with the following structure:
      {
        "title": "Certification Title",
        "topics": [
          {
            "id": "unique-id",
            "title": "Topic Title",
            "description": "Topic Description",
            "subtopics": [
              {
                "id": "unique-subtopic-id",
                "title": "Subtopic Title",
                "content": "Subtopic Content Description",
                "resources": [
                  { "name": "Resource Name", "url": "Resource URL" }
                ],
                "videoLinks": [
                  { "name": "Video Name", "url": "Video URL" }
                ]
              }
            ]
          }
        ]
      }
      
      Respond only with the JSON object, no additional text.
    `;
    
    // Create a file part from the base64 content
    const filePart = {
      inlineData: {
        data: base64Content,
        mimeType: "application/pdf"
      }
    };
    
    // Create the content parts array with the prompt and file
    const parts = [
      { text: prompt },
      filePart
    ];
    
    console.log('Sending request to Gemini API...');
    
    try {
      // Generate content from the model
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
      });
      
      const response = await result.response;
      const responseText = response.text();
      
      console.log('Received response from Gemini API');
      
      // Parse the JSON response
      // We need to extract just the JSON part from the response, as Gemini might include additional text
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/{[\s\S]*}/);
      
      let parsedResponse;
      if (jsonMatch) {
        // If the response is wrapped in markdown code blocks, extract just the JSON
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If the response is not properly formatted, throw an error
        throw new Error('Invalid response format from Gemini API');
      }
      
      // Add a unique ID and timestamp to the certification
      const certificationData = {
        id: `cert-${Date.now()}`,
        title: parsedResponse.title || certificationName,
        imageUrl: 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Machine-Learning-Engineer-Associate_badge.e5d66b50925b1b750b326f29b785529ccc82a696.png',
        topics: parsedResponse.topics || [],
        createdAt: new Date().toISOString()
      };
      
      return certificationData;
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError);
      throw new Error(`Gemini API error: ${apiError.message}`);
    }
  } catch (error) {
    console.error('Error processing PDF with Gemini:', error);
    
    // Fallback to ML certification data in case of API failure
    console.log('Falling back to ML certification data');
    return getMlCertificationData(fileName.replace('.pdf', ''));
  }
};

/**
 * Returns the AWS Machine Learning certification data
 * @param {string} certificationName - The name of the certification
 * @returns {Object} - The ML certification data
 */
const getMlCertificationData = (certificationName) => {
  // Generate a timestamp to ensure unique IDs
  const timestamp = Date.now();
  
  // Convert the exam_name and content_outline to the format expected by the app
  const mlCertData = {
    id: `cert-${timestamp}`,
    title: "AWS Certified Machine Learning Engineer - Associate (MLA-C01)",
    imageUrl: 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Machine-Learning-Engineer-Associate_badge.e5d66b50925b1b750b326f29b785529ccc82a696.png',
    topics: [
      {
        id: `domain-1-${timestamp}`,
        title: 'Data Preparation for Machine Learning',
        description: 'Covers ingesting, storing, transforming data, feature engineering, ensuring data integrity, and preparing data for modeling.',
        subtopics: [
          {
            id: `task-1-1-${timestamp}`,
            title: 'Ingest and store data',
            content: 'Learn about data formats, ingestion mechanisms, and AWS storage options for ML workloads. AWS provides various services for data ingestion and storage, including Amazon S3, Amazon RDS, Amazon DynamoDB, and Amazon Redshift. For ML workloads, Amazon S3 is commonly used as the central data lake due to its scalability, durability, and integration with SageMaker.',
            resources: [
              { name: 'AWS Storage Services', url: 'https://aws.amazon.com/products/storage/' },
              { name: 'SageMaker Data Wrangler', url: 'https://aws.amazon.com/sagemaker/data-wrangler/' }
            ],
            videoLinks: [
              { name: 'AWS Data Ingestion Methods', url: 'https://www.youtube.com/results?search_query=aws+data+ingestion+methods' }
            ],
            examples: [
              "Example: Use AWS Glue to catalog data in S3 and make it available for analysis",
              "Example: Set up an ingestion pipeline using Amazon Kinesis for streaming data"
            ]
          },
          {
            id: `task-1-2-${timestamp}`,
            title: 'Transform data and perform feature engineering',
            content: 'Understand data cleaning, transformation techniques, and feature engineering for ML models. Data transformation involves cleaning, normalizing, and preparing data for ML algorithms. Feature engineering is the process of creating new features from existing data to improve model performance. AWS provides tools like SageMaker Data Wrangler, AWS Glue, and SageMaker Processing for these tasks.',
            resources: [
              { name: 'SageMaker Feature Store', url: 'https://aws.amazon.com/sagemaker/feature-store/' },
              { name: 'AWS Glue DataBrew', url: 'https://aws.amazon.com/glue/features/databrew/' }
            ],
            videoLinks: [
              { name: 'Feature Engineering Best Practices', url: 'https://www.youtube.com/results?search_query=aws+feature+engineering+best+practices' }
            ],
            examples: [
              "Example: Use SageMaker Data Wrangler to clean and transform a dataset",
              "Example: Create a feature store to manage and share features across ML projects"
            ]
          },
          {
            id: `task-1-3-${timestamp}`,
            title: 'Ensure data quality and integrity',
            content: 'Learn methods to validate data quality, handle missing values, outliers, and ensure data integrity. Data quality is crucial for ML model performance. This includes handling missing values, detecting and managing outliers, ensuring consistent data types, and validating data integrity. AWS provides tools like AWS Glue DataBrew and SageMaker Data Wrangler to help with these tasks.',
            resources: [
              { name: 'AWS Data Quality Solutions', url: 'https://aws.amazon.com/blogs/big-data/building-data-quality-solutions-with-aws-glue-databrew/' },
              { name: 'SageMaker Data Validation', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor-data-quality.html' }
            ],
            videoLinks: [
              { name: 'Data Quality Best Practices', url: 'https://www.youtube.com/results?search_query=aws+data+quality+best+practices' }
            ],
            examples: [
              "Example: Set up SageMaker Model Monitor to detect data drift",
              "Example: Use AWS Glue DataBrew to profile data and identify quality issues"
            ]
          }
        ]
      },
      {
        id: `domain-2-${timestamp}`,
        title: 'Exploratory Data Analysis',
        description: 'Covers data visualization, statistical analysis, and understanding data patterns for ML model development.',
        subtopics: [
          {
            id: `task-2-1-${timestamp}`,
            title: 'Visualize and analyze data',
            content: 'Learn techniques for data visualization and statistical analysis to understand data patterns. Data visualization helps to understand the distribution, relationships, and patterns in data. AWS provides tools like Amazon QuickSight for visualization and SageMaker Studio for interactive data analysis.',
            resources: [
              { name: 'Amazon QuickSight', url: 'https://aws.amazon.com/quicksight/' },
              { name: 'SageMaker Studio', url: 'https://aws.amazon.com/sagemaker/studio/' }
            ],
            videoLinks: [
              { name: 'Data Visualization in AWS', url: 'https://www.youtube.com/results?search_query=aws+data+visualization' }
            ],
            examples: [
              "Example: Create interactive dashboards with Amazon QuickSight",
              "Example: Use SageMaker Studio notebooks for exploratory data analysis"
            ]
          },
          {
            id: `task-2-2-${timestamp}`,
            title: 'Identify data patterns and correlations',
            content: 'Understand how to identify patterns, correlations, and insights from data for ML models. Identifying patterns and correlations in data is essential for feature selection and model development. This involves using statistical methods, correlation analysis, and dimensionality reduction techniques.',
            resources: [
              { name: 'SageMaker Data Analysis', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/studio-notebooks.html' },
              { name: 'AWS Machine Learning Blog', url: 'https://aws.amazon.com/blogs/machine-learning/' }
            ],
            videoLinks: [
              { name: 'Pattern Recognition in Data', url: 'https://www.youtube.com/results?search_query=pattern+recognition+in+data+aws' }
            ],
            examples: [
              "Example: Use correlation matrices to identify relationships between features",
              "Example: Apply principal component analysis (PCA) to reduce dimensionality"
            ]
          }
        ]
      },
      {
        id: `domain-3-${timestamp}`,
        title: 'Modeling',
        description: 'Covers selecting, training, tuning, and evaluating machine learning models on AWS.',
        subtopics: [
          {
            id: `task-3-1-${timestamp}`,
            title: 'Select and train machine learning models',
            content: 'Learn how to select appropriate ML algorithms and train models using Amazon SageMaker. Model selection involves choosing the right algorithm based on the problem type, data characteristics, and business requirements. Amazon SageMaker provides built-in algorithms and supports custom algorithms for model training.',
            resources: [
              { name: 'SageMaker Built-in Algorithms', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/algos.html' },
              { name: 'SageMaker Training', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/train-model.html' }
            ],
            videoLinks: [
              { name: 'SageMaker Model Training', url: 'https://www.youtube.com/results?search_query=amazon+sagemaker+model+training' }
            ],
            examples: [
              "Example: Train a XGBoost model using SageMaker's built-in algorithm",
              "Example: Implement a custom training script for a TensorFlow model"
            ]
          },
          {
            id: `task-3-2-${timestamp}`,
            title: 'Optimize and tune models',
            content: 'Understand hyperparameter tuning, optimization techniques, and model evaluation. Hyperparameter tuning is the process of finding the optimal hyperparameters for a model to maximize performance. SageMaker provides automatic model tuning capabilities to efficiently search the hyperparameter space.',
            resources: [
              { name: 'SageMaker Automatic Model Tuning', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/automatic-model-tuning.html' },
              { name: 'SageMaker Experiments', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/experiments.html' }
            ],
            videoLinks: [
              { name: 'Hyperparameter Tuning in SageMaker', url: 'https://www.youtube.com/results?search_query=hyperparameter+tuning+sagemaker' }
            ],
            examples: [
              "Example: Set up a hyperparameter tuning job for a random forest model",
              "Example: Track and compare model experiments using SageMaker Experiments"
            ]
          },
          {
            id: `task-3-3-${timestamp}`,
            title: 'Evaluate model performance',
            content: 'Learn metrics and techniques for evaluating ML model performance. Model evaluation involves assessing how well a model performs on unseen data using appropriate metrics. The choice of metrics depends on the problem type (classification, regression, etc.) and business requirements.',
            resources: [
              { name: 'SageMaker Model Evaluation', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-evaluation.html' },
              { name: 'SageMaker Clarify', url: 'https://aws.amazon.com/sagemaker/clarify/' }
            ],
            videoLinks: [
              { name: 'Model Evaluation Best Practices', url: 'https://www.youtube.com/results?search_query=model+evaluation+best+practices+aws' }
            ],
            examples: [
              "Example: Calculate precision, recall, and F1 score for a classification model",
              "Example: Use confusion matrices to understand model performance"
            ]
          }
        ]
      },
      {
        id: `domain-4-${timestamp}`,
        title: 'Machine Learning Implementation and Operations',
        description: 'Covers deploying, monitoring, and managing ML models in production environments.',
        subtopics: [
          {
            id: `task-4-1-${timestamp}`,
            title: 'Deploy machine learning solutions',
            content: 'Learn how to deploy ML models to production using SageMaker endpoints and other AWS services. Model deployment involves making the trained model available for inference. SageMaker provides endpoints for real-time inference and batch transform for batch processing.',
            resources: [
              { name: 'SageMaker Deployment Options', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html' },
              { name: 'SageMaker Inference', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/inference-pipeline-real-time.html' }
            ],
            videoLinks: [
              { name: 'SageMaker Model Deployment', url: 'https://www.youtube.com/results?search_query=sagemaker+model+deployment' }
            ],
            examples: [
              "Example: Deploy a model to a SageMaker endpoint for real-time inference",
              "Example: Set up a batch transform job for offline processing"
            ]
          },
          {
            id: `task-4-2-${timestamp}`,
            title: 'Monitor and maintain ML solutions',
            content: 'Understand how to monitor model performance, detect drift, and maintain ML solutions. Monitoring involves tracking model performance, detecting data and concept drift, and ensuring the model continues to meet business requirements. SageMaker Model Monitor provides capabilities for automated monitoring.',
            resources: [
              { name: 'SageMaker Model Monitor', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html' },
              { name: 'Amazon CloudWatch', url: 'https://aws.amazon.com/cloudwatch/' }
            ],
            videoLinks: [
              { name: 'ML Model Monitoring', url: 'https://www.youtube.com/results?search_query=ml+model+monitoring+aws' }
            ],
            examples: [
              "Example: Set up data quality monitoring for a deployed model",
              "Example: Configure alerts for model performance degradation"
            ]
          },
          {
            id: `task-4-3-${timestamp}`,
            title: 'Apply ML best practices and governance',
            content: 'Learn best practices for ML governance, security, and compliance. ML governance involves establishing policies, processes, and controls to ensure responsible and compliant use of ML. This includes model documentation, version control, access controls, and compliance with regulations.',
            resources: [
              { name: 'AWS ML Governance', url: 'https://aws.amazon.com/machine-learning/ml-governance/' },
              { name: 'SageMaker MLOps', url: 'https://aws.amazon.com/sagemaker/mlops/' }
            ],
            videoLinks: [
              { name: 'ML Governance Best Practices', url: 'https://www.youtube.com/results?search_query=ml+governance+best+practices+aws' }
            ],
            examples: [
              "Example: Implement model versioning and lineage tracking",
              "Example: Set up approval workflows for model deployment"
            ]
          }
        ]
      }
    ]
  };
  
  return mlCertData;
};

export default {
  processPdfWithGemini
};
