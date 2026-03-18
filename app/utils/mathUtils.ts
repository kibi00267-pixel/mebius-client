/**
 * Simple Math Formatter
 * Converts text representations of math (like fractions) into HTML for display.
 *
 * Strategy:
 *  1. Replace only *inline* math tags (<sup>, <sub>, <span窶ｦ>, </sup>, </sub>, </span>)
 *     with \x00N\x00 placeholders so they remain part of the surrounding expression.
 *  2. Split the remaining string by block tags (<br>, <div>, etc.) and process each
 *     segment independently 窶・this prevents <br>(2) from being sucked into a denominator.
 *  3. Within each segment, apply fraction and exponent formatting.
 *     The atom pattern treats complete placeholders (\x00N\x00) as atomic units,
 *     so "x\x000\x00y/2" correctly parses as numerator=xﾂｲy, denominator=2.
 *  4. Restore placeholders back to their original HTML tags.
 */
export function formatMath(text: string): string {
    if (!text) return '';

    // Step 1: Stash only inline math tags (sup/sub/span) as placeholders.
    const tagStore: string[] = [];
    const INLINE_TAG_RE = /(<(?:sup|sub|\/sup|\/sub|span(?:\s[^>]*)?)>)/gi;
    const SVG_BLOCK_RE = /<svg[\s\S]*?<\/svg>/gi;
    const withSvgPlaceholders = text.replace(SVG_BLOCK_RE, (svg) => {
        const idx = tagStore.length;
        tagStore.push(svg);
        return `\x00${idx}\x00`;
    });
    const withPlaceholders = withSvgPlaceholders.replace(INLINE_TAG_RE, (tag) => {
        const idx = tagStore.length;
        tagStore.push(tag);
        return `\x00${idx}\x00`;
    });

    // Step 2: Split by remaining HTML tags (block-level: <br>, <div>, etc.)
    // so they act as natural boundaries and don't leak into fractions.
    const segments = withPlaceholders.split(/(<[^>]*>)/g);

    const processed = segments.map(segment => {
        // Block tags pass straight through.
        if (segment.startsWith('<')) return segment;

        // 笏笏 Fraction formatting 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
        // atom: parenthesised group  OR  a complete placeholder \x00N\x00  OR  plain chars
        // Using alternation so each placeholder is consumed as one unit.
        const atom = '(?:\\([^)]+\\)|\\x00\\d+\\x00|[0-9a-zA-Z*^繝ｻ・ｾ.]+)';
        const fractionRegex = new RegExp(
            `([+\\-]?(?:${atom})+?)\\s*\\/\\s*([+\\-]?(?:${atom})+)`,
            'g'
        );

        let formatted = segment.replace(fractionRegex, (match, num, den) => {
            const clean = (s: string) => {
                let trimmed = s.trim();
                let sign = '';
                if (trimmed.startsWith('-')) { sign = '-'; trimmed = trimmed.substring(1).trim(); }
                else if (trimmed.startsWith('+')) { sign = '+'; trimmed = trimmed.substring(1).trim(); }

                if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                    let count = 0, isMatchingPair = true;
                    for (let i = 0; i < trimmed.length - 1; i++) {
                        if (trimmed[i] === '(') count++;
                        if (trimmed[i] === ')') count--;
                        if (count === 0) { isMatchingPair = false; break; }
                    }
                    if (isMatchingPair && count === 1) {
                        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
                    }
                }
                return { sign, text: trimmed };
            };

            const cNum = clean(num);
            const cDen = clean(den);

            const wrapVarLetters = (input: string) => {
                const UNIT_TOKENS = new Set([
                    'cm', 'mm', 'km', 'm', 'g', 'kg',
                    'l', 'L', 'ml', 'mL', 'dl', 'dL',
                    'h', 's', 'min', 'sec'
                ]);
                const convertExponent = (s: string) => s.replace(
                    /([0-9a-zA-Z\)])\s*[\^繝ｻ・ｾ]\s*(-?[0-9a-zA-Z]+|\{[^}]+\})/g,
                    (m, base, exp) => {
                        const cleanExp = exp.startsWith('{') ? exp.slice(1, -1) : exp;
                        if (base === '1' && cleanExp === '2') return '1';
                        return `${base}<sup class="math-exp">${cleanExp}</sup>`;
                    }
                );
                // Simplify 1^2 and convert exponents inside numerator/denominator before HTML wrapping
                let normalized = input.replace(/1\s*[\^繝ｻ・ｾ]\s*\{?2\}?/g, '1');
                // Preserve placeholders like \x00N\x00
                return normalized.split(/(\x00\d+\x00)/g).map(part => {
                    if (!part || /^\x00\d+\x00$/.test(part)) return part;
                    const withExp = convertExponent(part);
                    const chunks = withExp.split(/(<[^>]*>)/g);
                    for (let i = 0; i < chunks.length; i++) {
                        const ch = chunks[i];
                        if (!ch || ch.startsWith('<')) continue;
                        chunks[i] = ch.replace(/[A-Za-z]+/g, (seq) => {
                            if (UNIT_TOKENS.has(seq)) return seq;
                            return seq.split('').map(c => `<span class="math-var">${c === 'l' ? '?' : c}</span>`).join('');
                        });
                    }
                    return chunks.join('');
                }).join('');
            };

            const numText = wrapVarLetters(cNum.text);
            const denText = wrapVarLetters(cDen.text);

            if (cDen.text === '1' && cDen.sign === '') {
                return `${cNum.sign === '-' ? '-' : ''}${cNum.text}`;
            }

            const signNum = cNum.sign === '-' ? -1 : (cNum.sign === '+' ? 1 : 0);
            const signDen = cDen.sign === '-' ? -1 : (cDen.sign === '+' ? 1 : 0);
            let prefix = '';
            if (signNum === 0 && signDen === 0) { prefix = ''; }
            else if (signNum === 0) { prefix = signDen === -1 ? '-' : '+'; }
            else if (signDen === 0) { prefix = signNum === -1 ? '-' : '+'; }
            else { prefix = (signNum * signDen) === -1 ? '-' : '+'; }

            return `${prefix}<span class="math-fraction"><span class="math-numerator">${numText}</span><span class="math-denominator">${denText}</span></span>`;
        });

        // 笏笏 Exponent formatting 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
        const exponentRegex = /([0-9a-zA-Z\)])[\^繝ｻ・ｾ](-?[0-9a-zA-Z]+|\{[^}]+\})/g;
        formatted = formatted.replace(exponentRegex, (match, base, exp) => {
            const cleanExp = exp.startsWith('{') ? exp.substring(1, exp.length - 1) : exp;
            if (base === '1' && cleanExp === '2') return '1';
            return `${base}<sup class="math-exp">${cleanExp}</sup>`;
        });

        // 笏笏 Variable styling (single-letter variables) 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
        // Wrap letter variables so they can use Cambria Math italics.
        // Avoid common unit tokens (cm, mm, km, kg, m, g, L, mL, dl, h, etc.).
        const UNIT_TOKENS = new Set([
            'cm', 'mm', 'km', 'm', 'g', 'kg',
            'l', 'L', 'ml', 'mL', 'dl', 'dL',
            'h', 's', 'min', 'sec'
        ]);
        const parts = formatted.split(/(<[^>]*>)/g);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || part.startsWith('<')) continue;
            parts[i] = part.replace(/[A-Za-z]+/g, (seq) => {
                if (UNIT_TOKENS.has(seq)) return seq;
                // Wrap each letter (e.g., "ax" -> a and x)
                return seq.split('').map(ch => `<span class="math-var">${ch === 'l' ? '?' : ch}</span>`).join('');
            });
        }
        formatted = parts.join('');

        // 笏笏 Brace wrapping 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
        formatted = formatted
            .replace(/\{/g, '<span class="math-brace">{</span>')
            .replace(/\}/g, '<span class="math-brace">}</span>');

        // Final exponent pass to avoid caret display (e.g., <span class="math-var">x</span>^2)
        formatted = formatted.replace(/(<\/span>)\s*[\^郢晢ｽｻ繝ｻ・ｾ]\s*(-?[0-9a-zA-Z]+|\{[^}]+\})/g, (m, base, exp) => {
            const cleanExp = exp.startsWith('{') ? exp.slice(1, -1) : exp;
            return `${base}<sup class="math-exp">${cleanExp}</sup>`;
        });
        formatted = formatted.replace(/([0-9\)])\s*[\^郢晢ｽｻ繝ｻ・ｾ]\s*(-?[0-9a-zA-Z]+|\{[^}]+\})/g, (m, base, exp) => {
            const cleanExp = exp.startsWith('{') ? exp.slice(1, -1) : exp;
            if (base === '1' && cleanExp === '2') return '1';
            return `${base}<sup class="math-exp">${cleanExp}</sup>`;
        });
        formatted = formatted.replace(/[\^郢晢ｽｻ繝ｻ・ｾ]/g, '');

        return formatted;
    });

    // Step 3: Rejoin and restore inline tags from their placeholders.
    return processed.join('').replace(/\x00(\d+)\x00/g, (_, idx) => tagStore[Number(idx)]);
}







