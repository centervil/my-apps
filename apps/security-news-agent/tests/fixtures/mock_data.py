"""Mock data for testing."""

from typing import Dict, Any, List

# Mock Tavily API responses
MOCK_TAVILY_RESPONSE = {
    "results": [
        {
            "title": "Critical Security Vulnerability Discovered in Popular Framework",
            "url": "https://thehackernews.com/2025/09/critical-vulnerability-framework.html",
            "content": "A critical vulnerability (CVE-2025-1234) has been discovered in a widely-used web framework that could allow remote code execution. The vulnerability affects versions 2.0 through 3.5 and has a CVSS score of 9.8. Security researchers from multiple organizations have confirmed the issue and recommend immediate patching. Proof-of-concept exploits are already circulating in underground forums."
        },
        {
            "title": "Major Data Breach Affects 50 Million Users at Tech Giant",
            "url": "https://bleepingcomputer.com/2025/09/major-data-breach-tech-company.html",
            "content": "A major technology company has disclosed a data breach affecting approximately 50 million user accounts. The breach, discovered on September 12, 2025, included personal information such as names, email addresses, phone numbers, and encrypted passwords. The company states that payment information was not compromised. Law enforcement and regulatory authorities have been notified."
        },
        {
            "title": "New Malware Campaign Targets Financial Institutions Worldwide",
            "url": "https://krebsonsecurity.com/2025/09/malware-campaign-financial-institutions.html",
            "content": "Cybersecurity firms have identified a sophisticated malware campaign specifically targeting financial institutions across North America and Europe. The malware, dubbed 'FinStealer', uses advanced persistent threat techniques and has successfully infiltrated at least 12 banks. The campaign appears to be state-sponsored and focuses on stealing transaction data and customer information."
        },
        {
            "title": "Zero-Day Exploit in Popular VPN Software Under Active Attack",
            "url": "https://darkreading.com/2025/09/zero-day-vpn-software-attack.html",
            "content": "Security researchers have discovered a zero-day vulnerability in a popular VPN software that is being actively exploited in the wild. The vulnerability allows attackers to bypass authentication and gain unauthorized access to corporate networks. Over 10,000 organizations worldwide are believed to be using the affected software version. Emergency patches are being developed."
        },
        {
            "title": "Ransomware Group Claims Attack on Healthcare Network",
            "url": "https://securityweek.com/2025/09/ransomware-healthcare-network.html",
            "content": "A prominent ransomware group has claimed responsibility for an attack on a major healthcare network, potentially affecting patient data for over 2 million individuals. The attack occurred on September 10, 2025, and has disrupted operations at multiple hospitals and clinics. The healthcare network is working with federal authorities and cybersecurity experts to assess the full impact."
        }
    ]
}

# Mock search queries for different security topics
MOCK_SEARCH_QUERIES = [
    {"q": "latest cybersecurity news", "include_domains": ["thehackernews.com", "bleepingcomputer.com"]},
    {"q": "latest vulnerability reports", "include_domains": ["krebsonsecurity.com", "darkreading.com"]},
    {"q": "data breach notifications", "include_domains": ["securityweek.com", "infosecurity-magazine.com"]},
    {"q": "malware trends", "include_domains": ["crowdstrike.com/blog", "paloaltonetworks.com/blog"]},
    {"q": "zero-day exploits", "include_domains": ["zerodayinitiative.com/blog", "threatpost.com"]}
]

# Mock context data after processing
MOCK_CONTEXT_DATA = {
    "latest cybersecurity news": [
        {
            "title": "Critical Security Vulnerability Discovered in Popular Framework",
            "url": "https://thehackernews.com/2025/09/critical-vulnerability-framework.html",
            "content": "A critical vulnerability (CVE-2025-1234) has been discovered in a widely-used web framework..."
        },
        {
            "title": "Major Data Breach Affects 50 Million Users at Tech Giant", 
            "url": "https://bleepingcomputer.com/2025/09/major-data-breach-tech-company.html",
            "content": "A major technology company has disclosed a data breach affecting approximately 50 million user accounts..."
        }
    ],
    "latest vulnerability reports": [
        {
            "title": "Zero-Day Exploit in Popular VPN Software Under Active Attack",
            "url": "https://darkreading.com/2025/09/zero-day-vpn-software-attack.html", 
            "content": "Security researchers have discovered a zero-day vulnerability in a popular VPN software..."
        }
    ],
    "malware trends": [
        {
            "title": "New Malware Campaign Targets Financial Institutions Worldwide",
            "url": "https://krebsonsecurity.com/2025/09/malware-campaign-financial-institutions.html",
            "content": "Cybersecurity firms have identified a sophisticated malware campaign specifically targeting financial institutions..."
        }
    ]
}

