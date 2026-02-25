flowchart TD
    A[Data Ingestion] --> B[Intelligence Analysis]
    B --> C[Risk Score 0-10]
    B --> D[Opportunity Score 0-10]
    B --> E[Days Until Renewal]
    B --> F[Customer Strategic Plan]
    
    C --> G{Risk Score ≥ 7?}
    D --> H{Opportunity Score ≥ 6?}
    E --> I{Days Until Renewal}
    F --> J[Strategic Context Layer]
    
    I --> K[≤7 Days<br/>Emergency]
    I --> L[8-14 Days<br/>Critical]
    I --> M[15-30 Days<br/>Urgent]
    I --> N[31-60 Days<br/>Finalization]
    I --> O[61-90 Days<br/>Negotiation]
    I --> P[91-120 Days<br/>Active Cycle]
    I --> Q[121-180 Days<br/>Preparation]
    I --> R[181+ Days<br/>Strategic Planning]
    
    G -->|Yes| S[Risk Trigger Activated]
    G -->|No| T[Monitor Risk]
    H -->|Yes| U[Opportunity Trigger Activated]
    H -->|No| V[Monitor Opportunity]
    
    K --> W[Emergency Retention Protocol]
    L --> X[Critical Intervention Workflow]
    M --> Y[Urgent Action Workflow]
    N --> Z[Contract Finalization Workflow]
    O --> AA[Negotiation Prep Workflow]
    P --> BB[Standard Renewal Workflow]
    Q --> CC[Renewal Preparation Workflow]
    R --> DD[Strategic Planning Workflow]
    
    S --> EE{Within 120 Days?}
    U --> FF{Within 120 Days?}
    
    EE -->|Yes| GG[In-Band Risk Workflow]
    EE -->|No| HH[Out-of-Band Risk Intervention]
    FF -->|Yes| II[In-Band Opportunity Workflow]
    FF -->|No| JJ[Out-of-Band Opportunity Development]
    
    J --> KK[Modify All Workflows<br/>Based on Strategic Context]
    
    W --> LL[Execute Workflow]
    X --> LL
    Y --> LL
    Z --> LL
    AA --> LL
    BB --> LL
    CC --> LL
    DD --> LL
    GG --> LL
    HH --> LL
    II --> LL
    JJ --> LL
    
    KK --> LL
    
    LL --> MM[Monitor Outcome]
    MM --> NN[Update Algorithms]
    NN --> B
    
    style A fill:#7ED95A
    style B fill:#2E1175,color:#fff
    style LL fill:#ec8d1d,color:#fff
    style MM fill:#4095c9,color:#fff