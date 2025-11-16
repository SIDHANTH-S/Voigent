import axios from 'axios';
import { systemPrompt, businessData } from './businessData.js';

const OLLAMA_API = 'http://localhost:11434/api/generate';
const USE_LLM_FOR_COMPLEX = true;

/**
 * Enhanced AI Service with Advanced Intelligence
 * Features: Smart analytics, natural conversation, proactive insights
 */
export class AIService {
  constructor() {
    this.conversationHistory = [];
    this.contextMemory = {
      discussedTopics: [],
      lastQuestion: null,
      customerMentioned: null,
      concernsRaised: [],
      conversationFlow: [],
      userPreferences: {
        detailLevel: 'balanced', // concise, balanced, detailed
        focusAreas: [] // What user seems most interested in
      }
    };
    
    this.openingVariations = [
      "Hey! Just pulled up your latest numbers. What would you like to know?",
      "Hi there! I've been looking at how things are going - want the highlights or got something specific in mind?",
      "Hello! Your business data's all updated. What's on your mind today?",
      "Hey! I'm all caught up with your numbers. Revenue, customers, inventory - what interests you?",
      "Hi! Just synced with your business data. Anything particular you want to dig into?"
    ];
  }

  /**
   * Advanced metrics calculation with insights
   */
  calculateMetrics() {
    const metrics = {
      // Core financial metrics
      profitMargin: ((businessData.overview.netProfitRecent / businessData.overview.totalRevenueRecent) * 100).toFixed(1),
      expenseRatio: ((businessData.overview.totalExpensesRecent / businessData.overview.totalRevenueRecent) * 100).toFixed(1),
      avgCustomerValue: (businessData.overview.totalRevenueAllTime / businessData.overview.totalActiveCustomers).toFixed(0),
      
      // Customer concentration analysis
      top3CustomerRevenue: businessData.customers.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0),
      top3Percentage: ((businessData.customers.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0) / businessData.overview.totalRevenueAllTime) * 100).toFixed(1),
      
      // Expense breakdown
      salaryExpenses: 50000 + 19000,
      salaryPercentage: (69000 / businessData.expenses.total * 100).toFixed(1),
      fixedCosts: 69000 + 15000, // Salaries + Rent
      variableCosts: businessData.expenses.total - 84000,
      
      // Inventory intelligence
      lowStockItems: businessData.products.inStock.filter(p => p.stock < 50 && p.stock > 0),
      criticalStockItems: businessData.products.inStock.filter(p => p.stock <= p.reorderPoint),
      wellStockedItems: businessData.products.inStock.filter(p => p.stock >= 150),
      outOfStockCount: businessData.products.outOfStock.length,
      
      // Customer risk analysis
      atRiskCustomers: businessData.customers.filter(c => c.riskLevel === 'high'),
      growingCustomers: businessData.customers.filter(c => c.growthTrend === 'growing'),
      
      // Performance vs benchmarks
      marginVsBenchmark: (((businessData.overview.netProfitRecent / businessData.overview.totalRevenueRecent) * 100) - businessData.overview.industryBenchmarks.avgProfitMargin).toFixed(1),
      
