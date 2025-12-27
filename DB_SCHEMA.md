# Database Schema (Matrimony Grade)

## 1. Users (Identity)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `email` | VARCHAR | Unique, Verified |
| `phone` | VARCHAR | Unique, Verified |
| `password_hash` | VARCHAR | Argon2 |
| `is_verified` | BOOLEAN | KYC Status |

## 2. Profiles (The Biodata)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK -> Users |
| `name` | VARCHAR | |
| `dob` | DATE | Age calculation |
| `height_cm` | INT | |
| `gender` | ENUM | Male, Female |
| `marital_status` | ENUM | Never Married, Divorced, Widowed, Awaiting Divorce |
| `mother_tongue` | VARCHAR | |
| `city` | VARCHAR | |
| `state` | VARCHAR | |
| `country` | VARCHAR | |

## 3. Religion_Community (MANDATORY)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `religion` | VARCHAR | Hindu, Muslim, Christian, Sikh, etc. |
| `caste` | VARCHAR | |
| `sub_caste` | VARCHAR | Optional |
| `gothra` | VARCHAR | Optional |
| `inter_caste_willingness`| ENUM | Yes, No, Open |

## 4. Career_Education
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `education_level` | ENUM | High School, Bachelors, Masters, Doctorate |
| `profession` | VARCHAR | |
| `company` | VARCHAR | |
| `income_range` | VARCHAR | e.g. "15-20 LPA" |
| `work_location` | VARCHAR | |

## 5. Family_Details
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `type` | ENUM | Nuclear, Joint |
| `values` | ENUM | Orthodox, Traditional, Moderate, Liberal |
| `father_occ` | VARCHAR | |
| `mother_occ` | VARCHAR | |
| `siblings` | VARCHAR | e.g. "1 Brother, 0 Sisters" |

## 6. Lifestyle_Habits
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `diet` | ENUM | Veg, Non-Veg, Eggitarian, Vegan |
| `smoke` | ENUM | No, Occasionally, Yes |
| `drink` | ENUM | No, Socially, Yes |
| `spiritual_inclination` | VARCHAR | |

## 7. Interests_Personality
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `hobbies` | JSONB | e.g. ["Reading", "Hiking"] |
| `comm_style` | VARCHAR | |
| `introvert_scale` | INT | 1 (Introvert) to 10 (Extrovert) |

## 8. System Tables (Physical Schema)

### Interactions
| Column | Type | Notes |
| :--- | :--- | :--- |
| `from_user_id` | UUID | FK |
| `to_user_id` | UUID | FK |
| `type` | VARCHAR | REQUEST, VIEW, LIKE |
| `status` | VARCHAR | pending, connected, declined, seen |
| `created_at` | TIMESTAMP | |

### Matches
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_a_id` | UUID | FK |
| `user_b_id` | UUID | FK |
| `score_total` | FLOAT | AI Compatibility Score |
| `is_liked` | BOOLEAN | If B liked A back |
| `status` | VARCHAR | pending, connected |

### Reels
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `video_url` | VARCHAR | |
| `likes` | INT | Counter |
| `views` | INT | Counter |

### Transactions
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK |
| `amount` | INT | |
| `type` | VARCHAR | CREDIT (Purchase), DEBIT (Spent) |
| `status` | VARCHAR | SUCCESS, FAILED |

### Reports & Blocks
- **Reports**: `reporter_id`, `reported_id`, `reason`, `status`.
- **Blocks**: `blocker_id`, `blocked_id`.
