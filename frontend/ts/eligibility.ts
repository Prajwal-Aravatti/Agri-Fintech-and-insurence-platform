/**
 * Loan Eligibility Calculator - TypeScript Module
 * Calculates loan eligibility based on farmer and farm data
 */

export interface FarmData {
  farmArea: number;        // in acres
  cropType: string;
  location: string;
  soilQuality?: string;
  irrigationType?: string;
}

export interface FarmerData {
  age: number;
  experience: number;      // years of farming experience
  previousLoans?: number;  // number of previous loans
  creditScore?: number;    // 0-100
}

export interface LoanRequest {
  amount: number;
  purpose: string;
  tenure: number;          // months
}

export interface EligibilityResult {
  eligible: boolean;
  maxLoanAmount: number;
  approvedAmount?: number;
  interestRate: number;
  tenure: number;
  reason: string;
  riskScore: number;       // 0-100, lower is better
}

/**
 * Calculate loan eligibility based on farm and farmer data
 */
export function calculateLoanEligibility(
  farmData: FarmData,
  farmerData: FarmerData,
  loanRequest: LoanRequest
): EligibilityResult {
  
  // Base eligibility checks
  if (farmData.farmArea < 0.5) {
    return {
      eligible: false,
      maxLoanAmount: 0,
      interestRate: 0,
      tenure: 0,
      reason: 'Farm area must be at least 0.5 acres',
      riskScore: 100
    };
  }
  
  if (loanRequest.amount <= 0) {
    return {
      eligible: false,
      maxLoanAmount: 0,
      interestRate: 0,
      tenure: 0,
      reason: 'Loan amount must be greater than zero',
      riskScore: 100
    };
  }
  
  // Calculate base maximum loan amount (₹50,000 per acre)
  const baseMaxLoan = farmData.farmArea * 50000;
  
  // Adjust based on crop type (some crops have higher value)
  const cropMultipliers: { [key: string]: number } = {
    'wheat': 1.0,
    'rice': 1.2,
    'corn': 1.1,
    'cotton': 1.3,
    'sugarcane': 1.15,
    'vegetables': 1.4,
    'fruits': 1.5
  };
  
  const cropMultiplier = cropMultipliers[farmData.cropType.toLowerCase()] || 1.0;
  let maxLoanAmount = baseMaxLoan * cropMultiplier;
  
  // Adjust based on farmer experience
  if (farmerData.experience >= 10) {
    maxLoanAmount *= 1.2;  // 20% increase for experienced farmers
  } else if (farmerData.experience >= 5) {
    maxLoanAmount *= 1.1;  // 10% increase
  }
  
  // Adjust based on credit score if available
  if (farmerData.creditScore !== undefined) {
    if (farmerData.creditScore >= 80) {
      maxLoanAmount *= 1.15;
    } else if (farmerData.creditScore >= 60) {
      maxLoanAmount *= 1.05;
    } else if (farmerData.creditScore < 40) {
      maxLoanAmount *= 0.8;  // Reduce for poor credit
    }
  }
  
  // Check if requested amount exceeds maximum
  if (loanRequest.amount > maxLoanAmount) {
    return {
      eligible: false,
      maxLoanAmount: Math.round(maxLoanAmount),
      interestRate: 0,
      tenure: 0,
      reason: `Requested amount exceeds maximum eligible amount of ₹${Math.round(maxLoanAmount).toLocaleString()}`,
      riskScore: 75
    };
  }
  
  // Calculate risk score (0-100, lower is better)
  let riskScore = 50;  // Base risk
  
  // Adjust risk based on farm area
  if (farmData.farmArea < 1) {
    riskScore += 10;
  } else if (farmData.farmArea >= 5) {
    riskScore -= 10;
  }
  
  // Adjust risk based on experience
  if (farmerData.experience < 2) {
    riskScore += 15;
  } else if (farmerData.experience >= 10) {
    riskScore -= 15;
  }
  
  // Adjust risk based on credit score
  if (farmerData.creditScore !== undefined) {
    if (farmerData.creditScore < 40) {
      riskScore += 20;
    } else if (farmerData.creditScore >= 80) {
      riskScore -= 20;
    }
  }
  
  // Adjust risk based on previous loans
  if (farmerData.previousLoans !== undefined) {
    if (farmerData.previousLoans === 0) {
      riskScore += 5;  // First-time borrower
    } else if (farmerData.previousLoans > 3) {
      riskScore += 10;  // Multiple loans might indicate risk
    }
  }
  
  // Ensure risk score is within bounds
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Calculate interest rate based on risk score
  // Base rate: 8.5%, adjusted by risk
  let interestRate = 8.5;
  if (riskScore > 70) {
    interestRate = 12.0;
  } else if (riskScore > 50) {
    interestRate = 10.0;
  } else if (riskScore < 30) {
    interestRate = 7.0;
  }
  
  // Determine approved amount (may be less than requested)
  let approvedAmount = loanRequest.amount;
  if (riskScore > 60 && loanRequest.amount > maxLoanAmount * 0.8) {
    approvedAmount = Math.round(maxLoanAmount * 0.8);
  }
  
  // Validate tenure
  const maxTenure = 24;  // Maximum 24 months
  const minTenure = 6;   // Minimum 6 months
  let approvedTenure = loanRequest.tenure;
  
  if (approvedTenure > maxTenure) {
    approvedTenure = maxTenure;
  } else if (approvedTenure < minTenure) {
    approvedTenure = minTenure;
  }
  
  return {
    eligible: true,
    maxLoanAmount: Math.round(maxLoanAmount),
    approvedAmount: Math.round(approvedAmount),
    interestRate: parseFloat(interestRate.toFixed(2)),
    tenure: approvedTenure,
    reason: 'Loan approved based on eligibility criteria',
    riskScore: Math.round(riskScore)
  };
}

/**
 * Calculate EMI (Equated Monthly Installment)
 */
export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number {
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Math.round(emi);
}

/**
 * Validate loan request data
 */
export function validateLoanRequest(
  farmData: FarmData,
  farmerData: FarmerData,
  loanRequest: LoanRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!farmData.farmArea || farmData.farmArea <= 0) {
    errors.push('Farm area must be greater than zero');
  }
  
  if (!farmData.cropType || farmData.cropType.trim() === '') {
    errors.push('Crop type is required');
  }
  
  if (!loanRequest.amount || loanRequest.amount <= 0) {
    errors.push('Loan amount must be greater than zero');
  }
  
  if (!loanRequest.tenure || loanRequest.tenure < 6) {
    errors.push('Loan tenure must be at least 6 months');
  }
  
  if (farmerData.age < 18) {
    errors.push('Farmer must be at least 18 years old');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export for use in JavaScript
if (typeof window !== 'undefined') {
  (window as any).LoanEligibilityCalculator = {
    calculateLoanEligibility,
    calculateEMI,
    validateLoanRequest
  };
}