# Mock Gemini LLM responses
MOCK_OUTLINE_RESPONSE = """
- Critical Framework Vulnerability (CVE-2025-1234) - Remote code execution risk affecting versions 2.0-3.5 [https://thehackernews.com/2025/09/critical-vulnerability-framework.html]
- Major Data Breach at Tech Giant - 50 million users affected, personal data compromised [https://bleepingcomputer.com/2025/09/major-data-breach-tech-company.html]
- Financial Malware Campaign - 'FinStealer' targets banks across North America and Europe [https://krebsonsecurity.com/2025/09/malware-campaign-financial-institutions.html]
- Zero-Day VPN Exploit - Active attacks on popular VPN software affecting 10,000+ organizations [https://darkreading.com/2025/09/zero-day-vpn-software-attack.html]
- Healthcare Ransomware Attack - 2 million patient records potentially compromised [https://securityweek.com/2025/09/ransomware-healthcare-network.html]
"""

MOCK_TOC_RESPONSE = """
{
  "toc": [
    "Executive Summary",
    "Critical Vulnerabilities",
    "Data Breach Analysis", 
    "Malware Threats",
    "Zero-Day Exploits",
    "Ransomware Incidents",
    "Recommendations",
    "Conclusion"
  ]
}
"""

MOCK_SLIDE_CONTENT = """# Daily Security Briefing - 2025-09-14

## Executive Summary

Today's threat landscape presents several critical security concerns requiring immediate attention across multiple sectors.

## Critical Vulnerabilities

### Framework Vulnerability (CVE-2025-1234)
- **Severity**: Critical (CVSS 9.8)
- **Impact**: Remote code execution
- **Affected**: Versions 2.0-3.5
- **Status**: Proof-of-concept exploits circulating
- **Action**: Immediate patching required

## Data Breach Analysis

### Tech Giant Breach
- **Scale**: 50 million users affected
- **Data**: Names, emails, phone numbers, encrypted passwords
- **Timeline**: Discovered September 12, 2025
- **Status**: Law enforcement notified

## Malware Threats

### FinStealer Campaign
- **Target**: Financial institutions
- **Scope**: North America and Europe
- **Impact**: 12 banks infiltrated
- **Attribution**: Suspected state-sponsored

## Zero-Day Exploits

### VPN Software Vulnerability
- **Status**: Under active attack
- **Impact**: Authentication bypass
- **Scope**: 10,000+ organizations affected
- **Response**: Emergency patches in development

## Ransomware Incidents

### Healthcare Network Attack
- **Impact**: 2 million patient records
- **Timeline**: September 10, 2025
- **Status**: Operations disrupted
- **Response**: Federal investigation ongoing

## Recommendations

1. **Immediate Actions**
   - Apply framework security patches
   - Review VPN software versions
   - Monitor for unusual network activity

2. **Medium-term Measures**
   - Implement additional authentication layers
   - Enhance backup and recovery procedures
   - Conduct security awareness training

3. **Long-term Strategy**
   - Regular vulnerability assessments
   - Incident response plan updates
   - Third-party security audits

## Conclusion

The current threat landscape requires heightened vigilance and immediate action on critical vulnerabilities while maintaining robust defense-in-depth strategies."""

MOCK_EVALUATION_RESPONSE = """
{
  "score": 8.7,
  "subscores": {
    "structure": 8.5,
    "accuracy": 9.0,
    "clarity": 8.8,
    "conciseness": 8.5
  },
  "reasons": {
    "structure": "Well-organized with clear sections and logical flow from executive summary to specific threats",
    "accuracy": "All information accurately reflects the provided news sources with proper attribution",
    "clarity": "Clear language and effective use of bullet points for easy comprehension",
    "conciseness": "Concise presentation without unnecessary redundancy, straight to the point"
  },
  "suggestions": [
    "Consider adding timeline visualization for better context",
    "Include risk assessment matrix for prioritization"
  ],
  "pass": true,
  "feedback": "Excellent security briefing with comprehensive coverage of current threats and actionable recommendations"
}
"""