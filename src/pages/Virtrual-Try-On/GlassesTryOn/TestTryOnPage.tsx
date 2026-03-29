import { useState } from "react";
import GlassesTryOnPopup from "./GlassesTryOnPopup";
import { Box } from "@mui/material";

const TestTryOnPage = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const isProcessing = status === "loading" || status === "initializing";

    return (
        <>
            <Box component="button" onClick={() => setIsOpen(true)}
                disabled={isProcessing}
                sx={{ px: 3.5, py: 1.25, border: "1.5px solid rgba(201,168,76,0.6)", }}>
                Browse Glasses
            </Box>

            <GlassesTryOnPopup
                frameGroupId='0250409c-b0e7-4cb3-89ba-aa5f2cff282d'
                open={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}

export default TestTryOnPage;