# Chapter 3 — Diagrams and Flowcharts

PCA Negros Occidental Coconut Health Monitoring System

Open this file in Cursor/VS Code with a Mermaid preview extension (**Ctrl+Shift+V**), or paste each block into [mermaid.live](https://mermaid.live) to export PNG/SVG for your thesis.

All shapes: **white fill**, **black outline** (2px), **black text and arrows**.

---

## Section 1 — Project Design

Describes the structure and design of the system before development begins.

### Use Case Diagram

Shows what each user role can do: **Farmer**, **PCA Officer**, and **Admin**.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","actorBorder":"#000000","actorBkg":"#ffffff","actorTextColor":"#000000","actorLineColor":"#000000","labelBoxBkgColor":"#ffffff","labelBoxBorderColor":"#000000","labelTextColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
useCaseDiagram
    left to right direction

    actor Farmer
    actor "PCA Officer" as Officer
    actor Admin

    rectangle "PCA Coconut Health Monitoring System" {
        (Register Farm)
        (Upload Leaf Photo)
        (View AI Result)
        (Send Report to PCA)
        (View Notifications)

        (Review Validation Queue)
        (Validate Farmer Submission)
        (Schedule Farm Visit)
        (Mark Visit Complete)
        (View Barangay Analytics)

        (Approve Registration)
        (Manage Officers)
        (Assign Barangay)
        (View All Farms)
        (View Province Analytics)
    }

    Farmer --> (Register Farm)
    Farmer --> (Upload Leaf Photo)
    Farmer --> (View AI Result)
    Farmer --> (Send Report to PCA)
    Farmer --> (View Notifications)

    Officer --> (Review Validation Queue)
    Officer --> (Validate Farmer Submission)
    Officer --> (Schedule Farm Visit)
    Officer --> (Mark Visit Complete)
    Officer --> (View Barangay Analytics)

    Admin --> (Approve Registration)
    Admin --> (Manage Officers)
    Admin --> (Assign Barangay)
    Admin --> (View All Farms)
    Admin --> (View Province Analytics)
```

---

## Section 2 — Project Development

Describes how the system was built.

### Dataset Preparation Flowchart

Shows image collection through the final dataset.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B[Collect coconut leaf images]
    B --> C[Categorize by primary condition:\nHealthy, Yellowing,\nScale Insect, Rhino Beetle]
    C --> D{Quality check\nacceptable?}
    D -->|No| E[Discard low-quality images]
    E --> B
    D -->|Yes| F[Data augmentation:\nflip, rotate, crop, brightness]
    F --> G[Organize images into\nprimary-condition class folders]
    G --> H[Split dataset:\nTrain 1,187 / Valid 254 / Test 52\nabout 79.5% / 17.0% / 3.5%]
    H --> I[Export final folder-based dataset]
    I --> J([Dataset ready])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J bw
```

### CNN Model Training Flowchart

Shows the CNN training process.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B[Load prepared dataset]
    B --> C[Preprocess images:\nresize 224x224, normalize]
    C --> D[Define CNN architecture:\nEfficientNetB0 with four sigmoid outputs]
    D --> E[Compile model:\nAdam optimizer, weighted binary cross-entropy]
    E --> F[Train on training set]
    F --> G[Evaluate on validation set]
    G --> H{Acceptable\naccuracy?}
    H -->|No| I[Tune hyperparameters\nor add regularization]
    I --> F
    H -->|Yes| J[Evaluate on test set]
    J --> K[Export model for deployment]
    K --> L([Model ready])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J,K,L bw
```

### System Development Flowchart

Shows overall development from planning to deployment.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B[Requirements gathering\nand system planning]
    B --> C[System design:\narchitecture, database, UI]
    C --> D[Backend development:\nFastAPI and database]
    D --> E[Frontend development:\nReact, Vite, Tailwind CSS]
    E --> F[Integrate CNN model and\nprimary-condition aggregation\nin the web application]
    F --> G[System integration testing]
    G --> H{All tests\npass?}
    H -->|No| I[Debug and fix issues]
    I --> G
    H -->|Yes| J[User acceptance testing\nwith PCA stakeholders]
    J --> K{UAT\napproved?}
    K -->|No| L[Apply revisions]
    L --> J
    K -->|Yes| M[Deployment and documentation]
    M --> N([System deployed])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J,K,L,M,N bw
```

---

## Section 3 — Operation and Testing Procedure

Describes how each role uses the system during operation and testing.

### Farmer Usage Flowchart

How a farmer uses the system.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B{Approved farmer\naccount?}
    B -->|No| C[Submit farm registration]
    C --> D[Wait for admin approval\nand login credentials]
    D --> E[Log in as Farmer]
    B -->|Yes| E
    E --> F[Open farmer portal]
    F --> G[Manually select sector\nand upload 1 to 10 leaf photos]
    G --> H[System runs CNN analysis\nper uploaded photo]
    H --> I[View AI result:\nprimary condition per image,\nmajority condition, and\nphoto counts per category]
    I --> J{Result\ncorrect?}
    J -->|No| K[Mark feedback in UI\nfor review note]
    K --> L[Send report to PCA]
    J -->|Yes| L
    L --> M[Submission creates queue,\nsurvey row, farm update,\nand notification]
    M --> N{Another\nreport?}
    N -->|Yes| G
    N -->|No| O[Log out]
    O --> P([End])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P bw
```

### PCA Officer Usage Flowchart

How a PCA officer uses the system.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B[Log in as PCA Officer]
    B --> C[View officer dashboard]
    C --> D[Review validation queue]
    D --> E[Validate farmer submission]
    E --> F{Priority\nvisit needed?}
    F -->|Yes| G[Schedule farm visit]
    G --> H[Conduct farm visit]
    H --> I[Mark visit completed]
    I --> J[Notify farmer]
    F -->|No| K[View barangay analytics]
    J --> K
    K --> L{More\ntasks?}
    L -->|Yes| D
    L -->|No| M[Log out]
    M --> N([End])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J,K,L,M,N bw
```

### Admin Usage Flowchart

How an admin manages the system.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#ffffff","primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","secondaryColor":"#ffffff","secondaryTextColor":"#000000","secondaryBorderColor":"#000000","tertiaryColor":"#ffffff","tertiaryTextColor":"#000000","tertiaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","mainBkg":"#ffffff","nodeBorder":"#000000","clusterBkg":"#ffffff","clusterBorder":"#000000","edgeLabelBackground":"#ffffff","nodeTextColor":"#000000"}}}%%
flowchart TD
    A([Start]) --> B[Log in as Admin]
    B --> C[View admin dashboard]
    C --> D{Select task}
    D -->|Registrations| E[Approve or reject\nfarmer registration]
    D -->|Officers| F[Add, edit, or remove officer]
    F --> G[Assign or reassign barangay]
    D -->|Farms| H[View and filter all farms]
    D -->|Analytics| I[View province-wide analytics]
    E --> J[Continue management]
    G --> J
    H --> J
    I --> J
    J --> K{More\ntasks?}
    K -->|Yes| D
    K -->|No| L[Log out]
    L --> M([End])

    classDef bw fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    class A,B,C,D,E,F,G,H,I,J,K,L,M bw
```
