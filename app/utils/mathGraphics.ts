
export interface Point {
    val: number;
    label?: string; // e.g., "①", "A"
    color?: string;
    above?: boolean; // Label position
}

interface NumberLineOptions {
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    height?: number;
    points?: Point[];
    highlightRange?: { start: number; end: number }; // For inequalities if needed later
    showTicks?: boolean;
    tickInterval?: number;
    labelInterval?: number; // How often to show numbers (-5, 0, 5)
}

export function generateNumberLine(options: NumberLineOptions = {}): string {
    const {
        min = -6,
        max = 6,
        width = 500,
        height = 80,
        points = [],
        tickInterval = 1,
        labelInterval = 1, // Default 1 for now, or 5
    } = options;

    const marginX = 40;
    const axisY = height / 2 + 10;
    const drawWidth = width - marginX * 2;
    const range = max - min;
    const scale = drawWidth / range;

    const getX = (val: number) => marginX + (val - min) * scale;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Times New Roman', serif;">`;

    // Arrow marker
    svg += `
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
        </marker>
    </defs>`;

    // Main Axis (with arrow at end?) Usually number lines in JP math are just lines or arrows at both ends. 
    // Let's stick to simple line for now, maybe small extensions.
    svg += `<line x1="${marginX - 10}" y1="${axisY}" x2="${width - marginX + 10}" y2="${axisY}" stroke="black" stroke-width="1.5" />`;

    // Ticks & Labels
    for (let i = min; i <= max; i += tickInterval) {
        // Fix float precision issues
        const val = Math.round(i * 100) / 100;
        const x = getX(val);

        // Minor or Major tick?
        const isMajor = val % labelInterval === 0 || val === 0; // 0 is always major
        // Actually for standard JP styling: 0, 5, -5 are labeled. 
        // Let's rely on labelInterval.

        // Draw Tick
        const tickHeight = isMajor ? 10 : 6;
        svg += `<line x1="${x}" y1="${axisY - tickHeight}" x2="${x}" y2="${axisY + tickHeight}" stroke="black" stroke-width="${isMajor ? 1.5 : 1}" />`;

        // Draw Number Label
        // Only if it matches specific criteria or strict interval
        // Common pattern: Label 0. Often label -5, 5. Or label all integers if range is small.
        // Let's imply: if labelInterval is 1, label all. If 5, label multiples of 5.
        if (Math.abs(val) % labelInterval === 0 || val === 0) {
            svg += `<text x="${x}" y="${axisY + 24}" text-anchor="middle" font-size="14" fill="black">${val}</text>`;
        }
    }

    // Points
    points.forEach(p => {
        const x = getX(p.val);
        // Dot
        svg += `<circle cx="${x}" cy="${axisY}" r="4" fill="${p.color || 'black'}" />`;

        // Label (e.g. ①)
        if (p.label) {
            const labelY = p.above ? axisY - 20 : axisY - 20; // Default above? User image has labels ABOVE the line with arrows pointing down sometimes, or just dots.
            // Image 1: Dots on line, Labels ① above dots.
            // Image 2: Arrows from Labels pointing to line.

            // Let's do simple: Label above dot.
            svg += `<text x="${x}" y="${labelY}" text-anchor="middle" font-size="14" font-weight="bold" fill="black">${p.label}</text>`;
        }
    });

    svg += `</svg>`;
    return svg;
}

// Answer Sheet specific (just the empty box with a number line)
export function getAnswerSheetNumberLineHTML(): string {
    // A wider range for general answers, usually -6 to 6 or -10 to 10
    return generateNumberLine({ min: -6, max: 6, width: 400, height: 60, labelInterval: 1 }); // Interval 1 for writing answers
}
