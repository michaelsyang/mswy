// /reports/skills — distilled best-practice guide for agent skill design.
// Source: research synthesis of 13 primary sources, current as of 2026-09-29.

function Meta({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--meta)', fontSize: 'var(--text-xs)' }}>{children}</span>
}

function Metric({ children }: { children: React.ReactNode }) {
  return (
    <strong style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
      {children}
    </strong>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2
        style={{
          fontSize: 'var(--text-xl)',
          color: 'var(--fg)',
          marginBottom: 'var(--space-3)',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

const p: React.CSSProperties = {
  color: 'var(--fg-2)',
  fontSize: 'var(--text-base)',
  marginBottom: 'var(--space-3)',
}
const li: React.CSSProperties = {
  color: 'var(--fg-2)',
  fontSize: 'var(--text-base)',
  marginBottom: 'var(--space-2)',
  lineHeight: 1.6,
}
const quote: React.CSSProperties = {
  borderLeft: '3px solid var(--accent)',
  paddingLeft: 'var(--space-3)',
  margin: 'var(--space-3) 0',
  color: 'var(--fg)',
  fontStyle: 'italic',
  fontSize: 'var(--text-base)',
}
const code: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  background: 'var(--surface-warm)',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
}

function src(label: string, url: string, date: string) {
  return (
    <>
      {' ('}
      <a href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
      , <Meta>{date}</Meta>)
    </>
  )
}

export default function SkillsReport() {
  return (
    <main
      style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-5) var(--space-12)',
      }}
    >
      <p style={{ marginBottom: 'var(--space-2)' }}>
        <a href="/">← mswy.xyz</a>
      </p>
      <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
        Designing Agent Skills
      </h1>
      <p style={{ ...p, color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
        A best-practice guide distilled from 13 primary sources — the Agent Skills spec, vendor
        guidance, two 2026 benchmarks, three 2026 papers, and industry debate.{' '}
        <Meta>Current as of 2026-09-29 · every claim links to its source</Meta>
      </p>

      {/* TL;DR */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginTop: 'var(--space-5)',
        }}
      >
        <p style={{ ...p, color: 'var(--accent)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          The recipe
        </p>
        <p style={{ ...p, marginBottom: 0 }}>
          Lean frontmatter (gerund <code style={code}>name</code> + a pushy what-and-when{' '}
          <code style={code}>description</code>) → body under 500 lines of imperative,
          example-first instructions with checklists and validator feedback loops → detail in
          one-level <code style={code}>references/</code>, deterministic work in{' '}
          <code style={code}>scripts/</code> → eval baseline-vs-with-skill before shipping → prune
          anything the model already knows → route must-succeed knowledge through the always-on
          layer, never a probabilistic trigger.
        </p>
      </div>

      <Section title="1 · What a skill is">
        <p style={p}>
          The{' '}
          <a href="https://agentskills.io/specification" target="_blank" rel="noreferrer">
            Agent Skills open spec
          </a>{' '}
          (Anthropic, <Meta>2025-12-18</Meta>): a folder with a <code style={code}>SKILL.md</code>{' '}
          (YAML frontmatter + markdown body) plus optional bundled files. Adopted by Claude Code,
          Codex, Cursor, Gemini CLI, OpenHands, and goose
          {src('Simon Willison', 'https://simonwillison.net/2025/Dec/19/agent-skills/', '2025-12-19')}
          . Willison calls the spec "deliciously tiny… quite heavily under-specified" — most real
          guidance lives in practice, not the spec.
        </p>
        <p style={p}>
          The core design principle is <strong>progressive disclosure</strong>, in three tiers:
        </p>
        <ol style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            <strong>Metadata always in context</strong> — name + description, ~100 tokens
            {src('spec', 'https://agentskills.io/specification', '2025-12-18')}
          </li>
          <li style={li}>
            <strong>Body loaded on trigger</strong> — recommended under 5,000 tokens
          </li>
          <li style={li}>
            <strong>Bundled files on demand</strong> — scripts, references, assets
          </li>
        </ol>
        <blockquote style={quote}>
          "The context window is a public good… every token competes with conversation history."
          Default assumption: the model is already very smart — only add context it lacks.
          <footer style={{ ...quote, fontStyle: 'normal', marginTop: 4 }}>
            {src(
              'Anthropic best practices',
              'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
              '2026-09',
            )}
          </footer>
        </blockquote>
      </Section>

      <Section title="2 · The numbers">
        <p style={p}>
          From <a href="https://arxiv.org/abs/2602.12670" target="_blank" rel="noreferrer">SkillsBench</a>{' '}
          <Meta>(2026-02-13 · 87 tasks · 18 model-harness configs)</Meta>:
        </p>
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            Curated skills lift average task resolution <Metric>33.9% → 50.5%</Metric> (+16.6pp)
          </li>
          <li style={li}>
            <strong>Compact skills beat comprehensive documentation ~4×</strong> —{' '}
            <Metric>+18.9pp</Metric> vs <Metric>+5.7pp</Metric>. "Focused Skills with at most three
            modules outperform larger or exhaustive bundles."
          </li>
          <li style={li}>
            <Metric>2–3 skills</Metric> per task give <Metric>+20.0pp</Metric>; 4+ skills drop to{' '}
            <Metric>+5.2pp</Metric>
          </li>
          <li style={li}>
            On 16 of 84 tasks skills <em>hurt</em> — restating what models already know adds cost,
            not accuracy. Encoded commonplace practice "did not move resolution rates but{' '}
            <em>did</em> materially change cost."
            {src('Rethinking Agent-Generated Tests', 'https://arxiv.org/abs/2602.07900', '2026-02-08')}
          </li>
        </ul>
      </Section>

      <Section title="3 · Name">
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            Spec rules: 1–64 chars, lowercase alphanumeric + hyphens, no leading/trailing/double
            hyphens, and the name <strong>must match the directory name</strong>
            {src('spec', 'https://agentskills.io/specification', '2025-12-18')}.
          </li>
          <li style={li}>
            Style: <strong>gerund form preferred</strong> —{' '}
            <code style={code}>processing-pdfs</code>, <code style={code}>testing-code</code>. Noun
            phrases are acceptable. Avoid vague names (<code style={code}>helper</code>,{' '}
            <code style={code}>utils</code>, <code style={code}>tools</code>) and generic ones (
            <code style={code}>documents</code>, <code style={code}>data</code>). Be consistent
            across your collection
            {src(
              'Anthropic best practices',
              'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
              '2026-09',
            )}
            .
          </li>
        </ul>
      </Section>

      <Section title="4 · Description — the highest-leverage field">
        <p style={p}>
          The description is the entire routing surface: "Claude uses it to choose the right Skill
          from potentially 100+ available Skills"
          {src(
            'Anthropic best practices',
            'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
            '2026-09',
          )}
          . Spec: 1–1,024 chars; describe <strong>both what it does and when to use it</strong>,
          with concrete trigger keywords ("PDFs, forms, document extraction").
        </p>
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            Models currently <strong>undertrigger</strong> — be "a little bit 'pushy'": enumerate
            phrases and contexts, "even if they don't explicitly ask". All "when to use" info goes
            in the description, not the body
            {src(
              'Anthropic skill-creator',
              'https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md',
              'fetched 2026-09-29',
            )}
            .
          </li>
          <li style={li}>
            Trigger failure is the #1 failure mode: "In 56% of eval cases, the skill was never
            invoked… Adding the skill produced no improvement over baseline"
            {src('Vercel', 'https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals', '2026-01')}
            .
          </li>
          <li style={li}>
            But don't summarize the workflow: "descriptions that summarize the workflow cause agents
            to act on the summary and skip the body." Describe <em>when to use</em>, not{' '}
            <em>how it works</em>
            {src(
              'obra/superpowers writing-skills',
              'https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md',
              '2026',
            )}
            .
          </li>
        </ul>
      </Section>

      <Section title="5 · Frontmatter fields">
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            <strong>Required:</strong> <code style={code}>name</code>,{' '}
            <code style={code}>description</code>.
          </li>
          <li style={li}>
            <strong>Optional:</strong> <code style={code}>license</code> (keep short),{' '}
            <code style={code}>compatibility</code> (≤500 chars — "Most skills do not need" it),{' '}
            <code style={code}>metadata</code> (free string map — "make your key names reasonably
            unique"), <code style={code}>allowed-tools</code>{' '}
            <strong>(experimental, support varies)</strong> — e.g.{' '}
            <code style={code}>allowed-tools: Bash(git:*) Bash(jq:*) Read</code>
            {src('spec', 'https://agentskills.io/specification', '2025-12-18')}.
          </li>
          <li style={li}>
            Tool-restriction fields are <strong>not portable across harnesses</strong> — don't build
            on them yet.
          </li>
        </ul>
      </Section>

      <Section title="6 · Body — components and structure">
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            Recommended sections: step-by-step instructions, input/output examples, common edge
            cases {src('spec', 'https://agentskills.io/specification', '2025-12-18')}. Anthropic's
            worked skills add: <strong>When to Use</strong> (with counter-triggers — "Don't use
            for…"), Quick Reference, Pitfalls, and a Verification section
            {src(
              'skill-creator',
              'https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md',
              'fetched 2026-09-29',
            )}
            .
          </li>
          <li style={li}>
            <strong>Length: under 500 lines</strong>, split beyond that
            {src(
              'best practices',
              'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
              '2026-09',
            )}
            ; the spec suggests under 5,000 tokens. Workflows get numbered steps + copyable
            checklists; wrap fragile steps in <strong>feedback loops</strong>: "Run validator → fix
            errors → repeat… greatly improves output quality."
          </li>
          <li style={li}>
            <strong>Set degrees of freedom to the task's fragility:</strong> exact scripts for
            error-prone ops ("Do not modify the command"), free guidance for judgment calls.
          </li>
          <li style={li}>
            Imperative voice; scripts for deterministic work ("Run{' '}
            <code style={code}>analyze_form.py</code>" vs "See <code style={code}>analyze_form.py</code>"
            — make execution vs reading explicit); fully-qualified MCP tool names (
            <code style={code}>ServerName:tool_name</code>); never assume packages are installed.
          </li>
          <li style={li}>
            <strong>References:</strong> keep one level deep from SKILL.md ("Claude may partially
            read files when they're referenced from other referenced files"); TOC at top of any
            reference over 100 lines; descriptive filenames organized by domain (
            <code style={code}>reference/finance.md</code>, not <code style={code}>docs/file2.md</code>
            ). Only three conventional dirs: <code style={code}>scripts/</code>,{' '}
            <code style={code}>references/</code>, <code style={code}>assets/</code>.
          </li>
        </ul>
      </Section>

      <Section title="7 · Testing and maintenance">
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          <li style={li}>
            Test with every model you'll run it on ("What works perfectly for Opus might need more
            detail for Haiku"); Anthropic's checklist wants ≥3 eval scenarios
            {src(
              'best practices',
              'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
              '2026-09',
            )}
            . The formal loop: baseline runs <strong>without</strong> the skill, with-skill runs,
            graded assertions, iterate — TDD-for-docs, matching obra/superpowers' "no skill without
            a failing test first."
          </li>
          <li style={li}>
            Content must be <strong>maintained, not accumulated</strong>: one skill-refinement
            round adds <Metric>+3.7–6.7 points</Metric>, and skills evolved from diverse
            multi-model traces transfer best (<Metric>73.1%</Metric> cross-model accuracy)
            {src('AFTER', 'https://arxiv.org/abs/2606.23127', '2026-06-22')}.
          </li>
          <li style={li}>
            High usage ≠ high utility: one model gained only <Metric>+0.60</Metric> despite{' '}
            <Metric>66.87%</Metric> skill usage; another regressed
            {src('SkillFlow', 'https://arxiv.org/abs/2604.17308', '2026-04-19')}.
          </li>
          <li style={li}>
            Keep skills on the tightest trigger diet: "agents will eagerly try to use a skill even
            if it isn't super relevant… I have to spend a bunch of time toggling"
            {src('HN, 251-pt TDD-skill thread', 'https://news.ycombinator.com/item?id=48398925', '2026-06-04')}
            . Practitioner consensus: <strong>hooks beat prose</strong> — "a hook that executes on
            tool calls is significantly better than telling your agent to follow your repo's
            format/lint/style constraints." (Same thread.)
          </li>
          <li style={li}>
            Content hygiene: no time-sensitive info, no changelog/verified-date stamps, consistent
            terminology (pick "extract", don't rotate synonyms), every referenced file still
            reachable from the description after any refactor.
          </li>
        </ul>
        <blockquote style={quote}>
          Skills are "disk-cached prompts conditioned on verified success."
          <footer style={{ ...quote, fontStyle: 'normal', marginTop: 4 }}>
            <Meta>Hacker News, 2026-06-04</Meta>
          </footer>
        </blockquote>
      </Section>

      <Section title="8 · Always-on layer vs triggers — the AGENTS.md debate">
        <p style={p}>
          Vercel <Meta>(2026-01)</Meta>: an 8KB compressed docs index embedded in{' '}
          <code style={code}>AGENTS.md</code> hit <Metric>100%</Metric> vs skills'{' '}
          <Metric>79%</Metric> ceiling. Their theory: "<strong>No decision point</strong>… With
          AGENTS.md, there's no moment where the agent must decide 'should I look this up?'" plus
          "Consistent availability… every turn"
          {src('Vercel', 'https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals', '2026-01')}
          .
        </p>
        <p style={p}>
          The rebuttals: Vercel tested a <em>small, fixed</em> corpus where always-in-context is
          affordable — "the advantage of skills is exactly that you don't cram them all into the
          AGENTS file"
          {src('HN, 524-pt thread', 'https://news.ycombinator.com/item?id=46809708', '2026-01-29')}
          . Trigger unreliability is also model-generation-dependent, and SkillsBench v1.1 shows the
          skill lift is still growing (<Metric>+1.9pp/month</Metric> with newer models) — skills
          aren't dead.
        </p>
        <p style={p}>
          Current best practice is <strong>layered</strong>: a hand-maintained index/TOC in the
          always-on file + skills for on-demand depth. "Use AGENTS.md as a table of contents and
          sparknotes… Have topical markdown files / skills" (verdverm, same thread).
        </p>
        <blockquote style={quote}>
          Don't put mission-critical routing in a probabilistic trigger — put it in the
          always-loaded layer.
        </blockquote>
      </Section>

      <Section title="9 · Security">
        <p style={p}>
          Snyk's ToxicSkills scan of <Metric>3,984</Metric> marketplace skills found{' '}
          <Metric>36% with security flaws</Metric>, <Metric>1,467 vulnerable</Metric>,{' '}
          <Metric>76 confirmed malicious</Metric> — "Agent Skills SKILL.md files… inherit the
          agent's access and trust"
          {src(
            'Snyk',
            'https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/',
            '2026-02',
          )}
          . Audit third-party skills before install; treat bundled scripts as executable supply
          chain.
        </p>
      </Section>

      <Section title="Sources">
        <ul style={{ paddingLeft: 'var(--space-5)' }}>
          {[
            ['Agent Skills specification — agentskills.io', 'https://agentskills.io/specification', '2025-12-18'],
            ['Simon Willison — Agent Skills', 'https://simonwillison.net/2025/Dec/19/agent-skills/', '2025-12-19'],
            ['Anthropic engineering — Equipping agents with Agent Skills', 'https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills', '2025-10'],
            ['Anthropic — Skill authoring best practices', 'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices', '2026-09'],
            ['Anthropic skill-creator (repo)', 'https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md', 'fetched 2026-09-29'],
            ['SkillsBench (arXiv 2602.12670)', 'https://arxiv.org/abs/2602.12670', '2026-02-13'],
            ['SkillFlow (arXiv 2604.17308)', 'https://arxiv.org/abs/2604.17308', '2026-04-19'],
            ['AFTER — skill refinement (arXiv 2606.23127)', 'https://arxiv.org/abs/2606.23127', '2026-06-22'],
            ['Rethinking Agent-Generated Tests (arXiv 2602.07900)', 'https://arxiv.org/abs/2602.07900', '2026-02-08'],
            ['Vercel — AGENTS.md outperforms skills in our evals', 'https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals', '2026-01'],
            ['HN — Vercel thread (524 pts)', 'https://news.ycombinator.com/item?id=46809708', '2026-01-29'],
            ['HN — TDD skills thread (251 pts)', 'https://news.ycombinator.com/item?id=48398925', '2026-06-04'],
            ['Snyk — ToxicSkills', 'https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/', '2026-02'],
          ].map(([label, url, date]) => (
            <li key={url} style={{ ...li, fontSize: 'var(--text-sm)' }}>
              <a href={url} target="_blank" rel="noreferrer">
                {label}
              </a>{' '}
              — <Meta>{date}</Meta>
            </li>
          ))}
        </ul>
      </Section>

      <p style={{ ...p, color: 'var(--muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-8)' }}>
        Distilled from a 13-source research synthesis (2026-09-29). Industry moves fast and
        findings are model-dependent — re-validate trigger-reliability claims against your own
        model before relying on them.
      </p>
    </main>
  )
}
