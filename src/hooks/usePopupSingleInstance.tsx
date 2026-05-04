import { useEffect, useRef, useCallback } from "react";

const CHANNEL_NAME = "glasses_tryon_popup";
const STORAGE_KEY = "glasses_tryon_popup_open";

export function usePopupSingleInstance(
    open: boolean,
    onBlockedByOtherTab: () => void,
    onClose: () => void,
) {
    const channelRef = useRef<BroadcastChannel | null>(null);
    const tabIdRef = useRef<string>(crypto.randomUUID());
    const isOwnerRef = useRef(false);
    const blockedRef = useRef(false);

    const release = useCallback(() => {
        if (isOwnerRef.current) {
            sessionStorage.removeItem(STORAGE_KEY);
            channelRef.current?.postMessage({ type: "POPUP_CLOSED", tabId: tabIdRef.current });
            isOwnerRef.current = false;
        }
    }, []);

    // Mount một lần duy nhất
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (e) => {
            // Tab khác vừa mở popup → đóng tab này nếu đang giữ
            if (e.data.type === "POPUP_OPENED" && e.data.tabId !== tabIdRef.current) {
                release();
                onClose();
            }
            // Tab mới hỏi ai đang giữ → reply nếu mình đang giữ
            if (e.data.type === "QUERY_STATE" && e.data.tabId !== tabIdRef.current) {
                if (isOwnerRef.current) {
                    channel.postMessage({ type: "STATE_REPLY", tabId: tabIdRef.current });
                }
            }
        };

        const handleUnload = () => release();
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            release();
            channel.close();
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!open) {
            release();
            blockedRef.current = false;
            return;
        }

        blockedRef.current = false;

        // Hỏi các tab khác xem có ai đang giữ không
        channelRef.current?.postMessage({ type: "QUERY_STATE", tabId: tabIdRef.current });

        // Lắng nghe reply trong 80ms
        const channel = channelRef.current!;
        const onReply = (e: MessageEvent) => {
            if (e.data.type === "STATE_REPLY" && e.data.tabId !== tabIdRef.current) {
                blockedRef.current = true;
                clearTimeout(timer);
                onBlockedByOtherTab();
                channel.removeEventListener("message", onReply);
            }
        };
        channel.addEventListener("message", onReply);

        // Sau 80ms không ai reply → chiếm quyền
        const timer = setTimeout(() => {
            channel.removeEventListener("message", onReply);
            if (blockedRef.current) return;

            isOwnerRef.current = true;
            sessionStorage.setItem(STORAGE_KEY, tabIdRef.current);
            channel.postMessage({ type: "POPUP_OPENED", tabId: tabIdRef.current });
        }, 80);

        return () => {
            clearTimeout(timer);
            channel.removeEventListener("message", onReply);
        };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
}