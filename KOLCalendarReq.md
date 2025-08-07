### **Frontline Feature Request #1: KOL Posting Calendar & Auto-Tracking System**

**Category:** KOL Management & Scheduling

**Objective:**

Create an integrated **KOL Calendar & Checklist** to track influencer post schedules, automate posting verification, and color-code compliance for easy management.

**Core Features:**

1. **KOL Calendar View**
    - Calendar displays scheduled KOL posts.
    - Each scheduled KOL post appears as a **small grey circle** on its assigned day.
    - Clicking a date opens a **daily detailed view** with:
        - KOL Name
        - Number of Videos Scheduled
        - Agreed Payment Amount
        - Status of each post
2. **Automated Status Tracking**
    - System performs a **daily scan of linked KOL social profiles**.
    - Color-coded status:
        - **Grey** = Upcoming / Not posted yet
        - **Green** = Posted on schedule
        - **Orange** = 1 day late
        - **Red** = 2+ days late
3. **Post Verification & Messaging**
    - If a post is late (orange/red), KOL name highlights for follow-up.
    - **Quick-action button to DM the KOL** from dashboard.
4. **Batch Input for New KOL Deals**
    - When paying a KOL, input upfront:
        - Total # of videos
        - Posting schedule (dates)
        - Payment amount
    - System automatically populates calendar with corresponding grey circles.

**Benefits:**

- Provides **at-a-glance KOL compliance tracking**.
- **Reduces manual follow-ups** by clearly showing late posts.
- Acts as a **KOL fulfillment checklist + Google Calendar hybrid**.

**Category:** KOL Management & Scheduling

**Objective:**

Create a **calendar and checklist system** to track KOL post schedules, auto-verify posts, and color-code compliance for easy daily management.

---

### **Core Features**

1. **KOL Calendar View**
    - Calendar shows scheduled KOL posts as **small grey circles**.
    - Clicking a date opens a **detailed view** with:
        - KOL Name
        
        # of Videos Scheduled
        
        - Payment Amount
        - Post Status
2. **Automated Status Tracking**
    - System **auto-scans linked KOL social profiles** daily.
    - Status Colors:
        - **Grey** = Scheduled/Not posted yet
        - **Green** = Posted on time
        - **Orange** = 1 day late
        - **Red** = 2+ days late
3. **Quick Follow-Up Tools**
    - Late posts (orange/red) **highlight in dashboard**.
    - **Click-to-DM button** to reach out directly via Telegram.
4. **Batch Input for New Campaigns**
    - Enter KOL deal details once:
        
        # of videos
        
        - Posting dates
        - Payment amount
    - **Auto-populates calendar** and tracking system.

---

### **Technical Requirements**

**Must Do:**

- Pull scheduled post data and **display in a calendar UI**.
- **Store KOL social links** for scanning.
- **Run daily scans** to verify posts exist on the correct date.
- **Auto-apply color coding** (grey/green/orange/red) based on posting behavior.
- **Provide API endpoint** or webhook for Telegram DM notifications.
- **Support batch KOL input** and editable schedules.

**Should Not Do:**

- No manual post verification—**all verification is automated**.
- No third-party posting; system **only tracks, not uploads content**.
- No unnecessary social scraping outside defined KOLs to avoid platform bans.