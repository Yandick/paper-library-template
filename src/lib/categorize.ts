import fs from 'node:fs';
import path from 'node:path';

export interface TopicConfig {
  weight: number;
  blocked: boolean;
  label: string;
  keywords: string[];
}

export interface TopicPrefs {
  topics: Record<string, TopicConfig>;
  max_per_topic: number;
  max_total: number;
}

// Color palette for category sections (cycles if > 10 categories)
const SECTION_COLORS = [
  { bar: 'bg-blue-500',    hint: 'text-blue-400' },
  { bar: 'bg-purple-500',  hint: 'text-purple-400' },
  { bar: 'bg-green-500',   hint: 'text-green-400' },
  { bar: 'bg-amber-500',   hint: 'text-amber-400' },
  { bar: 'bg-rose-500',    hint: 'text-rose-400' },
  { bar: 'bg-cyan-500',    hint: 'text-cyan-400' },
  { bar: 'bg-pink-500',    hint: 'text-pink-400' },
  { bar: 'bg-teal-500',    hint: 'text-teal-400' },
  { bar: 'bg-indigo-500',  hint: 'text-indigo-400' },
  { bar: 'bg-orange-500',  hint: 'text-orange-400' },
];

// Extended tag color palette for PaperCard tags
const TAG_COLORS = [
  { light: 'bg-blue-100 text-blue-700',    dark: 'dark:bg-blue-500/20 dark:text-blue-300' },
  { light: 'bg-purple-100 text-purple-700', dark: 'dark:bg-purple-500/20 dark:text-purple-300' },
  { light: 'bg-green-100 text-green-700',   dark: 'dark:bg-green-500/20 dark:text-green-300' },
  { light: 'bg-amber-100 text-amber-700',   dark: 'dark:bg-amber-500/20 dark:text-amber-300' },
  { light: 'bg-rose-100 text-rose-700',     dark: 'dark:bg-rose-500/20 dark:text-rose-300' },
  { light: 'bg-cyan-100 text-cyan-700',     dark: 'dark:bg-cyan-500/20 dark:text-cyan-300' },
  { light: 'bg-pink-100 text-pink-700',     dark: 'dark:bg-pink-500/20 dark:text-pink-300' },
  { light: 'bg-teal-100 text-teal-700',     dark: 'dark:bg-teal-500/20 dark:text-teal-300' },
  { light: 'bg-indigo-100 text-indigo-700', dark: 'dark:bg-indigo-500/20 dark:text-indigo-300' },
  { light: 'bg-orange-100 text-orange-700', dark: 'dark:bg-orange-500/20 dark:text-orange-300' },
  { light: 'bg-lime-100 text-lime-700',     dark: 'dark:bg-lime-500/20 dark:text-lime-300' },
  { light: 'bg-sky-100 text-sky-700',       dark: 'dark:bg-sky-500/20 dark:text-sky-300' },
];

/**
 * Simple string hash for deterministic color assignment.
 */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Get a deterministic tag color class string based on tag name.
 */
export function getTagColorClass(tag: string): string {
  const idx = hashCode(tag.toLowerCase()) % TAG_COLORS.length;
  const c = TAG_COLORS[idx];
  return `${c.light} ${c.dark}`;
}

/**
 * Load topic_prefs.json from the project config directory.
 * Tries multiple candidate paths for local dev and Vercel builds.
 */
export function loadTopicPrefs(): TopicPrefs {
  try {
    const candidates = [
      path.resolve('../data/topic_prefs.json'),          // from site/ (local dev)
      path.resolve('data/topic_prefs.json'),             // from paper-digest/ root
      path.resolve('../config/topic_prefs.json'),        // legacy config/ location
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    }
  } catch {}
  return { topics: {}, max_per_topic: 3, max_total: 8 };
}

export interface PaperCategory {
  key: string;
  label: string;
  barColor: string;
  hintText: string;
  papers: any[];
}

export interface DigestMeta {
  slug: string;
  date: string;
  pushSequence: number | null;
}

