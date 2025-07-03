/**
 * Simple search utilities for VMF Voice
 * Provides fuzzy matching and enhanced search capabilities
 */

export interface SearchResult {
  score: number;
  highlighted: string;
}

/**
 * Enhanced search with fuzzy matching and typo tolerance
 */
export const fuzzySearch = (query: string, text: string): boolean => {
  if (!query || !text) return false;

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Exact match gets highest priority
  if (normalizedText.includes(normalizedQuery)) return true;

  // For longer queries, check individual words
  if (normalizedQuery.length > 3) {
    const words = normalizedQuery.split(' ').filter(word => word.length > 2);
    return words.some(word => normalizedText.includes(word));
  }

  return false;
};

/**
 * Search with scoring for ranking results
 */
export const searchWithScore = (
  query: string,
  text: string,
  field: 'title' | 'description' | 'author' | 'tags' = 'description'
): SearchResult | null => {
  if (!query || !text) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  let score = 0;
  let highlighted = text;

  // Exact match
  if (normalizedText.includes(normalizedQuery)) {
    score = field === 'title' ? 100 : field === 'author' ? 80 : 60;

    // Simple highlighting
    const regex = new RegExp(`(${query})`, 'gi');
    highlighted = text.replace(regex, '<mark>$1</mark>');

    return { score, highlighted };
  }

  // Word matching
  const words = normalizedQuery.split(' ').filter(word => word.length > 2);
  const matchingWords = words.filter(word => normalizedText.includes(word));

  if (matchingWords.length > 0) {
    score =
      (matchingWords.length / words.length) * (field === 'title' ? 50 : 30);
    return { score, highlighted };
  }

  return null;
};

/**
 * Enhanced search for proposals
 */
export const searchProposals = (proposals: any[], query: string) => {
  if (!query.trim()) return proposals;

  const results = proposals
    .map(proposal => {
      const titleResult = searchWithScore(query, proposal.title, 'title');
      const descriptionResult = searchWithScore(
        query,
        proposal.description || '',
        'description'
      );
      const authorResult = searchWithScore(query, proposal.author, 'author');

      const totalScore =
        (titleResult?.score || 0) +
        (descriptionResult?.score || 0) +
        (authorResult?.score || 0);

      return totalScore > 0 ? { ...proposal, searchScore: totalScore } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.searchScore || 0) - (a?.searchScore || 0));

  return results;
};

/**
 * Common search terms for suggestions
 */
export const getSearchSuggestions = (query: string): string[] => {
  const commonTerms = [
    'veterans',
    'memorial day',
    'charity funding',
    'holiday',
    'veteran support',
    'military families',
    'disabled veterans',
    'mental health',
    'housing',
    'education',
    'employment',
  ];

  if (!query) return commonTerms.slice(0, 5);

  const normalizedQuery = query.toLowerCase();
  return commonTerms
    .filter(term => term.toLowerCase().includes(normalizedQuery))
    .slice(0, 5);
};

/**
 * Recent searches management
 */
export const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const recent = localStorage.getItem('vmf_recent_searches');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (query: string): void => {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem('vmf_recent_searches', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};
