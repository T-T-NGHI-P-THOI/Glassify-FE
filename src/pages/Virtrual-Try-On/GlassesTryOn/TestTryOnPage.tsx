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
                frameGroupId='214051f1-12d0-419a-ae4f-dc9be61a65dc'
                open={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}

export default TestTryOnPage;