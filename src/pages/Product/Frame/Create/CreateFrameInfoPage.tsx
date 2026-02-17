import { Store } from "@mui/icons-material";
import { Box, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface ShopFormData {
    shopName: string;
    shopDescription: string;
    businessType: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    shopAddress: string;
    city: string;
    district: string;
    ward: string;
    taxCode: string;
}


interface FrameVariant {
    id: string;
    name: string;
    color: string;
    size: string;
    sku: string;
    status: 'active' | 'draft';
}

const mockVariants: FrameVariant[] = [
    // {
    //     id: '1',
    //     name: 'Black – Medium',
    //     color: 'Black',
    //     size: 'M',
    //     sku: 'FR-BLK-M',
    //     status: 'active',
    // },
    // {
    //     id: '2',
    //     name: 'Silver – Large',
    //     color: 'Silver',
    //     size: 'L',
    //     sku: 'FR-SLV-L',
    //     status: 'draft',
    // },
];

const CreateFrameInfoPage = () => {
    const theme = useTheme()


    const [formData, setFormData] = useState<ShopFormData>({
        shopName: '',
        shopDescription: '',
        businessType: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        shopAddress: '',
        city: '',
        district: '',
        ward: '',
        taxCode: '',
    });

    const handleInputChange = (field: keyof ShopFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSelectChange = (field: keyof ShopFormData) => (e: any) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };


    return (
        <Box>
            <Typography
                sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme.palette.custom.neutral[800],
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Store sx={{ color: theme.palette.primary.main }} />
                Frame Information
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                        fullWidth
                        label="Frame Name"
                        value={formData.shopName}
                        onChange={handleInputChange('shopName')}
                        placeholder="Enter frame name"
                        InputProps={{
                            startAdornment: <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Frame Category</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Frame Category"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="rectangle">Rectangle</MenuItem>
                            <MenuItem value="square">Square</MenuItem>
                            <MenuItem value="round">Round</MenuItem>
                            <MenuItem value="oval">Oval</MenuItem>
                            <MenuItem value="cat_eye">Cat Eye</MenuItem>
                            <MenuItem value="aviator">Aviator</MenuItem>
                            <MenuItem value="browline">Browline</MenuItem>
                            <MenuItem value="geometric">Geometric</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Frame Type</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Frame Type"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="full_rim">Full Rim</MenuItem>
                            <MenuItem value="half_rim">Half Rim</MenuItem>
                            <MenuItem value="rimless">Rimless</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Frame Shape</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Frame Shape"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="rectangle">Rectangle</MenuItem>
                            <MenuItem value="square">Square</MenuItem>
                            <MenuItem value="round">Round</MenuItem>
                            <MenuItem value="oval">Oval</MenuItem>
                            <MenuItem value="cat_eye">Cat Eye</MenuItem>
                            <MenuItem value="aviator">Aviator</MenuItem>
                            <MenuItem value="browline">Browline</MenuItem>
                            <MenuItem value="geometric">Geometric</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Frame Material</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Frame Material"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="acetate">Acetate</MenuItem>
                            <MenuItem value="metal">Metal</MenuItem>
                            <MenuItem value="titanium">Titanium</MenuItem>
                            <MenuItem value="plastic">Plastic</MenuItem>
                            <MenuItem value="mixed">Mixed Material</MenuItem>
                            <MenuItem value="carbon">Carbon Fiber</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                        <InputLabel>Gender Target</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Gender Target"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="others">Others</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                        <InputLabel>Age Group</InputLabel>
                        <Select
                            value={formData.businessType}
                            label="Age Group"
                            onChange={handleSelectChange('businessType')}
                        >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="others">Others</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={formData.shopDescription}
                        onChange={handleInputChange('shopDescription')}
                        placeholder="Describe your frame..."
                    />
                </Grid>
            </Grid>

            <Divider
                sx={{
                    my: 3,
                    borderColor: '#E5E7EB', // xám nhạt
                    borderBottomWidth: 1
                }}
            />
            {/* FRAME VARIANT */}
            <Typography
                sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme.palette.custom.neutral[800],
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                Frame Variants
            </Typography>

            {mockVariants.length === 0 ? (
                <Box
                    sx={{
                        border: '1px dashed #E5E7EB',
                        borderRadius: 1,
                        py: 4,
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 14,
                            color: theme.palette.custom.neutral[500],
                        }}
                    >
                        No frame variants yet. Please add at least one variant.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {mockVariants.map((variant) => (
                        <Grid size={{ xs: 12 }} key={variant.id}>
                            <Box
                                sx={{
                                    border: '1px solid #E5E7EB',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                {/* LEFT INFO */}
                                <Box>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[800],
                                        }}
                                    >
                                        {variant.name}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: theme.palette.custom.neutral[500],
                                        }}
                                    >
                                        Color: {variant.color} • Size: {variant.size} • SKU: {variant.sku}
                                    </Typography>
                                </Box>

                                {/* RIGHT ACTION */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color:
                                                variant.status === 'active'
                                                    ? theme.palette.success.main
                                                    : theme.palette.custom.neutral[500],
                                        }}
                                    >
                                        {variant.status === 'active' ? 'Active' : 'Draft'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

export default CreateFrameInfoPage