---
title: Publish an Agent Skills Discovery Index
impact: MEDIUM
impactDescription: Lets agents discover downloadable SKILL.md capabilities you offer, each verified by a sha256 digest
tags: agent-skills, discovery, well-known, sha256, digest, static
---

## Publish an Agent Skills Discovery Index

The [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc) defines `/.well-known/agent-skills/index.json` — a catalog of downloadable `SKILL.md` artifacts an agent can consume. Publish **one real skill per genuine capability** (e.g. your public API); each entry carries a `sha256` digest of the artifact.

### The digest-drift trap

Each skill entry includes `digest: "sha256:<hex>"` of the SKILL.md artifact. If a formatter (oxfmt/prettier) reformats the SKILL.md, its bytes change and the digest no longer matches — the scanner (or a verifying agent) rejects it. **Format the SKILL.md FIRST, then compute the digest, then write the index.** Re-verify `served-file-sha256 == indexed-digest` after any edit.

**Correct (static index + artifact with a matching digest):**

```jsonc
// public/.well-known/agent-skills/index.json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "free-audit",
      "type": "skill-md",
      "description": "Run the free Google Business Profile audit and get a scorecard.",
      "url": "https://your-site.com/.well-known/agent-skills/free-audit/SKILL.md",
      "digest": "sha256:0b7afdf087ec3becec2a535ec3561db3ef2b230626060250323526613d8db38a",
    },
  ],
}
```

```md
<!-- public/.well-known/agent-skills/free-audit/SKILL.md -->

# Run a free audit

POST https://your-site.com/api/v1/free-audit with { brand, email, consent:true }.
Returns a scorecard { score, locationCount, duplicates, summary, ... }.
```

Each `skills[]` entry needs `name` (lowercase-hyphen), `type` (`skill-md` | `archive`), `description`, `url`, `digest`.

### Compute + verify the digest

```bash
# 1. format the artifact FIRST
oxfmt public/.well-known/agent-skills/free-audit/SKILL.md
# 2. compute the digest and put it in index.json
shasum -a 256 public/.well-known/agent-skills/free-audit/SKILL.md
# 3. verify served file matches the indexed digest
diff <(shasum -a 256 SKILL.md | awk '{print $1}') <(grep -o 'sha256:[a-f0-9]*' index.json | cut -d: -f2)
```

Reference: [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc) · [agentskills.io](https://agentskills.io)
