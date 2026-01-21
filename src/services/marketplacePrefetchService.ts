import { AppDispatch } from '../store/store';
import { issuesApi } from '../features/api/issuesApi';

/**
 * Marketplace Prefetch Service
 * 
 * This service prefetches marketplace data in the background to improve
 * perceived performance when users navigate to the marketplace.
 * 
 * Key features:
 * - Fetches unfiltered issues (both grouped and ungrouped) 
 * - Stores data in sessionStorage for fast access
 * - Manages prefetch lifecycle (start/stop/clear)
 * - Handles paginated fetching to get complete datasets
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const GROUPED_CACHE_PREFIX = 'marketplace_prefetch_grouped_';
const UNGROUPED_CACHE_PREFIX = 'marketplace_prefetch_ungrouped_';

interface CacheEntry {
  data: any;
  timestamp: number;
  expectedTotal: number;
  key: string;
}

class MarketplacePrefetchService {
  private dispatch: AppDispatch | null = null;
  private isRunning = false;
  private abortController: AbortController | null = null;

  public initialize(dispatch: AppDispatch): void {
    this.dispatch = dispatch;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public async startPrefetch(): Promise<void> {
    if (!this.dispatch) {
      console.warn('Prefetch service not initialized with dispatch');
      return;
    }

    if (this.isRunning) {
      return; // Already running
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      // Clear old cache before fetching new data to prevent quota issues
      this.clearPrefetchCache();
      
      // Fetch all issues with pagination
      const { issues, expectedTotal } = await this.fetchAllIssues();
      
      if (this.abortController?.signal.aborted) return;

      // Store both grouped and ungrouped cache entries
      const ungroupedCacheKey = this.getUngroupedCacheKey({});
      const groupedCacheKey = this.getGroupedCacheKey({});

      this.setCache(ungroupedCacheKey, {
        issues,
        total_filtered: { count: expectedTotal }
      }, expectedTotal);

      this.setCache(groupedCacheKey, {
        issues,
        total_filtered: { count: expectedTotal }
      }, expectedTotal);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Marketplace prefetch failed:', error);
      }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  public stopPrefetch(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }

  public clearPrefetchCache(): void {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith(GROUPED_CACHE_PREFIX) || key.startsWith(UNGROUPED_CACHE_PREFIX))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear prefetch cache:', error);
    }
  }

  private async fetchAllIssues(): Promise<{ issues: any[], expectedTotal: number }> {
    if (!this.dispatch) throw new Error('Dispatch not initialized');

    const limit = 500; // Fetch in chunks
    const MAX_PREFETCH_ISSUES = 10000; // Reasonable limit for prefetch performance
    let offset = 0;
    let allIssues: any[] = [];
    let expectedTotal = 0;

    // Fetch first page to get total count
    const firstPageResult = await this.dispatch(
      issuesApi.endpoints.getPaginatedIssues.initiate({
        offset: 0,
        limit,
        search: '',
        type: '',
        city: '',
        state: '',
        vendor_assigned: false,
      })
    );

    if (!firstPageResult.data) {
      throw new Error('Failed to fetch first page');
    }

    allIssues = firstPageResult.data.issues || [];
    expectedTotal = firstPageResult.data.total_filtered?.count || firstPageResult.data.total?.count || 0;

    // Fetch remaining pages if needed
    while (allIssues.length < expectedTotal && 
           allIssues.length < MAX_PREFETCH_ISSUES && 
           offset + limit < expectedTotal) {
      if (this.abortController?.signal.aborted) break;

      offset += limit;
      
      const pageResult = await this.dispatch(
        issuesApi.endpoints.getPaginatedIssues.initiate({
          offset,
          limit,
          search: '',
          type: '',
          city: '',
          state: '',
          vendor_assigned: false,
        })
      );

      if (pageResult.data?.issues) {
        allIssues.push(...pageResult.data.issues);
      }
    }

    return { issues: allIssues, expectedTotal };
  }

  private getUngroupedCacheKey(params: any): string {
    return `${UNGROUPED_CACHE_PREFIX}${JSON.stringify(params)}`;
  }

  private getGroupedCacheKey(params: any): string {
    return `${GROUPED_CACHE_PREFIX}${JSON.stringify(params)}`;
  }

  private setCache(key: string, data: any, expectedTotal: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expectedTotal,
      key
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // QuotaExceededError - try to clear old cache and retry once
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          this.clearPrefetchCache();
          sessionStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          // Silently fail if still can't cache - not critical for app functionality
          console.debug('Prefetch cache skipped due to storage quota');
        }
      }
    }
  }

  public getCache(key: string): any | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      
      const entry: CacheEntry = JSON.parse(item);
      const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve prefetch cache:', error);
      return null;
    }
  }

  public findCachedData(groupByAddress: boolean): any | null {
    try {
      const prefix = groupByAddress ? GROUPED_CACHE_PREFIX : UNGROUPED_CACHE_PREFIX;
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const cachedData = this.getCache(key);
          if (cachedData && cachedData.issues && cachedData.issues.length > 0) {
            return cachedData;
          }
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to find cached data:', error);
      return null;
    }
  }
}

export const marketplacePrefetchService = new MarketplacePrefetchService();


