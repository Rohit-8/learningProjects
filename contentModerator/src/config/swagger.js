const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Content Moderation API',
      version: '2.0.0',
      description: 'Advanced AI-powered content moderation API featuring both custom rule-based detection and Google\'s Perspective API integration',
      contact: {
        name: 'API Support',
        email: 'support@contentmoderation.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'API health and status endpoints'
      },
      {
        name: 'V1 - Custom Rules',
        description: 'Original custom rules-based content moderation'
      },
      {
        name: 'V2 - Perspective API',
        description: 'Google Perspective API with advanced AI-powered analysis'
      },
      {
        name: 'Legacy',
        description: 'Legacy endpoints for backward compatibility'
      }
    ],
    components: {
      schemas: {
        TextInput: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              description: 'Text content to analyze or clean',
              example: 'This is some sample text to analyze'
            }
          }
        },
        V1CheckResponse: {
          type: 'object',
          properties: {
            hasAbusiveContent: {
              type: 'boolean',
              description: 'Whether abusive content was detected'
            },
            severity: {
              type: 'string',
              enum: ['none', 'low', 'medium', 'high'],
              description: 'Severity level of detected issues'
            },
            details: {
              type: 'object',
              properties: {
                abusive: {
                  type: 'object',
                  properties: {
                    words: { type: 'array', items: { type: 'string' } },
                    phrases: { type: 'array', items: { type: 'string' } }
                  }
                },
                sexual: {
                  type: 'object',
                  properties: {
                    words: { type: 'array', items: { type: 'string' } },
                    phrases: { type: 'array', items: { type: 'string' } }
                  }
                },
                threats: {
                  type: 'object',
                  properties: {
                    words: { type: 'array', items: { type: 'string' } },
                    phrases: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            },
            message: {
              type: 'string',
              description: 'Human-readable analysis result'
            }
          }
        },
        V1CleanResponse: {
          type: 'object',
          properties: {
            originalText: {
              type: 'string',
              description: 'Original input text'
            },
            cleanedText: {
              type: 'string',
              description: 'Cleaned version of the text'
            },
            modificationsExplanation: {
              type: 'string',
              description: 'Explanation of changes made'
            }
          }
        },
        V2AnalyzeInput: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              description: 'Text content to analyze',
              example: 'You are such an idiot and I hate you'
            },
            attributes: {
              type: 'object',
              description: 'Specific Perspective API attributes to analyze',
              properties: {
                TOXICITY: { type: 'object' },
                SEVERE_TOXICITY: { type: 'object' },
                IDENTITY_ATTACK: { type: 'object' },
                INSULT: { type: 'object' },
                PROFANITY: { type: 'object' },
                THREAT: { type: 'object' },
                SEXUALLY_EXPLICIT: { type: 'object' }
              }
            },
            includeRecommendations: {
              type: 'boolean',
              default: true,
              description: 'Whether to include actionable recommendations'
            }
          }
        },
        V2AnalyzeResponse: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              example: 'v2'
            },
            analysisProvider: {
              type: 'string',
              example: 'Google Perspective API'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            input: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                textLength: { type: 'integer' },
                wordCount: { type: 'integer' }
              }
            },
            analysis: {
              type: 'object',
              properties: {
                hasAbusiveContent: { type: 'boolean' },
                overallRisk: {
                  type: 'string',
                  enum: ['minimal', 'low', 'medium', 'high']
                },
                highestRiskCategory: { type: 'string' },
                highestRiskScore: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 100
                },
                detectedIssues: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      score: { type: 'integer' },
                      severity: { type: 'string' },
                      description: { type: 'string' },
                      threshold: { type: 'integer' }
                    }
                  }
                },
                scores: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      score: { type: 'integer' },
                      threshold: { type: 'integer' },
                      isProblematic: { type: 'boolean' },
                      status: { type: 'string', enum: ['SAFE', 'VIOLATION'] }
                    }
                  }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            actionRequired: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                processingTime: { type: 'integer' },
                apiVersion: { type: 'string' },
                confidence: { type: 'string', enum: ['very-low', 'low', 'medium', 'high'] }
              }
            }
          }
        },
        V2CleanInput: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              description: 'Text content to clean'
            },
            cleaningLevel: {
              type: 'string',
              enum: ['mild', 'moderate', 'aggressive'],
              default: 'moderate',
              description: 'Intensity of cleaning to apply'
            },
            preserveLength: {
              type: 'boolean',
              default: false,
              description: 'Whether to preserve original text length'
            }
          }
        },
        V2CleanResponse: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            cleaning: {
              type: 'object',
              properties: {
                original: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    length: { type: 'integer' },
                    wordCount: { type: 'integer' }
                  }
                },
                cleaned: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    length: { type: 'integer' },
                    wordCount: { type: 'integer' }
                  }
                },
                changes: {
                  type: 'object',
                  properties: {
                    applied: { type: 'boolean' },
                    note: { type: 'string' },
                    charactersChanged: { type: 'integer' },
                    preservedMeaning: { type: 'string' }
                  }
                }
              }
            },
            issuesDetected: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  severity: { type: 'string' },
                  description: { type: 'string' },
                  addressed: { type: 'boolean' }
                }
              }
            },
            qualityScore: {
              type: 'object',
              properties: {
                original: { type: 'integer' },
                cleaned: { type: 'integer' }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        V2HybridInput: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              description: 'Text content to analyze with both systems'
            },
            includeV1Analysis: {
              type: 'boolean',
              default: true,
              description: 'Whether to include V1 custom rules analysis'
            }
          }
        },
        V2BatchInput: {
          type: 'object',
          required: ['texts'],
          properties: {
            texts: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 50,
              description: 'Array of texts to analyze (max 50)'
            },
            maxConcurrent: {
              type: 'integer',
              default: 5,
              minimum: 1,
              maximum: 10,
              description: 'Maximum concurrent API calls'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy']
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                customRules: {
                  type: 'string',
                  enum: ['operational', 'degraded', 'down']
                },
                perspectiveAPI: {
                  type: 'string',
                  enum: ['configured', 'not_configured', 'error']
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Detailed error information'
            },
            version: {
              type: 'string',
              description: 'API version that generated the error'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - missing or invalid parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded for external API',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
