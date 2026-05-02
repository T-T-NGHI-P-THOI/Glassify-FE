import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    Chip
} from "@mui/material";
import { Cancel, Close } from "@mui/icons-material";
import { REJECT_REASONS } from "@/types/verifications";

const REJECT_REASON_LABEL: Record<string, string> = Object.fromEntries(
    REJECT_REASONS.map(r => [r.value, r.label])
);

function RejectionDialog({
    open,
    onClose,
    reason,
    note,
}: {
    open: boolean;
    onClose: () => void;
    reason: string | null;
    note: string | null;
}) {
    if (!reason) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    bgcolor: "#FEF2F2",
                    borderBottom: "1px solid #FEE2E2",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Cancel sx={{ fontSize: 18, color: "#DC2626" }} />
                    <Typography fontSize={14} fontWeight={700} color="#991B1B">
                        Rejection details
                    </Typography>
                </Box>

                <IconButton onClick={onClose} size="small">
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            {/* Body */}
            <DialogContent
                sx={{
                    px: 2.5,
                    py: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {/* Reason */}
                <Box>
                    <Typography
                        fontSize={11}
                        fontWeight={700}
                        color="text.secondary"
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            mb: 0.75,
                        }}
                    >
                        Reason
                    </Typography>

                    <Chip
                        label={REJECT_REASON_LABEL[reason] ?? reason}
                        size="small"
                        sx={{
                            height: 24,
                            fontSize: 12,
                            fontWeight: 600,
                            bgcolor: "#FEE2E2",
                            color: "#991B1B",
                            borderRadius: 1.5,
                        }}
                    />
                </Box>

                {/* Note */}
                {note && (
                    <Box>
                        <Typography
                            fontSize={11}
                            fontWeight={700}
                            color="text.secondary"
                            sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                mb: 0.75,
                            }}
                        >
                            Note
                        </Typography>

                        <Typography
                            fontSize={13}
                            sx={{
                                lineHeight: 1.6,
                                bgcolor: "#FEF2F2",
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 2,
                                border: "1px solid #FEE2E2",
                            }}
                        >
                            {note}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default RejectionDialog;