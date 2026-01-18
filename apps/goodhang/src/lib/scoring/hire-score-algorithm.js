// Hire Score Algorithm
// Calculates a 0-100 score for each contact based on:
// - Persona Match (0-40): How well they match ideal job title/seniority
// - Company Match (0-40): How well their company matches target type
// - Hiring Signal Bonus (0-20): Are they actively hiring?

class HireScoreCalculator {
  constructor(userPreferences) {
    this.prefs = userPreferences;
  }

  // Main scoring function
  calculateScore(contact, company) {
    const personaScore = this.calculatePersonaMatch(contact);
    const companyScore = this.calculateCompanyMatch(company);
    const hiringBonus = this.calculateHiringBonus(contact, company);

    const totalScore = personaScore + companyScore + hiringBonus;

    return {
      hire_score: Math.min(totalScore, 100), // Cap at 100
      persona_match_score: personaScore,
      company_match_score: companyScore,
      hiring_signal_bonus: hiringBonus
    };
  }

  // Persona Match (0-40 points)
  calculatePersonaMatch(contact) {
    let score = 0;

    // Job Title Match (0-25 points)
    const titleScore = this.matchJobTitle(contact.job_title);
    score += titleScore;

    // Seniority Match (0-10 points)
    const seniorityScore = this.matchSeniority(contact.seniority_level);
    score += seniorityScore;

    // Industry/Skills Match (0-5 points)
    const skillsScore = this.matchSkills(contact.skills);
    score += skillsScore;

    return Math.min(score, 40); // Cap at 40
  }

  // Job Title Matching
  matchJobTitle(jobTitle) {
    if (!jobTitle || !this.prefs.ideal_job_titles?.length) return 0;

    const normalizedTitle = jobTitle.toLowerCase();
    const idealTitles = this.prefs.ideal_job_titles.map(t => t.toLowerCase());

    // Exact match
    if (idealTitles.includes(normalizedTitle)) {
      return 25;
    }

    // Fuzzy match - check if any ideal title is contained in actual title
    for (const idealTitle of idealTitles) {
      if (normalizedTitle.includes(idealTitle)) {
        return 20;
      }
      if (this.calculateSimilarity(normalizedTitle, idealTitle) > 0.7) {
        return 18;
      }
    }

    // Partial word match
    const titleWords = normalizedTitle.split(/\s+/);
    const idealWords = idealTitles.flatMap(t => t.split(/\s+/));

    const matchingWords = titleWords.filter(word =>
      word.length > 3 && idealWords.includes(word)
    );

    if (matchingWords.length >= 2) return 15;
    if (matchingWords.length === 1) return 8;

    return 0;
  }

  // Seniority Level Matching
  matchSeniority(seniorityLevel) {
    if (!seniorityLevel || !this.prefs.ideal_seniority_levels?.length) return 0;

    const seniorities = this.prefs.ideal_seniority_levels.map(s => s.toLowerCase());
    const normalizedLevel = seniorityLevel.toLowerCase();

    // Exact match
    if (seniorities.includes(normalizedLevel)) {
      return 10;
    }

    // Adjacent seniority levels (e.g., Senior matches Lead)
    const seniorityHierarchy = [
      'intern', 'entry', 'associate', 'mid', 'senior', 'lead',
      'staff', 'principal', 'director', 'senior director', 'vp', 'svp', 'c-level'
    ];

    const targetIndex = seniorityHierarchy.indexOf(normalizedLevel);
    if (targetIndex === -1) return 0;

    for (const idealSeniority of seniorities) {
      const idealIndex = seniorityHierarchy.indexOf(idealSeniority);
      if (idealIndex === -1) continue;

      const distance = Math.abs(targetIndex - idealIndex);
      if (distance === 1) return 7;  // Adjacent level
      if (distance === 2) return 4;  // Two levels away
    }

    return 0;
  }

  // Skills/Industry Matching
  matchSkills(skills) {
    if (!skills || !skills.length || !this.prefs.ideal_skills?.length) return 0;

    const normalizedSkills = skills.map(s => s.toLowerCase());
    const idealSkills = this.prefs.ideal_skills.map(s => s.toLowerCase());

    const matchingSkills = normalizedSkills.filter(skill =>
      idealSkills.some(idealSkill =>
        skill.includes(idealSkill) || idealSkill.includes(skill)
      )
    );

    const matchRatio = matchingSkills.length / idealSkills.length;

    if (matchRatio >= 0.5) return 5;  // 50%+ skills match
    if (matchRatio >= 0.3) return 3;  // 30%+ skills match
    if (matchRatio >= 0.1) return 1;  // 10%+ skills match

    return 0;
  }

  // Company Match (0-40 points)
  calculateCompanyMatch(company) {
    if (!company) return 0;

    let score = 0;

    // Check deal breakers first
    if (this.hasDealBreaker(company)) {
      return -100; // Automatic disqualification
    }

    // Industry Match (0-15 points)
    score += this.matchIndustry(company.industry);

    // Company Size (0-10 points)
    score += this.matchCompanySize(company.company_size, company.employee_count);

    // Company Stage (0-10 points)
    score += this.matchCompanyStage(company.company_stage);

    // Location Match (0-5 points)
    score += this.matchLocation(company.headquarters, company.locations);

    return Math.min(score, 40); // Cap at 40
  }

