const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
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
      description: 'Original custom rule-based content moderation'
    },
    {
      name: 'V2 - Perspective API',
      description: 'Google Perspective API with advanced AI-powered analysis'
    }
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'API documentation and overview',
        description: 'Provides comprehensive information about the Content Moderation API, available endpoints, and features',
        responses: {
          200: {
            description: 'API information and documentation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Content Moderation API' },
                    version: { type: 'string', example: '2.0.0' },
                    description: { type: 'string', example: 'Advanced content moderation with Google Perspective API' },
                    endpoints: {
                      type: 'object',
                      properties: {
                        v1: {
                          type: 'object',
                          properties: {
                            description: { type: 'string', example: 'Original custom rules-based moderation' },
                            check: { type: 'string', example: 'POST /api/v1/content/check' },
                            clean: { type: 'string', example: 'POST /api/v1/content/clean' }
                          }
                        },
                        v2: {
                          type: 'object',
                          properties: {
                            description: { type: 'string', example: 'Google Perspective API with advanced features' },
                            analyze: { type: 'string', example: 'POST /api/v2/content/analyze' },
                            clean: { type: 'string', example: 'POST /api/v2/content/clean' },
                            hybridAnalysis: { type: 'string', example: 'POST /api/v2/content/hybrid-analysis' },
                            batchAnalysis: { type: 'string', example: 'POST /api/v2/content/batch-analysis' },
                            history: { type: 'string', example: 'GET /api/v2/content/history' }
                          }
                        }
                      }
                    },
                    documentation: {
                      type: 'object',
                      properties: {
                        swagger: { type: 'string', example: 'Available at /api-docs' },
                        note: { type: 'string', example: 'V2 provides more detailed analysis using Google Perspective API' },
                        features: { 
                          type: 'array', 
                          items: { type: 'string' },
                          example: ['Multiple toxicity categories', 'Confidence scores', 'Batch processing', 'Hybrid analysis (V1 + V2)', 'Advanced cleaning suggestions', 'Detailed recommendations']
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the API and its dependencies',
        responses: {
          200: {
            description: 'Service health information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                },
                examples: {
                  healthy: {
                    summary: 'All services operational',
                    value: {
                      status: 'healthy',
                      timestamp: '2025-07-26T08:45:00.000Z',
                      version: '2.0.0',
                      services: {
                        customRules: 'operational',
                        perspectiveAPI: 'configured'
                      }
                    }
                  },
                  degraded: {
                    summary: 'Some services have issues',
                    value: {
                      status: 'degraded',
                      timestamp: '2025-07-26T08:45:00.000Z',
                      version: '2.0.0',
                      services: {
                        customRules: 'operational',
                        perspectiveAPI: 'not_configured'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/content/check': {
      post: {
        tags: ['V1 - Custom Rules'],
        summary: 'Check content for toxicity (V1)',
        description: 'Analyzes content using custom rule-based detection system',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContentRequest'
              },
              examples: {
                simple: {
                  summary: 'Basic content check',
                  value: {
                    text: 'Hello world, this is a test message!'
                  }
                },
                moderate: {
                  summary: 'Potentially toxic content',
                  value: {
                    text: 'You are such an idiot'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Content analysis result',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/V1CheckResponse'
                },
                examples: {
                  clean: {
                    summary: 'Clean content',
                    value: {
                      isToxic: false,
                      confidence: 1,
                      detectedIssues: [],
                      message: 'Content appears to be safe'
                    }
                  },
                  toxic: {
                    summary: 'Toxic content detected',
                    value: {
                      isToxic: true,
                      confidence: 0.95,
                      detectedIssues: ['profanity'],
                      message: 'Content contains potentially harmful language'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid text',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/content/clean': {
      post: {
        tags: ['V1 - Custom Rules'],
        summary: 'Clean content (V1)',
        description: 'Cleans content by removing or replacing problematic words using custom rules',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContentRequest'
              },
              examples: {
                moderate: {
                  summary: 'Content needing cleaning',
                  value: {
                    text: 'You are such an idiot and a damn fool'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cleaned content result',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/V1CleanResponse'
                },
                examples: {
                  cleaned: {
                    summary: 'Successfully cleaned content',
                    value: {
                      originalText: 'You are such an idiot and a damn fool',
                      cleanedText: 'You are such an *** and a *** ***',
                      wasModified: true,
                      removedWords: ['idiot', 'damn', 'fool'],
                      message: 'Content has been cleaned'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid text',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/content/analyze': {
      post: {
        tags: ['V2 - Perspective API'],
        summary: 'Analyze content with Perspective API (V2)',
        description: 'Advanced content analysis using Google\'s Perspective API with multiple toxicity categories and confidence scores',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContentRequest'
              },
              examples: {
                simple: {
                  summary: 'Basic content analysis',
                  value: {
                    text: 'Hello world, this is a test message!'
                  }
                },
                moderate: {
                  summary: 'Potentially toxic content',
                  value: {
                    text: 'You are such an idiot and I hate you'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Detailed content analysis result',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/V2AnalyzeResponse'
                },
                examples: {
                  clean: {
                    summary: 'Clean content',
                    value: {
                      text: 'Hello world, this is a test message!',
                      overallToxicity: {
                        isToxic: false,
                        confidence: 0.05,
                        threshold: 0.7
                      },
                      categories: {
                        TOXICITY: { score: 0.05, isToxic: false },
                        SEVERE_TOXICITY: { score: 0.01, isToxic: false },
                        IDENTITY_ATTACK: { score: 0.02, isToxic: false },
                        INSULT: { score: 0.03, isToxic: false },
                        PROFANITY: { score: 0.01, isToxic: false },
                        THREAT: { score: 0.01, isToxic: false }
                      },
                      recommendation: 'Content is safe to publish',
                      message: 'Content analysis completed successfully'
                    }
                  },
                  toxic: {
                    summary: 'Toxic content detected',
                    value: {
                      text: 'You are such an idiot and I hate you',
                      overallToxicity: {
                        isToxic: true,
                        confidence: 0.85,
                        threshold: 0.7
                      },
                      categories: {
                        TOXICITY: { score: 0.85, isToxic: true },
                        SEVERE_TOXICITY: { score: 0.35, isToxic: false },
                        IDENTITY_ATTACK: { score: 0.15, isToxic: false },
                        INSULT: { score: 0.75, isToxic: true },
                        PROFANITY: { score: 0.25, isToxic: false },
                        THREAT: { score: 0.20, isToxic: false }
                      },
                      recommendation: 'Content should be moderated or rejected',
                      message: 'High toxicity detected in multiple categories'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid text',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          500: {
            description: 'Internal server error - Perspective API unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/content/clean': {
      post: {
        tags: ['V2 - Perspective API'],
        summary: 'Clean content with AI suggestions (V2)',
        description: 'Advanced content cleaning using Perspective API analysis to provide intelligent cleaning suggestions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContentRequest'
              },
              examples: {
                moderate: {
                  summary: 'Content needing intelligent cleaning',
                  value: {
                    text: 'You are such an idiot and I hate you so much'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'AI-powered cleaning result',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/V2CleanResponse'
                },
                examples: {
                  cleaned: {
                    summary: 'Successfully cleaned with AI suggestions',
                    value: {
                      originalText: 'You are such an idiot and I hate you so much',
                      suggestedCleanText: 'You are such a [removed] and I [removed] you so much',
                      toxicityAnalysis: {
                        before: {
                          overallScore: 0.85,
                          categories: {
                            TOXICITY: 0.85,
                            INSULT: 0.75
                          }
                        },
                        after: {
                          overallScore: 0.15,
                          categories: {
                            TOXICITY: 0.15,
                            INSULT: 0.10
                          }
                        }
                      },
                      cleaningActions: [
                        { word: 'idiot', action: 'removed', reason: 'Insult detected' },
                        { phrase: 'I hate you', action: 'softened', reason: 'Threatening language' }
                      ],
                      recommendation: 'Content has been significantly improved and is now suitable for publication',
                      message: 'Content cleaned successfully using AI analysis'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid text',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/content/hybrid-analysis': {
      post: {
        tags: ['V2 - Perspective API'],
        summary: 'Hybrid analysis (V1 + V2)',
        description: 'Combines both custom rule-based detection (V1) and Google Perspective API (V2) for comprehensive content analysis',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContentRequest'
              },
              examples: {
                comprehensive: {
                  summary: 'Content for comprehensive analysis',
                  value: {
                    text: 'You damn idiot, I hate you and want to hurt you'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Comprehensive hybrid analysis result',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HybridAnalysisResponse'
                },
                examples: {
                  comprehensive: {
                    summary: 'Complete hybrid analysis',
                    value: {
                      text: 'You damn idiot, I hate you and want to hurt you',
                      v1Analysis: {
                        isToxic: true,
                        confidence: 0.95,
                        detectedIssues: ['profanity', 'insult'],
                        message: 'Content contains potentially harmful language'
                      },
                      v2Analysis: {
                        overallToxicity: {
                          isToxic: true,
                          confidence: 0.92,
                          threshold: 0.7
                        },
                        categories: {
                          TOXICITY: { score: 0.92, isToxic: true },
                          INSULT: { score: 0.88, isToxic: true },
                          THREAT: { score: 0.75, isToxic: true },
                          PROFANITY: { score: 0.65, isToxic: false }
                        }
                      },
                      combinedResult: {
                        isToxic: true,
                        confidence: 0.94,
                        riskLevel: 'HIGH',
                        recommendation: 'REJECT',
                        reasons: [
                          'High toxicity detected by both systems',
                          'Multiple threat categories identified',
                          'Contains explicit threats and insults'
                        ]
                      },
                      message: 'Content analysis completed using both V1 and V2 systems'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid text',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/content/batch-analysis': {
      post: {
        tags: ['V2 - Perspective API'],
        summary: 'Batch content analysis (V2)',
        description: 'Analyze multiple pieces of content simultaneously using Google Perspective API',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchContentRequest'
              },
              examples: {
                mixed: {
                  summary: 'Mixed content batch',
                  value: {
                    texts: [
                      'Hello world, this is great!',
                      'You are such an idiot',
                      'I love this community',
                      'I hate you and want to hurt you'
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Batch analysis results',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BatchAnalysisResponse'
                },
                examples: {
                  mixed: {
                    summary: 'Mixed content results',
                    value: {
                      totalTexts: 4,
                      processedTexts: 4,
                      summary: {
                        clean: 2,
                        toxic: 2,
                        averageToxicity: 0.425
                      },
                      results: [
                        {
                          index: 0,
                          text: 'Hello world, this is great!',
                          isToxic: false,
                          overallScore: 0.05,
                          recommendation: 'APPROVE'
                        },
                        {
                          index: 1,
                          text: 'You are such an idiot',
                          isToxic: true,
                          overallScore: 0.85,
                          recommendation: 'MODERATE'
                        },
                        {
                          index: 2,
                          text: 'I love this community',
                          isToxic: false,
                          overallScore: 0.02,
                          recommendation: 'APPROVE'
                        },
                        {
                          index: 3,
                          text: 'I hate you and want to hurt you',
                          isToxic: true,
                          overallScore: 0.95,
                          recommendation: 'REJECT'
                        }
                      ],
                      message: 'Batch analysis completed successfully'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - missing or invalid texts array',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/content/history': {
      get: {
        tags: ['V2 - Perspective API'],
        summary: 'Get analysis history (V2)',
        description: 'Retrieve recent content analysis history (simulated data for demonstration)',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10
            }
          }
        ],
        responses: {
          200: {
            description: 'Analysis history',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HistoryResponse'
                },
                examples: {
                  recent: {
                    summary: 'Recent analysis history',
                    value: {
                      totalEntries: 150,
                      returnedEntries: 3,
                      history: [
                        {
                          id: 'hist_001',
                          timestamp: '2025-07-26T08:45:00.000Z',
                          text: 'Hello world!',
                          result: {
                            isToxic: false,
                            overallScore: 0.05,
                            recommendation: 'APPROVE'
                          }
                        },
                        {
                          id: 'hist_002',
                          timestamp: '2025-07-26T08:40:00.000Z',
                          text: 'You are an idiot',
                          result: {
                            isToxic: true,
                            overallScore: 0.85,
                            recommendation: 'MODERATE'
                          }
                        },
                        {
                          id: 'hist_003',
                          timestamp: '2025-07-26T08:35:00.000Z',
                          text: 'I hate you',
                          result: {
                            isToxic: true,
                            overallScore: 0.75,
                            recommendation: 'REJECT'
                          }
                        }
                      ],
                      message: 'Analysis history retrieved successfully'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ContentRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            description: 'The text content to analyze',
            example: 'Hello world, this is a test message!'
          }
        }
      },
      BatchContentRequest: {
        type: 'object',
        required: ['texts'],
        properties: {
          texts: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of text content to analyze',
            example: ['Hello world!', 'You are an idiot', 'Great job!']
          }
        }
      },
      V1CheckResponse: {
        type: 'object',
        properties: {
          isToxic: {
            type: 'boolean',
            description: 'Whether the content is considered toxic'
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          },
          detectedIssues: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of detected issues (e.g., profanity, insult)'
          },
          message: {
            type: 'string',
            description: 'Human-readable analysis message'
          }
        }
      },
      V1CleanResponse: {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
            description: 'The original input text'
          },
          cleanedText: {
            type: 'string',
            description: 'The cleaned version of the text'
          },
          wasModified: {
            type: 'boolean',
            description: 'Whether any modifications were made'
          },
          removedWords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of words that were removed or replaced'
          },
          message: {
            type: 'string',
            description: 'Human-readable cleaning message'
          }
        }
      },
      V2AnalyzeResponse: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The analyzed text'
          },
          overallToxicity: {
            type: 'object',
            properties: {
              isToxic: {
                type: 'boolean'
              },
              confidence: {
                type: 'number'
              },
              threshold: {
                type: 'number'
              }
            }
          },
          categories: {
            type: 'object',
            description: 'Toxicity scores for different categories',
            additionalProperties: {
              type: 'object',
              properties: {
                score: {
                  type: 'number'
                },
                isToxic: {
                  type: 'boolean'
                }
              }
            }
          },
          recommendation: {
            type: 'string',
            description: 'Recommended action for the content'
          },
          message: {
            type: 'string',
            description: 'Human-readable analysis message'
          }
        }
      },
      V2CleanResponse: {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
            description: 'The original input text'
          },
          suggestedCleanText: {
            type: 'string',
            description: 'AI-suggested cleaned version'
          },
          toxicityAnalysis: {
            type: 'object',
            properties: {
              before: {
                type: 'object',
                description: 'Toxicity scores before cleaning'
              },
              after: {
                type: 'object',
                description: 'Estimated toxicity scores after cleaning'
              }
            }
          },
          cleaningActions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                word: {
                  type: 'string'
                },
                action: {
                  type: 'string'
                },
                reason: {
                  type: 'string'
                }
              }
            }
          },
          recommendation: {
            type: 'string',
            description: 'Recommendation for the cleaned content'
          },
          message: {
            type: 'string',
            description: 'Human-readable cleaning message'
          }
        }
      },
      HybridAnalysisResponse: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The analyzed text'
          },
          v1Analysis: {
            $ref: '#/components/schemas/V1CheckResponse'
          },
          v2Analysis: {
            $ref: '#/components/schemas/V2AnalyzeResponse'
          },
          combinedResult: {
            type: 'object',
            properties: {
              isToxic: {
                type: 'boolean'
              },
              confidence: {
                type: 'number'
              },
              riskLevel: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH']
              },
              recommendation: {
                type: 'string',
                enum: ['APPROVE', 'MODERATE', 'REJECT']
              },
              reasons: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          message: {
            type: 'string',
            description: 'Human-readable analysis message'
          }
        }
      },
      BatchAnalysisResponse: {
        type: 'object',
        properties: {
          totalTexts: {
            type: 'integer',
            description: 'Total number of texts in the batch'
          },
          processedTexts: {
            type: 'integer',
            description: 'Number of texts successfully processed'
          },
          summary: {
            type: 'object',
            properties: {
              clean: {
                type: 'integer'
              },
              toxic: {
                type: 'integer'
              },
              averageToxicity: {
                type: 'number'
              }
            }
          },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: {
                  type: 'integer'
                },
                text: {
                  type: 'string'
                },
                isToxic: {
                  type: 'boolean'
                },
                overallScore: {
                  type: 'number'
                },
                recommendation: {
                  type: 'string'
                }
              }
            }
          },
          message: {
            type: 'string',
            description: 'Human-readable batch analysis message'
          }
        }
      },
      HistoryResponse: {
        type: 'object',
        properties: {
          totalEntries: {
            type: 'integer',
            description: 'Total number of entries in history'
          },
          returnedEntries: {
            type: 'integer',
            description: 'Number of entries returned in this response'
          },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                text: {
                  type: 'string'
                },
                result: {
                  type: 'object',
                  properties: {
                    isToxic: {
                      type: 'boolean'
                    },
                    overallScore: {
                      type: 'number'
                    },
                    recommendation: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          message: {
            type: 'string',
            description: 'Human-readable history message'
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy'],
            description: 'Overall health status of the API'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp of the health check'
          },
          version: {
            type: 'string',
            description: 'API version'
          },
          services: {
            type: 'object',
            properties: {
              customRules: {
                type: 'string',
                enum: ['operational', 'degraded', 'down'],
                description: 'Status of the custom rules engine'
              },
              perspectiveAPI: {
                type: 'string',
                enum: ['configured', 'not_configured', 'error'],
                description: 'Status of Google Perspective API integration'
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'string',
            description: 'Additional error details'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the error occurred'
          }
        }
      }
    }
  }
};

const specs = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: []
});

module.exports = {
  swaggerUi,
  specs
};
