---
inclusion: false
---

# Planning Mode Guidelines

## Interactive Planning Process

When users request complex features or new functionality, follow this structured approach:

### 1. Analyze Existing Context

- Review current codebase and integrations
- Identify existing patterns and architecture
- Note relevant authentication, APIs, or services already in place

### 2. Gather Requirements Through Multiple Choice

Present clear, specific questions with default options to clarify:

**Example Format:**

```
Based on the existing [integration/setup], I can see you already have [relevant context].
Before I create the plan, I need a few quick clarifications:

1. [Specific question about implementation detail]?
   a. [Option 1] (default)
   b. [Option 2]
   c. [Option 3]
   d. Other?

2. [Question about scope/quantity]?
   a. [Small scope] (default)
   b. [Medium scope]
   c. [Large scope]

3. [Question about user experience/display]?
   a. [Simple option]
   b. [Detailed option]
   c. [Custom option]
```

### 3. Create Actionable Todo List

After receiving user answers, generate a structured implementation plan:

```
## Implementation Plan

### Setup & Configuration
- [ ] Create [specific file/component]
- [ ] Configure [specific service/API]
- [ ] Update [specific configuration]

### Core Implementation
- [ ] Implement [specific functionality]
- [ ] Add [specific feature]
- [ ] Integrate [specific service]

### UI/UX Components
- [ ] Design [specific component]
- [ ] Style [specific element]
- [ ] Add [specific interaction]

### Testing & Polish
- [ ] Test [specific functionality]
- [ ] Optimize [specific performance aspect]
- [ ] Add error handling for [specific scenario]
```

## Best Practices

- Always provide sensible defaults in multiple choice options
- Keep questions focused and specific to avoid ambiguity
- Break complex features into logical, sequential steps
- Reference existing codebase patterns and integrations
- Ensure each todo item is actionable and specific
