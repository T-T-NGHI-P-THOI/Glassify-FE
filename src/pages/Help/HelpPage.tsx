import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
} from '@mui/material';
import { Add, Remove, HelpOutline } from '@mui/icons-material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'glasses' | 'measurement' | 'tryon' | 'order';
}

const faqs: FAQItem[] = [
  // Glasses
  {
    id: '1',
    category: 'glasses',
    question: 'How do I choose glasses that suit my face shape?',
    answer:
      'Face shape is the most important factor when choosing frames. Oval faces suit almost any style. Round faces look best with angular frames like rectangles to add definition. Square faces are balanced by round or oval frames. Heart-shaped faces pair well with frames that are wider at the bottom, like aviators or round styles.',
  },
  {
    id: '2',
    category: 'glasses',
    question: 'What is the difference between nearsighted, farsighted, and astigmatism prescriptions?',
    answer:
      'Nearsighted (myopia) lenses correct difficulty seeing distant objects and have a negative power (e.g. -1.50). Farsighted (hyperopia) lenses correct difficulty seeing up close and have a positive power (e.g. +2.00). Astigmatism occurs when the cornea is irregularly shaped and is described by CYL and AXIS values on your prescription.',
  },
  {
    id: '3',
    category: 'glasses',
    question: 'Do blue light blocking lenses actually work?',
    answer:
      'Blue light blocking lenses filter a portion of high-energy visible light emitted by screens. They can reduce digital eye strain during extended screen use and may improve sleep quality if you use devices in the evening. Effectiveness depends on the quality of the coating and your usage habits. They are a good preventive choice for heavy screen users.',
  },
  {
    id: '4',
    category: 'glasses',
    question: 'How often should I replace my glasses?',
    answer:
      'It is generally recommended to have your eyes checked and update your prescription every 1–2 years. However, if you frequently experience headaches, blurry vision, or eye strain with your current glasses, visit an eye care professional sooner. Children and teenagers should have more frequent check-ups as their prescriptions can change quickly.',
  },
  // Measurement
  {
    id: '5',
    category: 'measurement',
    question: 'Can I measure my eyes at home?',
    answer:
      'You can use our in-app tools for an initial estimate, but a professional eye exam is always the most accurate method. An optometrist will measure your full prescription including SPH (sphere), CYL (cylinder), AXIS, ADD (for reading glasses), and PD (pupillary distance) — all of which are needed to make correct lenses.',
  },
  {
    id: '6',
    category: 'measurement',
    question: 'What is PD (pupillary distance) and why does it matter?',
    answer:
      'PD is the distance in millimeters between your two pupils. It is used to align the optical center of each lens directly in front of your eye, giving you the clearest and most comfortable vision. The average adult PD ranges from 54–74 mm. You can have it measured at an optical store or use our online PD measurement tool.',
  },
  {
    id: '7',
    category: 'measurement',
    question: 'How do I read my eyeglass prescription?',
    answer:
      'A prescription lists OD (right eye) and OS (left eye). Each has: SPH (sphere — the main correction power), CYL (cylinder — astigmatism correction), AXIS (orientation of astigmatism, 0–180°), ADD (extra reading power, if needed), and PD. A minus SPH means nearsighted; a plus SPH means farsighted. Example: OD -2.50 -0.75 x 180 means the right eye is -2.50 nearsighted with -0.75 astigmatism at axis 180.',
  },
  {
    id: '8',
    category: 'measurement',
    question: 'Can I order high-prescription glasses online?',
    answer:
      'Yes. Simply enter your exact prescription from your eye doctor, including SPH, CYL, AXIS, and PD. For prescriptions beyond ±6.00, we recommend selecting high-index lenses (1.67 or 1.74) for thinner, lighter results. Our team reviews all high-prescription orders before production to ensure accuracy.',
  },
  // Try-on
  {
    id: '9',
    category: 'tryon',
    question: 'How does the virtual try-on feature work?',
    answer:
      'Glassify\'s Virtual Try-On uses facial landmark detection to overlay glasses frames onto your face in real time. You can use your live camera or upload a photo. The system automatically detects key facial points and renders the frames at a realistic scale so you can see how each style looks before purchasing.',
  },
  {
    id: '10',
    category: 'tryon',
    question: 'How accurate is the virtual try-on?',
    answer:
      'Virtual Try-On gives you a highly accurate preview of frame style, shape, and color on your face. However, the physical feel — weight, fit, and temple length — can only be assessed when wearing the glasses in person. We recommend using the tool to narrow down your choices, then take advantage of our 7-day return policy if the fit is not right.',
  },
  {
    id: '11',
    category: 'tryon',
    question: 'Is my photo saved when I use virtual try-on?',
    answer:
      'No. Glassify does not store your facial images from virtual try-on sessions. All face detection processing happens on-device or is discarded immediately after the session ends. We are committed to protecting your personal data and privacy.',
  },
  {
    id: '12',
    category: 'tryon',
    question: 'Which devices support virtual try-on?',
    answer:
      'Virtual Try-On works best on modern browsers (Chrome, Safari, Edge) with camera access enabled. On desktop, a webcam is required. On mobile, it runs smoothly on iOS 14+ and Android 10+ using the front camera. For best results, ensure good lighting and face the camera directly.',
  },
  // Order
  {
    id: '13',
    category: 'order',
    question: 'How long does it take to make my glasses?',
    answer:
      'Production time depends on the lens type and prescription complexity. Non-prescription lenses (fashion, blue light): 3–5 business days. Standard prescription lenses: 5–7 business days. High-index or specialty lenses: 7–14 business days. After production, each pair goes through quality control before shipping, which takes an additional 2–3 days.',
  },
  {
    id: '14',
    category: 'order',
    question: 'What is the return and exchange policy?',
    answer:
      'We accept returns within 7 days of receiving your order if the product has a manufacturing defect, the lenses do not match your submitted prescription, or the frame was damaged in transit. Custom prescription glasses cannot be refunded unless the error is on our side. Please photograph the issue and contact support within 48 hours of delivery.',
  },
];

