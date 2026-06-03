export type Glyph = 'audio' | 'watch' | 'camera' | 'speaker';
export interface MarqetProduct {
    id: string;
    brand: string;
    name: string;
    icon: 'audio' | 'watch' | 'camera' | 'speaker' | 'earbuds';
    price: number;
    old: number | null;
    rate: number;
    rev: string;
    tag: string | null;
}
export declare const glyphOf: (icon: MarqetProduct["icon"]) => Glyph;
