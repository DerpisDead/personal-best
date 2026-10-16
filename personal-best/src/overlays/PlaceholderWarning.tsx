import { C, T } from '../constants';
import { CHAPTER_NAME, CONTACT_NAME, CTA_LINE, WHY_LINE } from '../teamText';

/**
 * Placeholder warnings (section 8): while the team text is empty (or too
 * long), a 4 px dashed magenta box with an instruction replaces it. These are
 * meant to be impossible to miss.
 */

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const WHY_LINE_OK = WHY_LINE.trim() !== '' && words(WHY_LINE) <= 7;
export const CTA_LINE_OK = CTA_LINE.trim() !== '' && words(CTA_LINE) <= 5;
export const CHAPTER_OK = CHAPTER_NAME.trim() !== '';
export const CONTACT_OK = CONTACT_NAME.trim() !== '';

// Logged once per render process (module load).
const problems = [
  !WHY_LINE_OK && 'WHY_LINE is empty or longer than 7 words',
  !CTA_LINE_OK && 'CTA_LINE is empty or longer than 5 words',
  !CONTACT_OK && 'CONTACT_NAME is empty (the phone shows [NAME])',
  !CHAPTER_OK && 'CHAPTER_NAME is empty (the credit line shows [CHAPTER])',
].filter(Boolean);
if (problems.length > 0) {
  console.warn(`PLACEHOLDER TEXT IN USE: edit src/teamText.ts.\n  - ${problems.join('\n  - ')}`);
}

type PlaceholderWarningProps = {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

export const PlaceholderWarning: React.FC<PlaceholderWarningProps> = ({ children, style }) => (
  <div
    style={{
      ...T.warning,
      display: 'inline-block',
      padding: '14px 22px',
      border: `4px dashed ${C.warning}`,
      backgroundColor: 'rgba(0,0,0,0.35)',
      lineHeight: 1.2,
      ...style,
    }}
  >
    {children}
  </div>
);