  // Check for deal breakers
  hasDealBreaker(company) {
    if (!company) return false;

    // Excluded companies
    if (this.prefs.excluded_companies?.length) {
      const excludedNames = this.prefs.excluded_companies.map(n => n.toLowerCase());
      if (excludedNames.includes(company.name?.toLowerCase())) {
        return true;
      }
    }

    // Excluded industries
    if (this.prefs.excluded_industries?.length && company.industry) {
      const excludedIndustries = this.prefs.excluded_industries.map(i => i.toLowerCase());
      if (excludedIndustries.some(ex => company.industry.toLowerCase().includes(ex))) {
        return true;
      }
    }

    return false;
  }

  // Industry Matching
  matchIndustry(industry) {
    if (!industry || !this.prefs.target_industries?.length) return 0;

    const normalizedIndustry = industry.toLowerCase();
    const targetIndustries = this.prefs.target_industries.map(i => i.toLowerCase());

    // Exact match
    if (targetIndustries.includes(normalizedIndustry)) {
      return 15;
    }

    // Partial match
    for (const targetIndustry of targetIndustries) {
      if (normalizedIndustry.includes(targetIndustry) ||
          targetIndustry.includes(normalizedIndustry)) {
        return 10;
      }
    }

    return 0;
  }

  // Company Size Matching
  matchCompanySize(companySize, _employeeCount) {
    if (!this.prefs.target_company_sizes?.length) return 0;

    const targetSizes = this.prefs.target_company_sizes.map(s => s.toLowerCase());

    // Map company size buckets
    const sizeMapping = {
      'startup': ['1-10', '11-50'],
      'small': ['51-200'],
      'mid-market': ['201-500', '501-1000'],
      'midmarket': ['201-500', '501-1000'],
      'enterprise': ['1001-5000', '5001-10000', '10000+'],
      'large': ['1001-5000', '5001-10000', '10000+']
    };

    // Check exact size bucket match
    if (companySize && targetSizes.includes(companySize.toLowerCase())) {
      return 10;
    }

    // Check category match
    for (const [category, sizes] of Object.entries(sizeMapping)) {
      if (targetSizes.includes(category) && companySize && sizes.includes(companySize)) {
        return 10;
      }
    }

    return 0;
  }

  // Company Stage Matching
  matchCompanyStage(companyStage) {
    if (!companyStage || !this.prefs.target_company_stages?.length) return 0;

    const normalizedStage = companyStage.toLowerCase();
    const targetStages = this.prefs.target_company_stages.map(s => s.toLowerCase());

    if (targetStages.includes(normalizedStage)) {
      return 10;
    }

    // Adjacent stages
    const stageHierarchy = ['seed', 'series-a', 'series-b', 'series-c', 'series-d', 'pre-ipo', 'public'];
    const currentIndex = stageHierarchy.indexOf(normalizedStage);

    if (currentIndex !== -1) {
      for (const targetStage of targetStages) {
        const targetIndex = stageHierarchy.indexOf(targetStage);
        if (targetIndex !== -1 && Math.abs(currentIndex - targetIndex) === 1) {
          return 6; // Adjacent stage
        }
      }
    }

    return 0;
  }

  // Location Matching
  matchLocation(headquarters, locations) {
    if (!this.prefs.target_locations?.length) return 0;

    const targetLocations = this.prefs.target_locations.map(l => l.toLowerCase());

    // Check for "remote" preference
    if (targetLocations.includes('remote') && this.prefs.remote_preference === 'remote') {
      return 5; // Any company works for remote
    }

    // Check headquarters
    if (headquarters) {
      const normalizedHQ = headquarters.toLowerCase();
      if (targetLocations.some(loc => normalizedHQ.includes(loc))) {
        return 5;
      }
    }

    // Check all locations
    if (locations && locations.length) {
      const normalizedLocations = locations.map(l => l.toLowerCase());
      if (targetLocations.some(target =>
        normalizedLocations.some(loc => loc.includes(target))
      )) {
        return 5;
      }
    }

    return 0;
  }

  // Hiring Signal Bonus (0-20 points)
  calculateHiringBonus(contact, company) {
    let bonus = 0;

    // Posted "#hiring" recently (0-20 points)
    if (contact.posted_hiring_recently) {
      bonus += 20;
    }

    // Is a recruiter or hiring manager (0-15 points)
    if (contact.is_recruiter || contact.is_hiring_manager) {
      bonus += 15;
    }

    // Company has many open roles (0-10 points)
    if (company && company.open_roles_count) {
      if (company.open_roles_count >= 20) bonus += 10;
      else if (company.open_roles_count >= 10) bonus += 7;
      else if (company.open_roles_count >= 5) bonus += 4;
    }

    // Recently changed to new company (0-5 points)
    if (contact.recent_job_change) {
      bonus += 5;
    }

    return Math.min(bonus, 20); // Cap at 20
  }

  // String similarity (Dice coefficient)
  calculateSimilarity(str1, str2) {
    const bigrams1 = this.getBigrams(str1);
    const bigrams2 = this.getBigrams(str2);

    const intersection = bigrams1.filter(b => bigrams2.includes(b));
    return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
  }

  getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.HireScoreCalculator = HireScoreCalculator;
}