      // Opportunity costs
      estimatedWeeklyLossFromOutOfStock: businessData.products.outOfStock.reduce((sum, p) => sum + (p.avgWeeklySales || 0) * 50, 0) // Assuming ₹50 avg profit per unit
    };

    // Add derived insights
    metrics.customerConcentrationRisk = metrics.top3Percentage > 60 ? 'high' : metrics.top3Percentage > 40 ? 'medium' : 'low';
    metrics.inventoryHealthScore = this.calculateInventoryHealth();
    metrics.financialHealthScore = this.calculateFinancialHealth(metrics);
    
    return metrics;
  }

  /**
   * Calculate inventory health score
   */
  calculateInventoryHealth() {
    const total = businessData.products.inStock.length + businessData.products.outOfStock.length;
    const outOfStock = businessData.products.outOfStock.length;
    const lowStock = businessData.products.inStock.filter(p => p.stock < 50).length;
    
    const score = ((total - outOfStock - (lowStock * 0.5)) / total) * 100;
    return score.toFixed(0);
  }

  /**
   * Calculate overall financial health score
   */
  calculateFinancialHealth(metrics) {
    let score = 70; // Base score
    
    // Profit margin bonus
    if (metrics.profitMargin > 60) score += 15;
    else if (metrics.profitMargin > 50) score += 10;
    else if (metrics.profitMargin < 40) score -= 10;
    
    // Expense ratio
    if (metrics.expenseRatio < 35) score += 10;
    else if (metrics.expenseRatio > 50) score -= 10;
    
    // Customer concentration risk
    if (metrics.top3Percentage > 70) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Call Phi-3 LLM for complex questions
   */
  async callPhi3(userInput) {
    try {
      const metrics = this.calculateMetrics();
      
      const context = `
Business Context:
- Revenue: ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k (Recent), ₹${(businessData.overview.totalRevenueAllTime / 100000).toFixed(2)}L (All-time)
- Profit: ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k (${metrics.profitMargin}% margin - ${metrics.marginVsBenchmark}% vs industry avg)
- Expenses: ₹${(businessData.overview.totalExpensesRecent / 1000).toFixed(0)}k (${metrics.expenseRatio}% of revenue)
- Customers: ${businessData.overview.totalActiveCustomers} active, top 3 = ${metrics.top3Percentage}% revenue
- Inventory: ${metrics.outOfStockCount} out of stock, ${metrics.criticalStockItems.length} need reorder
- Top Customer: ${businessData.customers[0].name} (₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k)
- At-Risk Customers: ${metrics.atRiskCustomers.length} (haven't ordered recently)

Previous Discussion: ${this.contextMemory.discussedTopics.join(', ') || 'None yet'}

User Question: ${userInput}

Respond as Priya - warm, smart, conversational. 2-3 sentences max. Use ₹ for rupees. Connect to previous discussion if relevant. Provide insights, not just data.`;

      const response = await axios.post(OLLAMA_API, {
        model: 'phi3',
        prompt: context,
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 180
        }
      });

      return response.data.response.trim();
    } catch (error) {
      console.error('Phi-3 error:', error.message);
      return this.generateSmartFallback(userInput);
    }
  }

  /**
   * Intelligent question classification
   */
  isComplexQuestion(input) {
    const complexPatterns = [
      /compare|comparison|difference|versus|vs|better|worse/i,
      /why|how come|what.*reason|explain.*why/i,
      /should i|would you|do you think|recommend|suggest|advice|what would you/i,
      /improve|optimize|strategy|plan|grow|increase/i,
      /what if|scenario|predict|forecast|trend|future/i,
      /help me understand|tell me about.*and|relationship between/i,
      /analyze|analysis|insight|pattern/i
    ];
    
    return complexPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Main response generator with enhanced intelligence
   */
  async generateResponse(userInput) {
    const input = userInput.toLowerCase();
    this.conversationHistory.push({ role: 'user', content: userInput });
    this.contextMemory.lastQuestion = input;
    this.contextMemory.conversationFlow.push(this.classifyIntent(input));

    const metrics = this.calculateMetrics();
    let response = '';

    // Route to appropriate handler
    if (USE_LLM_FOR_COMPLEX && this.isComplexQuestion(userInput)) {
      console.log('🤖 Using Phi-3 LLM for complex question');
      response = await this.callPhi3(userInput);
    }
    else if (this.isGreeting(input)) {
      response = this.getRandomOpening();
      this.contextMemory.discussedTopics = [];
    }
    else if (this.isBusinessOverview(input)) {
      response = this.generateBusinessOverview(metrics);
      this.trackTopic('overview');
    }
    else if (this.isFinancialQuery(input)) {
      response = this.generateFinancialInsight(input, metrics);
      this.trackTopic('finances');
    }
    else if (this.isInventoryQuery(input)) {
      response = this.generateInventoryInsight(input, metrics);
      this.trackTopic('inventory');
    }
    else if (this.isCustomerQuery(input)) {
      response = this.generateCustomerInsight(input, metrics);
      this.trackTopic('customers');
    }
    else if (this.isExpenseQuery(input)) {
      response = this.generateExpenseInsight(metrics);
      this.trackTopic('expenses');
    }
    else if (this.isRevenueQuery(input)) {
      response = this.generateRevenueInsight(metrics);
      this.trackTopic('revenue');
    }
    else if (this.isProfitQuery(input)) {
      response = this.generateProfitInsight(metrics);
      this.trackTopic('profit');
    }
    else if (this.isProblemsQuery(input)) {
      response = this.generateProblemsInsight(metrics);
      this.trackTopic('problems');
    }
    else if (this.isGoodNewsQuery(input)) {
      response = this.generateGoodNewsInsight(metrics);
      this.trackTopic('positives');
    }
    else if (this.isRiskQuery(input)) {
      response = this.generateRiskAnalysis(metrics);
      this.trackTopic('risks');
    }
    else if (this.isOpportunityQuery(input)) {
      response = this.generateOpportunityInsight(metrics);
      this.trackTopic('opportunities');
    }
    else if (this.isSpecificCustomerQuery(input)) {
      response = this.generateSpecificCustomerInfo(input);
    }
    else if (this.isFollowUp(input)) {
      response = this.handleFollowUp(input, metrics);
    }
    else if (this.isGoodbye(input)) {
      response = this.getGoodbyeMessage();
    }
    else {
      response = this.generateContextualHelp();
    }

    this.conversationHistory.push({ role: 'assistant', content: response });
    return response;
  }

  /**
   * Enhanced response generators with natural variety
   */
  generateBusinessOverview(metrics) {
    const variations = [
      `Business is looking pretty strong actually. You're clearing ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k in profit on ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k revenue - that's a ${metrics.profitMargin}% margin, which beats the industry average by a solid ${metrics.marginVsBenchmark} points.`,
      `Things are going well! Recent numbers show ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k in revenue with about ₹${(businessData.overview.totalExpensesRecent / 1000).toFixed(0)}k in expenses, netting you ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k. That ${metrics.profitMargin}% profit margin is really healthy - way above the typical 45%.`,
      `Pretty solid overall. You've pulled in ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k recently, spent ₹${(businessData.overview.totalExpensesRecent / 1000).toFixed(0)}k, and pocketed about ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k. Your ${metrics.profitMargin}% margin is excellent for retail.`,
      `You're in good shape! Revenue of ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k with ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k profit means you're keeping ${metrics.profitMargin}% of every rupee. That's ${metrics.marginVsBenchmark > 0 ? metrics.marginVsBenchmark + ' points better than' : 'right in line with'} industry standards.`
    ];
    return this.randomChoice(variations);
  }

  generateFinancialInsight(input, metrics) {
    if (input.includes('margin') || input.includes('profitable')) {
      const variations = [
        `Your profit margin is sitting at ${metrics.profitMargin}%, which is really healthy for retail. Industry average is around 45%, so you're doing ${metrics.marginVsBenchmark} points better. Nice work keeping costs under control.`,
        `That margin is strong - ${metrics.profitMargin}%. You're keeping about ${(metrics.profitMargin / 100).toFixed(2)} rupees of every rupee after expenses, which beats most retail businesses.`,
        `${metrics.profitMargin}% profit margin - that's excellent actually. Most retailers are lucky to see 45%, so you're outperforming the benchmark by ${metrics.marginVsBenchmark} points.`
      ];
      return this.randomChoice(variations);
    }
    
    const variations = [
      `Financially, you're in solid shape. Revenue at ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k, expenses at ₹${(businessData.overview.totalExpensesRecent / 1000).toFixed(0)}k, netting ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k. That's a ${metrics.profitMargin}% margin, which is ${metrics.marginVsBenchmark} points above industry average.`,
      `The numbers look good. You're spending about ${metrics.expenseRatio}% of revenue on expenses and keeping ${metrics.profitMargin}% as profit. That efficiency is well above what most retailers manage.`,
      `Strong financial position - ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k profit on ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k revenue. Your ${metrics.profitMargin}% margin tells me you're managing costs really well.`
    ];
    return this.randomChoice(variations);
  }

  generateInventoryInsight(input, metrics) {
    const outOfStock = businessData.products.outOfStock;
    
    if (input.includes('critical') || input.includes('urgent') || input.includes('immediate')) {
      return `You've got ${outOfStock.length} items completely out - red rice flakes and urad dal flour. Between them, that's probably costing you ₹${metrics.estimatedWeeklyLossFromOutOfStock} a week in lost sales. I'd prioritize getting those restocked ASAP.`;
    }
    
    const variations = [
      `Yeah, two items hit zero - the fine red rice flakes and urad dal flour. With those normally moving about 12 and 8 units weekly, you're missing sales every day they're out. Plus ${metrics.lowStockItems.length} other items are running under 50 units.`,
      `You've got ${outOfStock.length} items completely out of stock right now - red rice flakes and urad dal porridge flour. That's probably costing you around ₹${metrics.estimatedWeeklyLossFromOutOfStock} a week. Everything else looks decent, though ${metrics.criticalStockItems.length} items are near their reorder points.`,
      `Two items need immediate attention - red rice flakes and urad dal flour are at zero. Based on their usual sales velocity, every week they're out is lost revenue. I'm also seeing ${metrics.lowStockItems.length} items getting low, under 50 units each.`,
      `Your inventory health score is ${metrics.inventoryHealthScore}%. The main issue is those 2 out-of-stock items - red rice flakes and urad dal flour. Get those restocked and you're back in good shape. ${metrics.wellStockedItems.length} items are well-stocked above 150 units.`
    ];
    return this.randomChoice(variations);
  }

  generateCustomerInsight(input, metrics) {
    if (input.includes('best') || input.includes('top') || input.includes('biggest') || input.includes('main')) {
      const variations = [
        `Definitely Porur Bulk Traders - they're your anchor customer at ₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k. T Nagar Provisions and Chennai Super Mart round out the top 3. Together, those three account for ${metrics.top3Percentage}% of your revenue, so keeping them happy is critical.`,
        `Porur Bulk Traders is your MVP by far - ₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k in revenue. Add in T Nagar Provisions at ₹${(businessData.customers[1].revenue / 1000).toFixed(0)}k and Chennai Super Mart at ₹${(businessData.customers[2].revenue / 1000).toFixed(0)}k, and those three are basically carrying ${metrics.top3Percentage}% of your business.`,
        `Your top customer is Porur Bulk Traders hands down - ₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k, which is more than double your #2. Your top 3 together represent ${metrics.top3Percentage}% of revenue, so they're worth extra attention.`
      ];
      return this.randomChoice(variations);
    }
    
    if (input.includes('risk') || input.includes('worry') || input.includes('concern')) {
      return `You've got ${metrics.atRiskCustomers.length} customers I'd call at-risk - ${metrics.atRiskCustomers.map(c => c.name).join(', ')}. They haven't ordered recently, which might mean they're going elsewhere. Worth a quick check-in to keep those relationships warm.`;
    }
    
    const variations = [
      `You've got 9 active customers, but it's really a tale of two groups. Your top 3 bring in ${metrics.top3Percentage}% of revenue - that's heavy concentration. The good news is Porur Bulk Traders at ₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k is stable and loyal.`,
      `Customer base is 9 strong, with ${metrics.growingCustomers.length} showing growth. The concentration risk is real though - ${metrics.top3Percentage}% from your top 3 means you need to keep them very happy. Average customer value is ₹${metrics.avgCustomerValue}.`,
      `Looking at your customer spread, it's pretty top-heavy. Porur Bulk Traders alone is ₹${(businessData.customers[0].revenue / 1000).toFixed(0)}k, and your top 3 make up ${metrics.top3Percentage}% of everything. That's both good news - they're loyal - and a dependency worth managing.`
    ];
    return this.randomChoice(variations);
  }

  generateExpenseInsight(metrics) {
    const variations = [
      `Salaries dominate your expenses at ₹69k - that's ${metrics.salaryPercentage}% of your total ₹${(businessData.expenses.total / 1000).toFixed(0)}k spend. Then you've got rent at ₹15k, utilities around ₹6k, and smaller amounts for marketing and transportation. Pretty standard cost structure for retail.`,
      `Most of it's going to your team - ₹69k in salaries, about ${metrics.salaryPercentage}% of total expenses. Add ₹15k rent and ₹6k utilities, and you're at ₹90k in fixed costs. The remaining ₹9k is marketing, transport, and supplies - all variable.`,
      `Your biggest line item is definitely people - ₹69k in salaries (${metrics.salaryPercentage}%). Rent's ₹15k, utilities ₹6k. Together, your fixed costs are about ₹84k monthly, with ₹${(metrics.variableCosts / 1000).toFixed(0)}k in variables like marketing and delivery.`,
      `Breaking it down: ₹69k for salaries (${metrics.salaryPercentage}%), ₹15k rent, ₹6k utilities - that's ₹90k in mostly fixed costs. You're spending about ${metrics.expenseRatio}% of revenue on expenses total, which is pretty efficient.`
    ];
    return this.randomChoice(variations);
  }

  generateRevenueInsight(metrics) {
    const variations = [
      `Your all-time revenue is ₹${(businessData.overview.totalRevenueAllTime / 100000).toFixed(2)} lakhs across ${businessData.overview.totalActiveCustomers} customers. For the recent period, it's ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k, which works out to an average of about ₹${metrics.avgCustomerValue} per customer lifetime value.`,
      `You've pulled in ₹${(businessData.overview.totalRevenueAllTime / 100000).toFixed(2)}L total, with ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k coming in recently. Average customer value sits at ₹${metrics.avgCustomerValue}, though your top 3 customers pull that number way up.`,
      `Recent revenue of ₹${(businessData.overview.totalRevenueRecent / 1000).toFixed(0)}k puts you on track for strong continued performance. All-time you're at ₹${(businessData.overview.totalRevenueAllTime / 100000).toFixed(2)} lakhs. With ${businessData.overview.totalActiveCustomers} customers, that's ₹${metrics.avgCustomerValue} average lifetime value.`
    ];
    return this.randomChoice(variations);
  }

  generateProfitInsight(metrics) {
    const variations = [
      `You've made ₹${(businessData.overview.totalProfitAllTime / 100000).toFixed(2)} lakhs all-time. Recently, net profit is ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k with a ${metrics.profitMargin}% margin - that's actually ${metrics.marginVsBenchmark} points better than typical retail margins. Really solid performance.`,
      `Profit picture looks good - ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k recently on a ${metrics.profitMargin}% margin. That beats the industry standard of 45% by ${metrics.marginVsBenchmark} points. All-time you're at ₹${(businessData.overview.totalProfitAllTime / 100000).toFixed(2)}L.`,
      `Your ${metrics.profitMargin}% profit margin is excellent - way above the 45% industry benchmark. You're netting ₹${(businessData.overview.netProfitRecent / 1000).toFixed(0)}k recently, with ₹${(businessData.overview.totalProfitAllTime / 100000).toFixed(2)}L lifetime. You're doing something right with cost control.`
    ];
    return this.randomChoice(variations);
  }

  generateProblemsInsight(metrics) {
    const issues = [];
    
    if (metrics.outOfStockCount > 0) {
      issues.push(`${metrics.outOfStockCount} out-of-stock items costing you roughly ₹${metrics.estimatedWeeklyLossFromOutOfStock} weekly`);
    }
    
    if (metrics.top3Percentage > 70) {
      issues.push(`heavy customer concentration at ${metrics.top3Percentage}% from top 3`);
    }
    
    if (metrics.atRiskCustomers.length > 0) {
      issues.push(`${metrics.atRiskCustomers.length} customers haven't ordered recently`);
    }
    
    if (issues.length === 0) {
      return "Honestly, things look pretty clean. No major red flags jumping out. Your margins are healthy, inventory's mostly in good shape, and customers are active. Just keep doing what you're doing.";
    }
    
    const mainIssue = issues[0];
    const additionalContext = issues.length > 1 ? ` Also, ${issues.slice(1).join(' and ')}.` : '';
    
    return `Main thing to watch is ${mainIssue}.${additionalContext} Otherwise, your business fundamentals are solid - good margins, controlled expenses.`;
  }

  generateGoodNewsInsight(metrics) {
    const wins = [];
    
    if (parseFloat(metrics.marginVsBenchmark) > 10) {
      wins.push(`your ${metrics.profitMargin}% profit margin crushes the industry average by ${metrics.marginVsBenchmark} points`);
    }
    
    if (metrics.growingCustomers.length > 0) {
      wins.push(`${metrics.growingCustomers.length} customers showing growth`);
    }
    
    if (parseFloat(metrics.expenseRatio) < 35) {
      wins.push(`expenses only ${metrics.expenseRatio}% of revenue - that's super efficient`);
    }
    
    if (wins.length === 0) {
      wins.push(`solid ${metrics.profitMargin}% profit margin`);
      wins.push(`${businessData.overview.totalActiveCustomers} active customer relationships`);
    }
    
    return `Great question! Here's what's working: ${wins[0]}. Plus, ${wins.slice(1).join(', ')}. Your financial health score is ${metrics.financialHealthScore}/100, which is strong.`;
  }

  generateRiskAnalysis(metrics) {
    const risks = [];
    
    if (parseFloat(metrics.top3Percentage) > 70) {
      risks.push(`Customer concentration is your biggest risk - ${metrics.top3Percentage}% from top 3 customers means if any of them reduce orders, it hits hard`);
    }
    
    if (metrics.atRiskCustomers.length > 0) {
      risks.push(`${metrics.atRiskCustomers.length} customers haven't ordered recently - might be drifting away`);
    }
    
    if (metrics.outOfStockCount > 0) {
      risks.push(`Out-of-stock items losing you ₹${metrics.estimatedWeeklyLossFromOutOfStock} weekly in revenue`);
    }
    
    if (risks.length === 0) {
      return "Your risk profile is actually pretty low. Customer base is active, margins are healthy, and you're not over-leveraged on any single dependency. Keep monitoring those inventory levels and you're in good shape.";
    }
    
    return `${risks[0]}. ${risks.length > 1 ? 'Also, ' + risks.slice(1).join('. ') + '.' : ''} That said, your strong margins give you buffer to handle these.`;
  }

  generateOpportunityInsight(metrics) {
    const opportunities = [];
    
    if (parseFloat(metrics.profitMargin) > 60) {
      opportunities.push(`With ${metrics.profitMargin}% margins, you could afford to invest more in marketing to grow your customer base`);
    }
    
    if (metrics.atRiskCustomers.length > 0) {
      opportunities.push(`Re-engaging those ${metrics.atRiskCustomers.length} at-risk customers could add back ₹${(metrics.atRiskCustomers.reduce((sum, c) => sum + c.revenue, 0) / 1000).toFixed(0)}k in revenue`);
    }
    
    if (parseFloat(metrics.top3Percentage) > 70) {
      opportunities.push(`Diversifying beyond your top 3 customers would reduce concentration risk and stabilize revenue`);
    }
    
    if (businessData.customers.filter(c => c.segment === 'Low Value').length > 0) {
      opportunities.push(`Your low-value customers have potential - focused attention could move them up to medium or high value`);
    }
    
    if (opportunities.length === 0) {
      return "Main opportunity I see is leveraging your strong margins to grow. You could invest in marketing, expand inventory, or even offer better payment terms to attract larger customers. Your fundamentals support growth.";
    }
    
    return `${opportunities[0]}. ${opportunities.length > 1 ? opportunities[1] : ''} Your strong financial position gives you room to invest in growth.`;
  }

  generateSpecificCustomerInfo(input) {
    const customer = businessData.customers.find(c => 
      input.includes(c.name.toLowerCase().split(' ')[0].toLowerCase()) ||
      input.includes(c.name.toLowerCase())
    );
    
    if (customer) {
      this.contextMemory.customerMentioned = customer.name;
      
      const daysSinceOrder = this.estimateDaysSinceOrder(customer.lastOrderDate);
      const trendEmoji = customer.growthTrend === 'growing' ? '📈' : customer.growthTrend === 'declining' ? '📉' : '➡️';
      
      const variations = [
        `${customer.name} is a ${customer.segment.toLowerCase()} customer who's brought in ₹${(customer.revenue / 1000).toFixed(0)}k with ₹${(customer.profit / 1000).toFixed(0)}k profit. They ordered ${daysSinceOrder} days ago and trend is ${customer.growthTrend}. Definitely worth keeping happy.`,
        `${customer.name} - ₹${(customer.revenue / 1000).toFixed(0)}k revenue, ₹${(customer.profit / 1000).toFixed(0)}k profit, ${customer.segment.toLowerCase()} segment. Last order was ${daysSinceOrder} days back. They're ${customer.growthTrend}, so ${customer.riskLevel === 'low' ? 'looking solid' : 'worth some attention'}.`,
        `Let me check... ${customer.name} has generated ₹${(customer.revenue / 1000).toFixed(0)}k for you with ${customer.orders} orders (₹${customer.avgOrderValue.toFixed(0)} avg). ${customer.growthTrend === 'growing' ? 'They\'re growing, which is great.' : customer.growthTrend === 'at-risk' ? 'Haven\'t ordered in ' + daysSinceOrder + ' days though - might need a check-in.' : 'Pretty stable customer.'}`
      ];
      
      return this.randomChoice(variations);
    }
    
    return "Hmm, I don't have specific info on that customer in my data. Want to know about your top performers or at-risk customers instead?";
  }

  handleFollowUp(input, metrics) {
    const lastTopic = this.contextMemory.discussedTopics[this.contextMemory.discussedTopics.length - 1];
    
    if (input.includes('more') || input.includes('tell me') || input.includes('what about') || input.includes('also')) {
      
      if (lastTopic === 'customers') {
        return `After the top 3, you've got Velachery Mini Supermarket at ₹${(businessData.customers[3].revenue / 1000).toFixed(0)}k and ADAMBAKKAM ORGANIC SHOP at ₹${(businessData.customers[4].revenue / 1000).toFixed(0)}k. Both are solid performers. ADAMBAKKAM has a really nice 100% profit margin, actually.`;
      }
      
      if (lastTopic === 'inventory') {
        return `Your best-stocked items are Mixed Vegetables at 320 units, Tomato Paste at 220, and Basmati Rice at 200. You're in excellent shape on those - no worry about running out anytime soon.`;
      }
      
      if (lastTopic === 'expenses') {
        return `Your expense ratio of ${metrics.expenseRatio}% is actually really good - means you're keeping ${(100 - parseFloat(metrics.expenseRatio)).toFixed(1)}% as gross margin. Fixed costs are ₹84k monthly, so anything above that in revenue goes mostly to profit.`;
      }
      
      if (lastTopic === 'finances') {
        return `Your financial health score is ${metrics.financialHealthScore}/100. Strong profit margin, controlled expenses, and decent cash generation. The main thing to watch is customer concentration at ${metrics.top3Percentage}% from top 3.`;
      }
    }
    
    if (input.includes('why') || input.includes('how')) {
      if (lastTopic === 'profit') {
        return `Your high profit margin comes from two things: good pricing discipline and controlled expenses. You're spending only ${metrics.expenseRatio}% of revenue on operations, which is quite efficient for retail.`;
      }
    }
    
    return this.generateContextualHelp();
  }

  generateSmartFallback(userInput) {
    const metrics = this.calculateMetrics();
    
    // Try to extract what they might be asking about
    if (userInput.toLowerCase().includes('customer')) {
      return this.generateCustomerInsight(userInput.toLowerCase(), metrics);
    }
    if (userInput.toLowerCase().includes('stock') || userInput.toLowerCase().includes('inventory')) {
      return this.generateInventoryInsight(userInput.toLowerCase(), metrics);
    }
    if (userInput.toLowerCase().includes('profit') || userInput.toLowerCase().includes('money')) {
      return this.generateProfitInsight(metrics);
    }
    
    return this.generateContextualHelp();
  }

  generateContextualHelp() {
    const notDiscussed = ['revenue', 'expenses', 'customers', 'inventory', 'profit', 'risks', 'opportunities'].filter(
      topic => !this.contextMemory.discussedTopics.includes(topic)
    );
    
    if (notDiscussed.length > 0 && this.conversationHistory.length > 2) {
      const suggestions = notDiscussed.slice(0, 2).join(' or ');
      return `I don't have that specific detail, but I can help with ${suggestions}. Or ask me anything about your business - I'm pretty good at connecting the dots.`;
    }
    
    const variations = [
      "I'm not sure about that exact thing, but I can tell you about sales, customers, inventory, or expenses. What would be most helpful?",
      "Hmm, that's not in my data. Want to know about your margins, top customers, or inventory situation instead?",
      "Don't have that particular info, but feel free to ask about revenue, profit, customer trends, or stock levels. What's on your mind?"
    ];
    
    return this.randomChoice(variations);
  }

  getGoodbyeMessage() {
    const metrics = this.calculateMetrics();
    
    // Add a parting insight if there's something important
    if (metrics.outOfStockCount > 0 && !this.contextMemory.discussedTopics.includes('inventory')) {
      return "Sounds good! Quick reminder - you've got 2 items out of stock worth restocking. Call anytime you need numbers!";
    }
    
    const variations = [
      "Great! Feel free to call whenever you need an update. Have a great day!",
      "Sounds good! I'm here anytime you want to check on things. Take care!",
      "Perfect! Call me whenever you need the numbers. Have a good one!",
      "Anytime! Always happy to help you stay on top of things. Talk soon!"
    ];
    return this.randomChoice(variations);
  }

  // Helper methods
  trackTopic(topic) {
    if (!this.contextMemory.discussedTopics.includes(topic)) {
      this.contextMemory.discussedTopics.push(topic);
    }
  }

  classifyIntent(input) {
    if (this.isBusinessOverview(input)) return 'overview';
    if (this.isFinancialQuery(input)) return 'financial';
    if (this.isCustomerQuery(input)) return 'customer';
    if (this.isInventoryQuery(input)) return 'inventory';
    if (this.isProblemsQuery(input)) return 'problems';
    if (this.isGoodNewsQuery(input)) return 'positive';
    return 'other';
  }

  estimateDaysSinceOrder(dateString) {
    // Simple estimation - in production you'd use actual date parsing
    const today = new Date('2025-10-25');
    const orderDate = new Date(dateString + ', 2025');
    const diffTime = Math.abs(today - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomOpening() {
    return this.randomChoice(this.openingVariations);
  }

  // Enhanced pattern matching with fuzzy matching
  isGreeting(input) {
    return /^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo)($|\s)/i.test(input);
  }

  isBusinessOverview(input) {
    return /how('s| is|s) (business|things|everything|doing|going)|overall|status|summary|update|big picture|state of|health of.*business/i.test(input);
  }

  isFinancialQuery(input) {
    return /financial|margin|profit.*margin|how.*profitable|fiscal|economic|monetary/i.test(input);
  }

  isInventoryQuery(input) {
    return /stock|inventory|low|out of|reorder|shortage|need.*stock|running.*(out|low)|what.*need.*order/i.test(input);
  }

  isCustomerQuery(input) {
    return /(best|top|biggest|main|key|important|major) customer|who('s| is).*(best|top|main|buying)|customer.*(focus|priority|concentrate)/i.test(input);
  }

  isExpenseQuery(input) {
    return /expense|spending|cost|paid|bills?|where.*money.*go|what.*spend|burn rate/i.test(input);
  }

  isRevenueQuery(input) {
    return /revenue|sales|income|earnings|total.*sales|how.*much.*(made|earn|bring|pull)|top.*line/i.test(input);
  }

  isProfitQuery(input) {
    return /\bprofit|margin|earnings|net.*income|how.*much.*(earn|make|profit|keep|net)|bottom.*line/i.test(input);
  }

  isProblemsQuery(input) {
    return /problem|issue|worry|concern|wrong|trouble|risk|red flag|warning|bad.*news|what.*fix/i.test(input);
  }

  isGoodNewsQuery(input) {
    return /good.*news|positive|win|success|doing.*well|what.*good|bright.*spot|working.*well|strong/i.test(input);
  }

  isRiskQuery(input) {
    return /risk|risky|danger|vulnerable|threat|worry.*about|concern.*about|what.*could.*wrong/i.test(input);
  }

  isOpportunityQuery(input) {
    return /opportunit|potential|grow|expand|improve|optimize|better|increase|boost|enhance/i.test(input);
  }

  isSpecificCustomerQuery(input) {
    return businessData.customers.some(c => {
      const firstName = c.name.toLowerCase().split(' ')[0];
      const fullName = c.name.toLowerCase();
      return input.includes(firstName) || input.includes(fullName);
    });
  }

  isFollowUp(input) {
    return (/more|else|also|what about|tell.*more|continue|and\s|additionally|plus/i.test(input) && 
            this.conversationHistory.length > 2) ||
           (/why|how come|what.*mean/i.test(input) && this.contextMemory.discussedTopics.length > 0);
  }

  isGoodbye(input) {
    return /^(bye|goodbye|thanks|thank you|that('s| is) (all|it|enough)|nothing else|that.*all|i.*good|see.*later|talk.*later|gotta.*go)($|\s)/i.test(input);
  }

  /**
   * Reset conversation
   */
  reset() {
    this.conversationHistory = [];
    this.contextMemory = {
      discussedTopics: [],
      lastQuestion: null,
      customerMentioned: null,
      concernsRaised: [],
      conversationFlow: [],
      userPreferences: {
        detailLevel: 'balanced',
        focusAreas: []
      }
    };
  }

  /**
   * Get opening message
   */
  getOpeningMessage() {
    return this.getRandomOpening();
  }
}