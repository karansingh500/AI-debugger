import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-code-fix.ts';
import '@/ai/flows/explain-error.ts';
import '@/ai/flows/generate-code-from-description.ts';