import { useEffect, useState } from 'react';
import { lensApi } from '@/api/lens-api';

export const formatEnumLabel = (value?: string) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
};

export const useLensEnums = () => {
  const [lensCategories, setLensCategories] = useState<string[]>([]);
  const [progressiveTypes, setProgressiveTypes] = useState<string[]>([]);
  const [tintBehaviors, setTintBehaviors] = useState<string[]>([]);
  const [prescriptionUsages, setPrescriptionUsages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const enums = await lensApi.getEnums();
        if (!enums || !active) return;
        setLensCategories(enums.lensCategories ?? []);
        setProgressiveTypes(enums.progressiveTypes ?? []);
        setTintBehaviors(enums.lensTintBehaviors ?? []);
        setPrescriptionUsages(enums.prescriptionUsages ?? []);
      } catch (err) {
        console.warn('Failed to load lens enums', err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    lensCategories,
    progressiveTypes,
    tintBehaviors,
    prescriptionUsages,
  } as const;
};

export default useLensEnums;
