import type { BeCartItemResponse, EnrichedCartItem } from '@/api/service/Type';

/**
 * Groups flat BE cart items into a parent-child tree structure.
 * Top-level items (parentItemId === null) get their children nested.
 */
export function nestCartItems(flatItems: BeCartItemResponse[]): EnrichedCartItem[] {
    const childrenMap = new Map<string, EnrichedCartItem[]>();
    const topLevel: EnrichedCartItem[] = [];

    // First pass: wrap all items with enriched defaults
    const enrichedItems = flatItems.map((item): EnrichedCartItem => ({
        ...item,
        displayName: '',
        children: [],
    }));

    // Second pass: group children by parentItemId
    for (const item of enrichedItems) {
        if (item.parentItemId) {
            const siblings = childrenMap.get(item.parentItemId) || [];
            siblings.push(item);
            childrenMap.set(item.parentItemId, siblings);
        } else {
            topLevel.push(item);
        }
    }

    // Third pass: attach children to their parents
    for (const parent of topLevel) {
        parent.children = childrenMap.get(parent.id) || [];
    }

    return topLevel;
}

const SESSION_ID_KEY = 'glassify_session_id';

export function getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}

export function calculateCartTotal(items: EnrichedCartItem[]): number {
    return items.reduce((sum, item) => {
        const selfTotal = item.lineTotal;
        const childrenTotal = item.children.reduce((cs, child) => cs + child.lineTotal, 0);
        return sum + selfTotal + childrenTotal;
    }, 0);
}
