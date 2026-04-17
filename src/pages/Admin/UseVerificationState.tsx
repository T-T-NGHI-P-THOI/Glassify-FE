import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import VerificationAPI from '@/api/verification-api';
import type {
    ProductVerificationItem,
    VerificationStatus,
    ProductType,
    VerifyPayload,
    VerificationStatsResponse,
} from '@/types/verifications';

// ─── State shape ──────────────────────────────────────────────────────────────

interface UseVerificationState {
    items: ProductVerificationItem[];
    totalElements: number;
    totalPages: number;
    loading: boolean;
    statsLoading: boolean;
    stats: VerificationStatsResponse;
    verifyingId: string | null;   // which item is currently being verified
}

const DEFAULT_STATS: VerificationStatsResponse = {
    pending: 0, approved: 0, rejected: 0, total: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVerification(options: {
    status: VerificationStatus | 'ALL';
    productType: ProductType | 'ALL';
    search: string;
    page: number;       // 1-indexed (UI) — converted to 0-indexed for API
    pageSize: number;
}) {
    const { status, productType, search, page, pageSize } = options;

    const [state, setState] = useState<UseVerificationState>({
        items: [],
        totalElements: 0,
        totalPages: 0,
        loading: false,
        statsLoading: false,
        stats: DEFAULT_STATS,
        verifyingId: null,
    });

    // Debounce ref — avoids a new fetch on every keystroke
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch list ────────────────────────────────────────────────────────────

    const fetchList = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const data = await VerificationAPI.list({
                status,
                productType,
                search,
                page: page - 1,   // convert 1-indexed UI page to 0-indexed Spring
                size: pageSize,
            });
            setState(prev => ({
                ...prev,
                items: data.content,
                totalElements: data.totalElements,
                totalPages: data.totalPages,
                loading: false,
            }));
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load verifications');
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [status, productType, search, page, pageSize]);

    // ── Fetch stats ───────────────────────────────────────────────────────────

    const fetchStats = useCallback(async () => {
        setState(prev => ({ ...prev, statsLoading: true }));
        try {
            const stats = await VerificationAPI.getStats();
            setState(prev => ({ ...prev, stats, statsLoading: false }));
        } catch {
            setState(prev => ({ ...prev, statsLoading: false }));
        }
    }, []);

    // ── Refresh both ──────────────────────────────────────────────────────────

    const refresh = useCallback(() => {
        fetchList();
        fetchStats();
    }, [fetchList, fetchStats]);

    // ── Debounced re-fetch when filters change ────────────────────────────────

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Debounce search input; fire immediately for non-search filter changes
        const delay = search !== undefined ? 400 : 0;
        debounceRef.current = setTimeout(fetchList, delay);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [fetchList]);

    // ── Fetch stats once on mount and when list changes ───────────────────────

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // ── Verify action ─────────────────────────────────────────────────────────

    const verify = useCallback(async (
        id: string,
        payload: VerifyPayload,
        onSuccess?: () => void,
    ) => {
        setState(prev => ({ ...prev, verifyingId: id }));
        try {
            const updated = await VerificationAPI.verify(id, payload);

            // Optimistically update the item in place so the UI reflects the
            // new status without a full refetch
            setState(prev => ({
                ...prev,
                verifyingId: null,
                items: prev.items.map(item =>
                    item.id === id
                        ? { ...item, status: updated.status, rejectionReason: updated.rejectionReason, rejectionNote: updated.rejectionNote, reviewedByName: updated.reviewedByName, reviewedAt: updated.reviewedAt }
                        : item
                ),
            }));

            // Refresh stats to update the counters
            fetchStats();

            toast.success(
                payload.action === 'APPROVED'
                    ? 'Product approved successfully!'
                    : 'Product rejected.'
            );
            onSuccess?.();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Verification action failed';
            toast.error(msg);
            setState(prev => ({ ...prev, verifyingId: null }));
            throw err; // re-throw so dialog can handle its own loading state
        }
    }, [fetchStats]);

    return {
        ...state,
        refresh,
        verify,
    };
}