import { useEffect, useRef } from "react";

const CHANNEL_NAME = "glasses_tryon_popup";
const STORAGE_KEY = "glasses_tryon_popup_open";

export function usePopupSingleInstance(
    open: boolean,
    onBlockedByOtherTab: () => void,
    onClose: () => void,
) {
    const channelRef = useRef<BroadcastChannel | null>(null);
    const tabIdRef = useRef<string>(crypto.randomUUID());

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (e) => {
            if (e.data.type === "POPUP_OPENED" && e.data.tabId !== tabIdRef.current) {
                // Tab khác vừa mở popup → nếu tab này đang mở thì đóng
                onClose();
            }
        };

        return () => channel.close();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;

        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing && existing !== tabIdRef.current) {
            // Đã có tab khác giữ popup → block
            onBlockedByOtherTab();
            return;
        }

        // Chiếm quyền sở hữu
        localStorage.setItem(STORAGE_KEY, tabIdRef.current);
        channelRef.current?.postMessage({ type: "POPUP_OPENED", tabId: tabIdRef.current });

        return () => {
            // Khi popup đóng, giải phóng nếu tab này đang giữ
            if (localStorage.getItem(STORAGE_KEY) === tabIdRef.current) {
                localStorage.removeItem(STORAGE_KEY);
            }
        };
    }, [open, onBlockedByOtherTab]);
}