function prettifyTag(tag: string): string {
  return tag
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function compactText(text: string, maxLength: number): string {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function inferFocus(title: string, topicTags: string[], categories: string[]): string {
  const lowerTitle = title.toLowerCase();
  const lowerTags = topicTags.map((tag) => tag.toLowerCase());
  const lowerCategories = categories.map((tag) => tag.toLowerCase());

  if (lowerTitle.includes('conversational')) return '对话式推荐';
  if (lowerTitle.includes('retrieval-augmented') || lowerTitle.includes('rag')) return '检索增强推荐';
  if (lowerTitle.includes('re-ranking') || lowerTitle.includes('ranking')) return '排序与重排';
  if (lowerTitle.includes('agent')) return 'Agent 驱动推荐';
  if (lowerTitle.includes('safety')) return '推荐安全与对齐';
  if (lowerTitle.includes('advertising')) return '广告推荐';
  if (lowerCategories.includes('cs.ir') || lowerTags.some((tag) => tag.includes('recommendation'))) {
    return '推荐与信息检索';
  }
  return '推荐系统';
}

function buildChineseAbstract(p: any): string {
  const focus = inferFocus(p.title || '', p.rawTopicTags || [], p.categoryTags || []);
  const categoryText = (p.categoryTags || []).length > 0 ? `相关 arXiv 分类包括 ${(p.categoryTags || []).join('、')}。` : '';
  const relevance = p.relevanceNote ? `推荐理由是：${compactText(p.relevanceNote, 88)}` : '它与当前的信息检索和 LLM for Recommendation 方向直接相关。';
  const lead = p.year ? `这篇论文发表于 ${p.year} 年，聚焦${focus}。` : `这篇论文聚焦${focus}。`;
  return `${lead}${categoryText}${relevance}`;
}

function toArxivAbsUrl(arxivId: string, openAccessUrl: string): string {
  if (arxivId) return `https://arxiv.org/abs/${arxivId}`;
  if (openAccessUrl.includes('/pdf/')) return openAccessUrl.replace('/pdf/', '/abs/');
  return openAccessUrl;
}

function resolveSourceUrl(p: any): string {
  if (p.doi) return `https://doi.org/${p.doi}`;
  if (p.arxiv_id || p.open_access_url) return toArxivAbsUrl(p.arxiv_id || '', p.open_access_url || '');
  return p.url || p.source_url || '';
}

function resolveSourceLabel(p: any): string {
  if (p.doi) return 'DOI';
  if (p.arxiv_id) return 'arXiv';
  if (p.open_access_url) return 'Open Access';
  return '原文链接';
}

export function parseDigestSlug(slug: string): DigestMeta {
  const match = slug.match(/^(\d{4}-\d{2}-\d{2})(?:-r(\d+))?$/);
  if (!match) {
    return { slug, date: slug, pushSequence: null };
  }
  return {
    slug,
    date: match[1],
    pushSequence: match[2] ? Number.parseInt(match[2], 10) : null,
  };
}

export function formatDigestLabel(slug: string): string {
  const meta = parseDigestSlug(slug);
  const d = new Date(`${meta.date}T00:00:00`);
  const base = Number.isNaN(d.getTime())
    ? meta.date
    : d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  return meta.pushSequence ? `${base} · 第 ${meta.pushSequence} 轮` : `${base} · 首轮`;
}

export function digestSortValue(slug: string): number {
  const meta = parseDigestSlug(slug);
  const base = Date.parse(`${meta.date}T00:00:00Z`);
  const round = meta.pushSequence ?? 1;
  return base * 100 + round;
}

/**
 * Normalize a paper object's field names (snake_case → camelCase).
 */
export function normalizePaper(p: any, prefs?: TopicPrefs): any {
  const rawTopicTags = p.rawTopicTags || p.topicTags || p.topic_tags || [];
  const categoryTags = p.categoryTags || p.categories || [];
  const normalized = {
    ...p,
    rawTopicTags,
    topicTags: rawTopicTags.map((tag: string) => prefs?.topics?.[tag]?.label || prettifyTag(tag)),
    categoryTags,
    casZone: p.casZone || p.cas_zone || p.jcr_quartile || '',
    impactFactor: p.impactFactor || p.impact_factor || '',
    citations: p.citations ?? p.citation_count ?? null,
    relevanceNote: p.relevanceNote || p.relevance_note || p.review_reason || p.inspiration || '',
    isNews: p.isNews ?? p.is_news ?? false,
    abstractEn: compactText(p.abstractEn || p.abstract || p.summary || '', 1200),
    sourceUrl: resolveSourceUrl(p),
    sourceLabel: resolveSourceLabel(p),
  };

  return {
    ...normalized,
    abstractZh: p.abstractZh || p.abstract_zh || buildChineseAbstract(normalized),
  };
}

/**
 * Categorize papers dynamically using topic_prefs.json keyword matching.
 * Each paper is assigned to the highest-weight matching category.
 * Unmatched papers go to "其他方向".
 */
export function categorizePapers(papers: any[], prefs?: TopicPrefs): PaperCategory[] {
  if (!prefs) prefs = loadTopicPrefs();

  const assigned = new Set<number>();
  const result: PaperCategory[] = [];

  // Sort topics by weight descending (highest priority first)
  const sorted = Object.entries(prefs.topics)
    .filter(([_, c]) => !c.blocked)
    .sort((a, b) => b[1].weight - a[1].weight);

  let colorIdx = 0;
  for (const [key, config] of sorted) {
    const matched: any[] = [];

    papers.forEach((p, i) => {
      if (assigned.has(i)) return;
      const rawTags = (p.rawTopicTags || p.topicTags || p.topic_tags || []).map((t: string) => t.toLowerCase());
      const visibleTags = (p.topicTags || []).map((t: string) => t.toLowerCase());
      const categories = (p.categoryTags || p.categories || []).map((t: string) => t.toLowerCase());
      const combinedText = [
        p.title,
        p.abstractEn,
        p.abstract,
        p.relevanceNote,
        ...(p.rawTopicTags || []),
        ...(p.topicTags || []),
        ...(p.categoryTags || []),
      ].join(' ').toLowerCase();

      const isDirectTopicMatch = rawTags.includes(key.toLowerCase()) || visibleTags.includes(config.label.toLowerCase());

      // Also check isNews for AI/LLM category
      const isNewsMatch = p.isNews && config.keywords.some(kw =>
        ['ai-news', 'llm', 'ai'].includes(kw.toLowerCase())
      );

      const isKeywordMatch = config.keywords.some(kw => {
        const kwLower = kw.toLowerCase();
        const kwParts = kwLower
          .split(/\band\b|\bor\b|[()":]/g)
          .map((part) => part.replace(/^all:/, '').trim())
          .filter((part) => part.length >= 3);
        return rawTags.some((tag: string) => tag.includes(kwLower) || kwLower.includes(tag))
          || visibleTags.some((tag: string) => tag.includes(kwLower) || kwLower.includes(tag))
          || categories.some((tag: string) => kwParts.some((part) => tag.includes(part)))
          || kwParts.some((part) => combinedText.includes(part));
      });

      if (isDirectTopicMatch || isKeywordMatch || isNewsMatch) {
        matched.push(p);
        assigned.add(i);
      }
    });

    if (matched.length > 0) {
      const color = SECTION_COLORS[colorIdx % SECTION_COLORS.length];
      result.push({
        key,
        label: config.label,
        barColor: color.bar,
        hintText: config.keywords.slice(0, 3).join(' · '),
        papers: matched,
      });
      colorIdx++;
    }
  }

  // Uncategorized papers
  const uncategorized = papers.filter((_, i) => !assigned.has(i));
  if (uncategorized.length > 0) {
    const color = SECTION_COLORS[colorIdx % SECTION_COLORS.length];
    result.push({
      key: '_other',
      label: '其他方向',
      barColor: color.bar,
      hintText: '未分类论文',
      papers: uncategorized,
    });
  }

  return result;
}
