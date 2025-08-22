import OpenAI from 'openai';

export interface PersonaPrediction {
  persona:
    | 'struggling_sam'
    | 'busy_ben'
    | 'professional_paula'
    | 'enterprise_emma'
    | 'student_sarah'
    | 'lifetime_larry';
  confidence: number;
  reasons: string[];
  recommendedCampaigns: string[];
}

export interface ContentOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  score: number;
  tone: string;
  readability: number;
}

export interface SegmentationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  estimatedSize: number;
  confidence: number;
}

export interface BehaviorAnalysis {
  patterns: Array<{
    type: string;
    frequency: number;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export class AIService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure(apiKey);
    }
  }

  configure(apiKey: string): void {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, this should be done server-side
    });
  }

  private ensureConfigured(): void {
    if (!this.openai) {
      throw new Error('AI service not configured. Please provide OpenAI API key.');
    }
  }

  // Persona Prediction
  async predictPersona(userData: {
    email?: string;
    signupDate?: string;
    lastActiveDate?: string;
    featureUsage?: Record<string, number>;
    subscriptionStatus?: string;
    engagementMetrics?: {
      emailOpenRate?: number;
      clickRate?: number;
      appUsageMinutes?: number;
    };
    demographics?: {
      ageRange?: string;
      location?: string;
      deviceType?: string;
    };
  }): Promise<PersonaPrediction> {
    this.ensureConfigured();

    const prompt = `
Analyze the following user data for a smart alarm app called Relife and predict which persona they belong to:

User Data: ${JSON.stringify(userData, null, 2)}

Personas:
1. Struggling Sam - Free tier user, inconsistent sleep, needs motivation, young professional
2. Busy Ben - Values time efficiency, ROI-focused, potential premium upgrade, business professional
3. Professional Paula - Power user, uses advanced features, premium subscriber, career-focused
4. Enterprise Emma - Company decision maker, team features, enterprise needs
5. Student Sarah - Budget-conscious, late-night usage, discount-sensitive
6. Lifetime Larry - Long-term user, high engagement, brand advocate

Provide analysis in this JSON format:
{
  "persona": "persona_name",
  "confidence": 0.85,
  "reasons": ["reason1", "reason2"],
  "recommendedCampaigns": ["campaign1", "campaign2"]
}
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert marketing analyst specializing in user persona prediction for SaaS applications.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to predict persona:', error);
      throw error;
    }
  }

  // Content Optimization
  async optimizeEmailContent(content: {
    subject: string;
    body: string;
    persona: string;
    goal: 'engagement' | 'conversion' | 'retention' | 'activation';
  }): Promise<ContentOptimization> {
    this.ensureConfigured();

    const prompt = `
Optimize this email content for the ${content.persona} persona with goal: ${content.goal}

Original Subject: ${content.subject}
Original Body: ${content.body}

Persona Context:
- Struggling Sam: Needs motivation, struggles with consistency, responds to encouragement
- Busy Ben: Values efficiency, ROI-focused, time-conscious, professional tone
- Professional Paula: Advanced user, data-driven, feature-focused
- Enterprise Emma: Decision maker, team benefits, ROI justification
- Student Sarah: Budget-conscious, casual tone, peer social proof
- Lifetime Larry: Long-term relationship, exclusive benefits, loyalty rewards

Provide optimization in this JSON format:
{
  "original": "original_subject",
  "optimized": "optimized_subject_and_body",
  "improvements": ["improvement1", "improvement2"],
  "score": 85,
  "tone": "professional",
  "readability": 8.5
}
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert email marketing copywriter specializing in personalized content optimization.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) throw new Error('No response from AI');

      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to optimize content:', error);
      throw error;
    }
  }

  // Automated Segmentation
  async generateSegmentationRules(
    userData: Array<{
      id: string;
      email: string;
      signupDate: string;
      lastActive: string;
      features: Record<string, any>;
      engagement: Record<string, number>;
    }>
  ): Promise<SegmentationRule[]> {
    this.ensureConfigured();

    const prompt = `
Analyze this user data and generate intelligent segmentation rules for targeted email campaigns.

User Data Sample: ${JSON.stringify(userData.slice(0, 10), null, 2)}
Total Users: ${userData.length}

Generate 5-8 segmentation rules that would be most effective for email marketing campaigns. Focus on behavioral patterns, engagement levels, and feature usage.

Return as JSON array:
[
  {
    "id": "segment_1",
    "name": "High-Value Potential",
    "description": "Users likely to upgrade",
    "conditions": [
      {"field": "engagementScore", "operator": "greater_than", "value": 7},
      {"field": "featureUsage", "operator": "includes", "value": "premium_features"}
    ],
    "estimatedSize": 250,
    "confidence": 0.85
  }
]
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert data scientist specializing in user segmentation and behavioral analysis.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate segmentation rules:', error);
      throw error;
    }
  }

  // Behavior Analysis
  async analyzeBehaviorPatterns(behaviorData: {
    emailActions: Array<{ type: string; timestamp: string; metadata?: any }>;
    appUsage: Array<{ feature: string; duration: number; timestamp: string }>;
    engagementHistory: Array<{ type: string; value: number; date: string }>;
  }): Promise<BehaviorAnalysis> {
    this.ensureConfigured();

    const prompt = `
Analyze these user behavior patterns and provide insights for marketing automation:

Behavior Data: ${JSON.stringify(behaviorData, null, 2)}

Identify:
1. Key behavior patterns and their frequency
2. Insights about user engagement and preferences
3. Recommendations for campaign optimization
4. Risk factors that might indicate churn or disengagement

Return as JSON:
{
  "patterns": [
    {
      "type": "email_engagement",
      "frequency": 0.75,
      "description": "High email engagement pattern",
      "impact": "high"
    }
  ],
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "riskFactors": ["risk1", "risk2"]
}
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert behavioral analyst specializing in user engagement and churn prediction.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to analyze behavior patterns:', error);
      throw error;
    }
  }

  // Subject Line A/B Testing
  async generateSubjectLineVariations(
    originalSubject: string,
    persona: string,
    count: number = 3
  ): Promise<string[]> {
    this.ensureConfigured();

    const prompt = `
Generate ${count} variations of this email subject line for A/B testing:
Original: "${originalSubject}"
Persona: ${persona}

Create variations that test different approaches:
- Urgency vs non-urgency
- Personalized vs generic
- Question vs statement
- Benefit-focused vs feature-focused

Return as JSON array of strings: ["variation1", "variation2", "variation3"]
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert email marketer specializing in subject line optimization and A/B testing.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate subject line variations:', error);
      throw error;
    }
  }

  // Campaign Performance Prediction
  async predictCampaignPerformance(campaignData: {
    subject: string;
    content: string;
    persona: string;
    sendTime: string;
    audienceSize: number;
    historicalData?: {
      averageOpenRate: number;
      averageClickRate: number;
      seasonality?: Record<string, number>;
    };
  }): Promise<{
    predictedOpenRate: number;
    predictedClickRate: number;
    predictedConversionRate: number;
    confidence: number;
    factors: string[];
  }> {
    this.ensureConfigured();

    const prompt = `
Predict the performance of this email campaign based on the data provided:

Campaign Data: ${JSON.stringify(campaignData, null, 2)}

Consider factors like:
- Subject line effectiveness
- Content quality and relevance
- Persona targeting accuracy
- Send timing optimization
- Audience size impact
- Historical performance patterns

Return prediction as JSON:
{
  "predictedOpenRate": 32.5,
  "predictedClickRate": 8.2,
  "predictedConversionRate": 2.1,
  "confidence": 0.78,
  "factors": ["Strong subject line", "Good persona match", "Optimal send time"]
}
`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert marketing analyst with deep expertise in email campaign performance prediction.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to predict campaign performance:', error);
      throw error;
    }
  }
}

// Default instance for easy use
export const aiService = new AIService();