const categories = [
  { key: 'all', label: 'All' },
  { key: 'glasses', label: 'Eyeglasses' },
  { key: 'measurement', label: 'Eye Measurement' },
  { key: 'tryon', label: 'Virtual Try-On' },
  { key: 'order', label: 'Orders & Returns' },
];

const HelpPage = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filtered = faqs.filter(
    (f) => activeCategory === 'all' || f.category === activeCategory,
  );

  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 !== 0);

  return (
    <Box sx={{ bgcolor: theme.palette.custom.neutral[50], minHeight: '100vh', py: 9 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, md: 8, lg: 12 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Chip
            icon={<HelpOutline sx={{ fontSize: '16px !important' }} />}
            label="FAQ"
            size="small"
            sx={{
              mb: 2.5,
              bgcolor: theme.palette.custom.neutral[800],
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              px: 0.5,
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: theme.palette.custom.neutral[900],
              mb: 2,
              fontSize: { xs: '2.2rem', md: '3.25rem' },
              lineHeight: 1.15,
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            sx={{
              fontSize: 17,
              color: theme.palette.custom.neutral[500],
              maxWidth: 520,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Find quick answers to common questions about our eyewear, lens measurements, and Virtual Try-On feature.
          </Typography>
        </Box>

        {/* Category Filter */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', mb: 6 }}>
          {categories.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              onClick={() => setActiveCategory(cat.key)}
              sx={{
                fontWeight: 600,
                fontSize: 14,
                px: 1,
                height: 36,
                cursor: 'pointer',
                transition: 'all 0.2s',
                ...(activeCategory === cat.key
                  ? {
                      bgcolor: theme.palette.custom.neutral[900],
                      color: '#fff',
                      '&:hover': { bgcolor: theme.palette.custom.neutral[700] },
                    }
                  : {
                      bgcolor: '#fff',
                      color: theme.palette.custom.neutral[600],
                      border: `1px solid ${theme.palette.custom.border.light}`,
                      '&:hover': { bgcolor: theme.palette.custom.neutral[100] },
                    }),
              }}
            />
          ))}
        </Box>

        {/* Two-column Accordion Grid */}
        <Grid container spacing={2.5} alignItems="flex-start">
          {[left, right].map((col, colIdx) => (
            <Grid key={colIdx} size={{ xs: 12, md: 6 }}>
              {col.map((faq) => (
                <Accordion
                  key={faq.id}
                  expanded={expanded === faq.id}
                  onChange={handleChange(faq.id)}
                  elevation={0}
                  disableGutters
                  sx={{
                    mb: 2,
                    border: `1px solid ${
                      expanded === faq.id
                        ? theme.palette.custom.neutral[300]
                        : theme.palette.custom.border.light
                    }`,
                    borderRadius: '14px !important',
                    bgcolor: '#fff',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: expanded === faq.id ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
                    '&:before': { display: 'none' },
                    '&:hover': { borderColor: theme.palette.custom.neutral[300] },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expanded === faq.id ? (
                        <Remove
                          sx={{
                            fontSize: 20,
                            color: '#fff',
                            bgcolor: theme.palette.custom.neutral[800],
                            borderRadius: '50%',
                            p: '3px',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Add
                          sx={{
                            fontSize: 20,
                            color: theme.palette.custom.neutral[600],
                            bgcolor: theme.palette.custom.neutral[100],
                            borderRadius: '50%',
                            p: '3px',
                            flexShrink: 0,
                          }}
                        />
                      )
                    }
                    sx={{
                      px: 3,
                      py: 2,
                      minHeight: 'unset',
                      '& .MuiAccordionSummary-content': { my: 0 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: theme.palette.custom.neutral[800],
                        pr: 1.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        color: theme.palette.custom.neutral[600],
                        lineHeight: 1.8,
                      }}
                    >
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HelpPage;
