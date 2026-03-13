// ============================================
// USE USER PROFILE HOOK - Custom hook để quản lý User Profile
// Bao gồm: fetch, update, loading states, error handling
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type {ChangePasswordRequest, UpdateProfileRequest, User, UserStats} from "@/models/User.ts";
import UserService from "@/api/service/userApi.ts";

/**
 * Interface cho state của hook
 */
interface UseUserProfileState {
    user: User | null;
    stats: UserStats | null;
    loading: boolean;
    updating: boolean;
    error: string | null;
}

/**
 * Interface cho return value của hook
 */
interface UseUserProfileReturn extends UseUserProfileState {
    // Actions
    fetchProfile: () => Promise<void>;
    updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
    uploadAvatar: (file: File) => Promise<boolean>;
    deleteAvatar: () => Promise<boolean>;
    changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
    linkGoogle: (token: string) => Promise<boolean>;
    unlinkGoogle: () => Promise<boolean>;
    clearError: () => void;
}

/**
 * Custom hook để quản lý User Profile
 * Cung cấp các actions và states cần thiết cho Profile page
 */
export const useUserProfile = (): UseUserProfileReturn => {
    // ==================== STATE ====================
    const [state, setState] = useState<UseUserProfileState>({
        user: null,
        stats: null,
        loading: true,
        updating: false,
        error: null,
    });

    // ==================== HELPER ====================

    /**
     * Update state một cách an toàn
     */
    const updateState = useCallback((updates: Partial<UseUserProfileState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    }, []);

    // ==================== ACTIONS ====================

    /**
     * Fetch thông tin profile từ API
     */
    const fetchProfile = useCallback(async () => {
        try {
            updateState({ loading: true, error: null });

            const response = await UserService.getMyProfile();

            if (response.success && response.data) {
                updateState({
                    user: response.data.user,
                    stats: response.data.stats || null,
                    loading: false,
                });
            } else {
                updateState({
                    error: response.message || 'Failed to fetch profile',
                    loading: false,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
            updateState({ error: errorMessage, loading: false });
        }
    }, [updateState]);

    /**
     * Cập nhật thông tin profile
     */
    const updateProfile = useCallback(
        async (data: UpdateProfileRequest): Promise<boolean> => {
            try {
                updateState({ updating: true, error: null });

                const response = await UserService.updateProfile(data);

                if (response.success && response.data) {
                    updateState({ user: response.data, updating: false });
                    return true;
                } else {
                    updateState({
                        error: response.message || 'Failed to update profile',
                        updating: false,
                    });
                    return false;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
                updateState({ error: errorMessage, updating: false });
                return false;
            }
        },
        [updateState]
    );

    /**
     * Upload avatar mới
     */
    const uploadAvatar = useCallback(
        async (file: File): Promise<boolean> => {
            try {
                updateState({ updating: true, error: null });

                const response = await UserService.uploadAvatar(file);

                if (response.success && response.data) {
                    // Cập nhật avatarUrl trong user state
                    setState((prev) => ({
                        ...prev,
                        user: prev.user ? { ...prev.user, avatarUrl: response.data!.avatarUrl } : null,
                        updating: false,
                    }));
                    return true;
                } else {
                    updateState({
                        error: response.message || 'Failed to upload avatar',
                        updating: false,
                    });
                    return false;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
                updateState({ error: errorMessage, updating: false });
                return false;
            }
        },
        [updateState]
    );

    /**
     * Xóa avatar
     */
    const deleteAvatar = useCallback(async (): Promise<boolean> => {
        try {
            updateState({ updating: true, error: null });

            const response = await UserService.deleteAvatar();

            if (response.success) {
                setState((prev) => ({
                    ...prev,
                    user: prev.user ? { ...prev.user, avatarUrl: undefined } : null,
                    updating: false,
                }));
                return true;
            } else {
                updateState({
                    error: response.message || 'Failed to delete avatar',
                    updating: false,
                });
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete avatar';
            updateState({ error: errorMessage, updating: false });
            return false;
        }
    }, [updateState]);

    /**
     * Đổi mật khẩu
     */
    const changePassword = useCallback(
        async (data: ChangePasswordRequest): Promise<boolean> => {
            try {
                updateState({ updating: true, error: null });

                const response = await UserService.changePassword(data);

                if (response.success) {
                    updateState({ updating: false });
                    return true;
                } else {
                    updateState({
                        error: response.message || 'Failed to change password',
                        updating: false,
                    });
                    return false;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
                updateState({ error: errorMessage, updating: false });
                return false;
            }
        },
        [updateState]
    );

    /**
     * Liên kết với Google
     */
    const linkGoogle = useCallback(
        async (token: string): Promise<boolean> => {
            try {
                updateState({ updating: true, error: null });

                const response = await UserService.linkGoogleAccount(token);

                if (response.success && response.data) {
                    updateState({ user: response.data, updating: false });
                    return true;
                } else {
                    updateState({
                        error: response.message || 'Failed to link Google account',
                        updating: false,
                    });
                    return false;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to link Google account';
                updateState({ error: errorMessage, updating: false });
                return false;
            }
        },
        [updateState]
    );

    /**
     * Hủy liên kết Google
     */
    const unlinkGoogle = useCallback(async (): Promise<boolean> => {
        try {
            updateState({ updating: true, error: null });

            const response = await UserService.unlinkGoogleAccount();

            if (response.success && response.data) {
                updateState({ user: response.data, updating: false });
                return true;
            } else {
                updateState({
                    error: response.message || 'Failed to unlink Google account',
                    updating: false,
                });
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unlink Google account';
            updateState({ error: errorMessage, updating: false });
            return false;
        }
    }, [updateState]);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // ==================== EFFECTS ====================

    /**
     * Fetch profile khi component mount
     */
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ==================== RETURN ====================

    return {
        ...state,
        fetchProfile,
        updateProfile,
        uploadAvatar,
        deleteAvatar,
        changePassword,
        linkGoogle,
        unlinkGoogle,
        clearError,
    };
};

export default useUserProfile;